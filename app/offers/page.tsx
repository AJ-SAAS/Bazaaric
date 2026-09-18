"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { getOrdersForUser, acceptOffer, declineOffer, completeOrder, addTrackingNumber, Order, Carrier } from "@/lib/orders";
import { getOrCreateChat } from "@/lib/chat";
import { hasReviewedOrder } from "@/lib/reviews";
import { getPublicProfile } from "@/lib/profiles";
import { createCheckoutSession, requestRefund } from "@/lib/payments";
import ReviewModal from "@/components/reviews/ReviewModal";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { Package, Copy, Check } from "lucide-react";

const CARRIER_TRACK_URLS: Partial<Record<Carrier, (trackingNumber: string) => string>> = {
  omniva: (n) => `https://www.omniva.lv/eng/track?barcode=${encodeURIComponent(n)}`,
  dpd: (n) => `https://tracking.dpd.de/status/en_US/parcel/${encodeURIComponent(n)}`,
  latvijas_pasts: (n) => `https://www.pasts.lv/lv/uzzinas/izsekosana/`,
};

export default function OffersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("offers");

  const statusStyles: Record<Order["status"], string> = {
    offer_pending: "bg-amber-100 text-amber-700",
    offer_accepted: "bg-green-100 text-green-700",
    offer_declined: "bg-red-100 text-red-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<Order["status"], string> = {
    offer_pending: t("pending"),
    offer_accepted: t("accepted"),
    offer_declined: t("declined"),
    completed: t("completed"),
    cancelled: t("cancelled"),
  };

  const carrierLabels: Record<Carrier, string> = {
    omniva: "Omniva",
    dpd: "DPD",
    latvijas_pasts: t("latvijasPasts"),
    other: t("otherCarrier"),
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
  const [reviewTarget, setReviewTarget] = useState<{
    order: Order;
    revieweeId: string;
    revieweeName: string;
  } | null>(null);

  const [trackingFormOrderId, setTrackingFormOrderId] = useState<string | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [carrierInput, setCarrierInput] = useState<Carrier>("omniva");
  const [savingTracking, setSavingTracking] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/register");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getOrdersForUser(user.uid)
      .then(async (data) => {
        setOrders(data);

        const completed = data.filter((o) => o.status === "completed");
        const checks = await Promise.all(
          completed.map(async (o) => {
            const reviewed = await hasReviewedOrder(o.id, user.uid);
            return reviewed ? o.id : null;
          })
        );
        setReviewedOrderIds(new Set(checks.filter((id): id is string => id !== null)));
      })
      .catch((err) => setOrdersError(err.message))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  async function handleAccept(order: Order) {
    if (!user) return;

    const profile = await getPublicProfile(user.uid);
    if (!profile?.stripeChargesEnabled) {
      if (confirm(t("needPayoutsToAccept"))) {
        router.push("/profile");
      }
      return;
    }

    setActingOn(order.id);
    try {
      await acceptOffer(order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "offer_accepted" } : o))
      );
    } finally {
      setActingOn(null);
    }
  }

  async function handleDecline(order: Order) {
    setActingOn(order.id);
    try {
      await declineOffer(order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "offer_declined" } : o))
      );
    } finally {
      setActingOn(null);
    }
  }

  async function handleComplete(order: Order) {
    setActingOn(order.id);
    try {
      await completeOrder(order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "completed" } : o))
      );
    } finally {
      setActingOn(null);
    }
  }

  async function handlePayNow(order: Order) {
    setActingOn(order.id);
    try {
      const url = await createCheckoutSession(order.id);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message || t("couldntStartCheckout"));
    } finally {
      setActingOn(null);
    }
  }

  async function handleCancelAndRefund(order: Order) {
    if (!confirm(t("confirmCancelAndRefund"))) {
      return;
    }

    setActingOn(order.id);
    try {
      await requestRefund(order.id);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, status: "cancelled", paymentStatus: "refunded" }
            : o
        )
      );
    } catch (err: any) {
      alert(err.message || t("couldntProcessRefund"));
    } finally {
      setActingOn(null);
    }
  }

  async function handleOpenChat(order: Order) {
    const chatId = await getOrCreateChat({
      listingId: order.listingId,
      listingTitle: order.listingTitle,
      listingImage: order.listingImage,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
    });
    router.push(`/chat/${chatId}`);
  }

  async function handleOpenReview(order: Order) {
    if (!user) return;
    const isSeller = order.sellerId === user.uid;
    const revieweeId = isSeller ? order.buyerId : order.sellerId;

    const profile = await getPublicProfile(revieweeId);
    setReviewTarget({
      order,
      revieweeId,
      revieweeName: profile?.username || (isSeller ? t("theBuyer") : t("theSeller")),
    });
  }

  function handleReviewSubmitted() {
    if (reviewTarget) {
      setReviewedOrderIds((prev) => new Set(prev).add(reviewTarget.order.id));
    }
    setReviewTarget(null);
  }

  function openTrackingForm(order: Order) {
    setTrackingFormOrderId(order.id);
    setTrackingNumberInput(order.trackingNumber || "");
    setCarrierInput(order.carrier || "omniva");
  }

  async function handleSaveTracking(order: Order) {
    const trimmed = trackingNumberInput.trim();
    if (!trimmed) return;

    setSavingTracking(true);
    try {
      await addTrackingNumber(order.id, trimmed, carrierInput);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, trackingNumber: trimmed, carrier: carrierInput }
            : o
        )
      );
      setTrackingFormOrderId(null);
    } catch (err: any) {
      alert(err.message || t("couldntSaveTracking"));
    } finally {
      setSavingTracking(false);
    }
  }

  function handleCopyTracking(order: Order) {
    if (!order.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber).then(() => {
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    });
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const buying = orders.filter((o) => o.buyerId === user.uid);
  const selling = orders.filter((o) => o.sellerId === user.uid);

  const purchasesMade = buying.filter((o) => o.isDirect);
  const offersMade = buying.filter((o) => !o.isDirect);
  const salesReceived = selling.filter((o) => o.isDirect);
  const offersReceived = selling.filter((o) => !o.isDirect);

  function OrderRow({ order }: { order: Order }) {
    const isSeller = order.sellerId === user!.uid;
    const alreadyReviewed = reviewedOrderIds.has(order.id);
    const canRefund = order.paymentStatus === "paid";
    const isPaidOrCompleted = order.paymentStatus === "paid" || order.status === "completed";
    const showTrackingForm = trackingFormOrderId === order.id;
    const trackUrl = order.trackingNumber && order.carrier
      ? CARRIER_TRACK_URLS[order.carrier]?.(order.trackingNumber)
      : undefined;

    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-4">
          <Link
            href={`/item/${order.listingId}`}
            className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100"
          >
            <img
              src={order.listingImage || "https://via.placeholder.com/200"}
              alt={order.listingTitle}
              className="h-full w-full object-cover"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{order.listingTitle}</p>
            {order.isDirect ? (
              <p className="text-xs text-gray-500">
                <span className="font-semibold">€{order.offerAmount}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {t("offeredLabel")} <span className="font-semibold">€{order.offerAmount}</span>{" "}
                <span className="line-through">€{order.originalPrice}</span>
              </p>
            )}
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
          >
            {statusLabels[order.status]}
          </span>
        </div>

        {/* Shipping status — buyer view */}
        {!isSeller && isPaidOrCompleted && (
          <div className="mt-3 rounded-xl bg-gray-50 p-3">
            {order.trackingNumber ? (
              <div className="flex items-start gap-2">
                <Package size={16} className="mt-0.5 shrink-0 text-teal" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900">
                    {t("shippedVia", { carrier: order.carrier ? carrierLabels[order.carrier] : t("otherCarrier") })}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-700 break-all">{order.trackingNumber}</span>
                    <button
                      onClick={() => handleCopyTracking(order)}
                      className="shrink-0 text-gray-400 hover:text-gray-600"
                      aria-label={t("copyTracking")}
                    >
                      {copiedOrderId === order.id ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                  {trackUrl && (
                    <a
                      href={trackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-block text-xs font-semibold text-teal hover:underline"
                    >
                      {t("trackPackage")} →
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-xs text-gray-500">
                <Package size={16} className="shrink-0" />
                {t("sellerPreparingOrder")}
              </p>
            )}
          </div>
        )}

        {/* Tracking entry/edit — seller view */}
        {isSeller && isPaidOrCompleted && (
          <div className="mt-3">
            {showTrackingForm ? (
              <div className="rounded-xl bg-gray-50 p-3 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={carrierInput}
                    onChange={(e) => setCarrierInput(e.target.value as Carrier)}
                    className="rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                  >
                    <option value="omniva">Omniva</option>
                    <option value="dpd">DPD</option>
                    <option value="latvijas_pasts">{t("latvijasPasts")}</option>
                    <option value="other">{t("otherCarrier")}</option>
                  </select>

                  <input
                    type="text"
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    placeholder={t("trackingNumberPlaceholder")}
                    className="flex-1 rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveTracking(order)}
                    disabled={savingTracking || !trackingNumberInput.trim()}
                    className="rounded-full bg-teal px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
                  >
                    {savingTracking ? t("saving") : t("saveTracking")}
                  </button>
                  <button
                    onClick={() => setTrackingFormOrderId(null)}
                    className="rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openTrackingForm(order)}
                className="flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Package size={13} />
                {order.trackingNumber ? t("updateTracking") : t("addTracking")}
              </button>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => handleOpenChat(order)}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            {t("openChat")}
          </button>

          {isSeller && !order.isDirect && order.status === "offer_pending" && (
            <>
              <button
                onClick={() => handleAccept(order)}
                disabled={actingOn === order.id}
                className="rounded-full bg-teal px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
              >
                {t("accept")}
              </button>
              <button
                onClick={() => handleDecline(order)}
                disabled={actingOn === order.id}
                className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {t("decline")}
              </button>
            </>
          )}

          {!isSeller && order.status === "offer_accepted" && order.paymentStatus !== "paid" && (
            <button
              onClick={() => handlePayNow(order)}
              disabled={actingOn === order.id}
              className="rounded-full bg-teal px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
            >
              {actingOn === order.id ? t("redirecting") : t("payNow")}
            </button>
          )}

          {order.status === "offer_accepted" && order.paymentStatus !== "paid" && (
            <button
              onClick={() => handleComplete(order)}
              disabled={actingOn === order.id}
              className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              {actingOn === order.id ? t("marking") : t("markAsCompleted")}
            </button>
          )}

          {canRefund && (
            <button
              onClick={() => handleCancelAndRefund(order)}
              disabled={actingOn === order.id}
              className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {actingOn === order.id ? t("processing") : t("cancelAndRefund")}
            </button>
          )}

          {order.status === "completed" && (
            alreadyReviewed ? (
              <span className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-500">
                {t("reviewed")}
              </span>
            ) : (
              <button
                onClick={() => handleOpenReview(order)}
                className="rounded-full border border-teal px-4 py-1.5 text-xs font-semibold text-teal hover:bg-teal/5"
              >
                {t("leaveAReview")}
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  function OrderSection({ title, items }: { title: string; items: Order[] }) {
    return (
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {title}
        </h2>

        {ordersLoading ? (
          <p className="text-sm text-gray-500">{t("loading")}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">{t("nothingHereYet")}</p>
        ) : (
          <div className="space-y-3">
            {items.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold">{t("title")}</h1>

        {ordersError && (
          <p className="mt-4 text-sm text-red-600">
            {t("couldntLoadOffers", { error: ordersError })}
          </p>
        )}

        <OrderSection title={t("yourPurchases")} items={purchasesMade} />
        <OrderSection title={t("offersYouveMade")} items={offersMade} />
        <OrderSection title={t("yourSales")} items={salesReceived} />
        <OrderSection title={t("offersYouveReceived")} items={offersReceived} />
      </div>

      {reviewTarget && (
        <ReviewModal
          orderId={reviewTarget.order.id}
          reviewerId={user.uid}
          revieweeId={reviewTarget.revieweeId}
          revieweeName={reviewTarget.revieweeName}
          onClose={() => setReviewTarget(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </main>
  );
}
