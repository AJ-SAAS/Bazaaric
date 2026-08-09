"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getOrdersForUser, acceptOffer, declineOffer, Order } from "@/lib/orders";
import { getOrCreateChat } from "@/lib/chat";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

const statusStyles: Record<Order["status"], string> = {
  offer_pending: "bg-amber-100 text-amber-700",
  offer_accepted: "bg-green-100 text-green-700",
  offer_declined: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<Order["status"], string> = {
  offer_pending: "Pending",
  offer_accepted: "Accepted",
  offer_declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function OffersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getOrdersForUser(user.uid)
      .then(setOrders)
      .catch((err) => setOrdersError(err.message))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  async function handleAccept(order: Order) {
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

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const buying = orders.filter((o) => o.buyerId === user.uid);
  const selling = orders.filter((o) => o.sellerId === user.uid);

  function OrderRow({ order }: { order: Order }) {
    const isSeller = order.sellerId === user!.uid;

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
            <p className="text-xs text-gray-500">
              Offered <span className="font-semibold">€{order.offerAmount}</span>{" "}
              <span className="line-through">€{order.originalPrice}</span>
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
          >
            {statusLabels[order.status]}
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => handleOpenChat(order)}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Open chat
          </button>

          {isSeller && order.status === "offer_pending" && (
            <>
              <button
                onClick={() => handleAccept(order)}
                disabled={actingOn === order.id}
                className="rounded-full bg-[#2F855A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#276749] disabled:opacity-60"
              >
                Accept
              </button>
              <button
                onClick={() => handleDecline(order)}
                disabled={actingOn === order.id}
                className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Decline
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold">Offers</h1>

        {ordersError && (
          <p className="mt-4 text-sm text-red-600">
            Couldn't load offers: {ordersError}
          </p>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Offers you've made
          </h2>

          {ordersLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : buying.length === 0 ? (
            <p className="text-sm text-gray-500">No offers made yet.</p>
          ) : (
            <div className="space-y-3">
              {buying.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Offers you've received
          </h2>

          {ordersLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : selling.length === 0 ? (
            <p className="text-sm text-gray-500">No offers received yet.</p>
          ) : (
            <div className="space-y-3">
              {selling.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}