"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getListing, deleteListing, updateListing, Listing } from "@/lib/listings";
import { useAuth } from "@/lib/auth-context";
import { getOrCreateChat, sendMessage } from "@/lib/chat";
import { createOffer } from "@/lib/orders";
import { addFavorite, removeFavorite, getUserFavoriteIds } from "@/lib/favorites";
import { reportListing } from "@/lib/moderation";
import Navbar from "@/components/layout/Navbar";
import ReportModal from "@/components/moderation/ReportModal";
import { Heart, ShieldAlert, X, Flag } from "lucide-react";

export default function ItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [messaging, setMessaging] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState("");

  const [showReportModal, setShowReportModal] = useState(false);

  // Swipe gesture refs — don't trigger re-renders on every touch move
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    if (!id) return;
    getListing(id).then(setListing).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    getUserFavoriteIds(user.uid).then((ids) => setIsFavorited(ids.has(id)));
  }, [user, id]);

  async function handleToggleFavorite() {
    if (!user) {
      router.push(`/auth?redirect=/item/${id}`);
      return;
    }
    const next = !isFavorited;
    setIsFavorited(next);
    try {
      if (next) {
        await addFavorite(user.uid, id);
      } else {
        await removeFavorite(user.uid, id);
      }
    } catch {
      setIsFavorited(!next);
    }
  }

  async function handleMessageSeller() {
    if (!user) {
      router.push(`/auth?redirect=/item/${id}`);
      return;
    }
    if (!listing) return;

    setMessaging(true);
    try {
      const chatId = await getOrCreateChat({
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.imageUrls[0] || "",
        buyerId: user.uid,
        sellerId: listing.sellerId,
      });
      router.push(`/chat/${chatId}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMessaging(false);
    }
  }

  function openOfferModal() {
    if (!user) {
      router.push(`/auth?redirect=/item/${id}`);
      return;
    }
    setOfferError("");
    setOfferAmount("");
    setShowOfferModal(true);
  }

  async function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !listing) return;

    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) {
      setOfferError("Enter a valid offer amount.");
      return;
    }

    setSubmittingOffer(true);
    setOfferError("");

    try {
      await createOffer({
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.imageUrls[0] || "",
        originalPrice: listing.price,
        offerAmount: amount,
        buyerId: user.uid,
        buyerEmail: user.email || "",
        sellerId: listing.sellerId,
        sellerEmail: listing.sellerEmail,
      });

      const chatId = await getOrCreateChat({
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.imageUrls[0] || "",
        buyerId: user.uid,
        sellerId: listing.sellerId,
      });

      await sendMessage(
        chatId,
        user.uid,
        `💬 Offered €${amount.toFixed(2)} for "${listing.title}" (listed at €${listing.price.toFixed(2)})`
      );

      setShowOfferModal(false);
      router.push(`/chat/${chatId}`);
    } catch (err: any) {
      setOfferError(err.message || "Couldn't send your offer. Try again.");
    } finally {
      setSubmittingOffer(false);
    }
  }

  async function handleMarkAsSold() {
    if (!listing) return;
    setUpdating(true);
    try {
      await updateListing(listing.id, { status: "sold" });
      setListing({ ...listing, status: "sold" });
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!listing) return;
    if (!confirm("Delete this listing? This can't be undone.")) return;

    setUpdating(true);
    try {
      await deleteListing(listing.id);
      router.push("/profile");
    } finally {
      setUpdating(false);
    }
  }

  async function handleReportSubmit(reason: any, details: string) {
    if (!user || !listing) return;
    await reportListing({
      reporterId: user.uid,
      listingId: listing.id,
      listingTitle: listing.title,
      sellerId: listing.sellerId,
      reason,
      details,
    });
  }

  // --- Swipe gesture handlers for the main image ---
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }

  function handleTouchEnd() {
    if (!listing) return;
    const threshold = 40; // px swipe needed before it counts

    if (touchDeltaX.current > threshold) {
      setActiveImage((prev) => Math.max(prev - 1, 0));
    } else if (touchDeltaX.current < -threshold) {
      setActiveImage((prev) => Math.min(prev + 1, listing.imageUrls.length - 1));
    }
    touchDeltaX.current = 0;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold">Listing not found</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-full bg-teal px-6 py-2.5 text-sm font-semibold text-white"
        >
          Back to home
        </button>
      </main>
    );
  }

  const isOwnListing = user?.uid === listing.sellerId;

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-5xl px-4 md:px-8 pt-6 md:pt-10">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div
              className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 select-none"
              style={{ touchAction: "pan-y" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={listing.imageUrls[activeImage]}
                alt={listing.title}
                draggable={false}
                className={`h-full w-full object-cover transition-opacity duration-150 ${
                  listing.status === "sold" ? "opacity-50" : ""
                }`}
              />

              {listing.status === "sold" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-black/70 px-4 py-1.5 text-sm font-semibold text-white">
                    SOLD
                  </span>
                </div>
              )}

              {!isOwnListing && (
                <button
                  onClick={handleToggleFavorite}
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm"
                >
                  <Heart size={18} className={isFavorited ? "fill-red-500 text-red-500" : ""} />
                </button>
              )}

              {listing.imageUrls.length > 1 && (
                <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5 md:hidden">
                  {listing.imageUrls.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        activeImage === i ? "w-4 bg-white" : "w-1.5 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {listing.imageUrls.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {listing.imageUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 ${
                      activeImage === i ? "ring-teal" : "ring-transparent"
                    }`}
                  >
                    <img src={url} alt={`Thumbnail ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-0">
            <p className="text-2xl md:text-3xl font-bold">€{listing.price}</p>
            <h1 className="mt-2 text-xl md:text-2xl font-semibold break-words">{listing.title}</h1>

            {listing.description && (
              <p className="mt-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap break-words">
                {listing.description}
              </p>
            )}

            {/* Specs table */}
            <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 divide-y divide-gray-100">
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">Category</span>
                <span className="font-medium break-words text-right">{listing.category}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">Location</span>
                <span className="font-medium break-words text-right">{listing.location}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">Available</span>
                <span className="font-medium">
                  {listing.quantity > 1 ? `${listing.quantity} in stock` : "1 available"}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-gray-500">Seller</p>
              <p className="mt-1 font-semibold break-all">{listing.sellerEmail}</p>
            </div>

            {isOwnListing ? (
              <div className="mt-6 space-y-2">
                {listing.status !== "sold" && (
                  <>
                    <button
                      onClick={() => router.push(`/sell?edit=${listing.id}`)}
                      className="w-full rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Edit listing
                    </button>

                    <button
                      onClick={handleMarkAsSold}
                      disabled={updating}
                      className="w-full rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
                    >
                      Mark as sold
                    </button>
                  </>
                )}

                <button
                  onClick={handleDelete}
                  disabled={updating}
                  className="w-full rounded-full border border-red-300 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Delete listing
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                <button
                  onClick={handleMessageSeller}
                  disabled={messaging || listing.status === "sold"}
                  className="w-full rounded-full bg-teal px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-dark disabled:opacity-60"
                >
                  {listing.status === "sold"
                    ? "This item is sold"
                    : messaging
                    ? "Starting chat..."
                    : "Message seller"}
                </button>

                {listing.status !== "sold" && (
                  <button
                    onClick={openOfferModal}
                    className="w-full rounded-full border border-teal px-6 py-3.5 text-sm font-semibold text-teal transition hover:bg-teal/5"
                  >
                    Make an offer
                  </button>
                )}
              </div>
            )}

            {/* Safety disclaimer */}
            {!isOwnListing && (
              <div className="mt-6 flex gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <ShieldAlert size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <p className="text-xs leading-relaxed text-amber-800">
                  Bazaaric does not process payments or verify buyers and
                  sellers. All arrangements — including price, payment, and
                  delivery or pickup — happen directly between you and the
                  other party, entirely outside the platform. Meet in a safe,
                  public location, inspect items before paying, and never
                  send money before confirming what you're receiving. See
                  our{" "}
                  <a href="/terms" className="underline font-medium" target="_blank">
                    Terms of Service
                  </a>{" "}
                  for full details.
                </p>
              </div>
            )}

            {!isOwnListing && (
              <button
                onClick={() => {
                  if (!user) {
                    router.push(`/auth?redirect=/item/${id}`);
                    return;
                  }
                  setShowReportModal(true);
                }}
                className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600"
              >
                <Flag size={13} />
                Report this listing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Make an offer modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Make an offer</h3>
              <button onClick={() => setShowOfferModal(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Listed at <span className="font-semibold">€{listing.price}</span>
            </p>

            <form onSubmit={handleSubmitOffer} className="space-y-3">
              <div className="flex items-center gap-1 rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-black/10">
                <span className="text-sm text-gray-500">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full bg-transparent text-base md:text-sm outline-none placeholder:text-gray-400"
                />
              </div>

              {offerError && <p className="text-sm text-red-600">{offerError}</p>}

              <button
                type="submit"
                disabled={submittingOffer}
                className="w-full rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
              >
                {submittingOffer ? "Sending..." : "Send offer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showReportModal && (
        <ReportModal
          title="Report this listing"
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </main>
  );
}