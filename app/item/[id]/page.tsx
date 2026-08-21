"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getListing,
  deleteListing,
  updateListing,
  Listing,
} from "@/lib/listings";
import { useAuth } from "@/lib/auth-context";
import { getOrCreateChat, sendMessage } from "@/lib/chat";
import { createOffer, createDirectOrder } from "@/lib/orders";
import { createCheckoutSession } from "@/lib/payments";
import {
  addFavorite,
  removeFavorite,
  getUserFavoriteIds,
} from "@/lib/favorites";
import { reportListing } from "@/lib/moderation";
import { getPublicProfile, PublicProfile } from "@/lib/profiles";
import {
  getRatingStats,
  getReviewsForUser,
  RatingStats,
  Review,
} from "@/lib/reviews";
import Navbar from "@/components/layout/Navbar";
import ReportModal from "@/components/moderation/ReportModal";
import {
  Heart,
  ShieldAlert,
  X,
  Flag,
  Star,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

type ReviewWithReviewer = Review & { reviewerName: string };

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
  const [buyingNow, setBuyingNow] = useState(false);

  const [sellerProfile, setSellerProfile] =
    useState<PublicProfile | null>(null);
  const [sellerStats, setSellerStats] = useState<RatingStats | null>(null);
  const [sellerReviews, setSellerReviews] = useState<ReviewWithReviewer[]>([]);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState("");

  const [showReportModal, setShowReportModal] = useState(false);

  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    if (!id) return;

    getListing(id)
      .then(setListing)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!listing) return;

    getPublicProfile(listing.sellerId).then(setSellerProfile);
    getRatingStats(listing.sellerId).then(setSellerStats);

    getReviewsForUser(listing.sellerId)
      .then(async (reviews) => {
        const withNames = await Promise.all(
          reviews.map(async (review) => {
            try {
              const reviewerProfile = await getPublicProfile(
                review.reviewerId
              );

              return {
                ...review,
                reviewerName:
                  reviewerProfile?.username || "Bazaaric user",
              };
            } catch {
              return {
                ...review,
                reviewerName: "Bazaaric user",
              };
            }
          })
        );

        setSellerReviews(withNames);
      })
      .catch((err) =>
        console.error("FAILED: getReviewsForUser", err)
      );
  }, [listing]);

  useEffect(() => {
    if (!user || !id) return;

    getUserFavoriteIds(user.uid).then((ids) =>
      setIsFavorited(ids.has(id))
    );
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
      const orderId = await createOffer({
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
        `💬 Offered €${amount.toFixed(
          2
        )} for "${listing.title}" (listed at €${listing.price.toFixed(
          2
        )})`,
        listing.imageUrls[0] || undefined,
        orderId
      );

      setShowOfferModal(false);
      router.push(`/chat/${chatId}`);
    } catch (err: any) {
      setOfferError(
        err.message || "Couldn't send your offer. Try again."
      );
    } finally {
      setSubmittingOffer(false);
    }
  }

  async function handleBuyNow() {
    if (!user) {
      router.push(`/auth?redirect=/item/${id}`);
      return;
    }
    if (!listing) return;

    setBuyingNow(true);

    try {
      const orderId = await createDirectOrder({
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.imageUrls[0] || "",
        originalPrice: listing.price,
        offerAmount: listing.price,
        buyerId: user.uid,
        buyerEmail: user.email || "",
        sellerId: listing.sellerId,
        sellerEmail: listing.sellerEmail,
      });

      const url = await createCheckoutSession(orderId);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message || "Couldn't start checkout. Try again.");
      setBuyingNow(false);
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

    if (!confirm("Delete this listing? This can't be undone.")) {
      return;
    }

    setUpdating(true);

    try {
      await deleteListing(listing.id);
      router.push("/profile");
    } finally {
      setUpdating(false);
    }
  }

  async function handleReportSubmit(
    reason: any,
    details: string
  ) {
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

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchDeltaX.current =
      e.touches[0].clientX - touchStartX.current;
  }

  function handleTouchEnd() {
    if (!listing) return;

    const threshold = 25;

    if (touchDeltaX.current > threshold) {
      setActiveImage((prev) => Math.max(prev - 1, 0));
    } else if (touchDeltaX.current < -threshold) {
      setActiveImage((prev) =>
        Math.min(prev + 1, listing.imageUrls.length - 1)
      );
    }

    touchDeltaX.current = 0;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center bg-[#faf9f6]">
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

  const sellerDisplayName =
    sellerProfile?.username || "Bazaaric seller";

  const sellerInitial =
    sellerDisplayName.charAt(0).toUpperCase();

  const sellerCanReceivePayments = !!sellerProfile?.stripeChargesEnabled;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-[1600px] px-4 pt-6 md:px-8 md:pt-8 lg:px-10">
        {/* ============================================================
            FIRST FOLD
        ============================================================ */}

        <div className="grid min-w-0 gap-8 md:grid-cols-[minmax(0,1.45fr)_minmax(400px,0.95fr)] lg:gap-12 xl:gap-16">
          {/* ==========================================================
              IMAGE / GALLERY
          ========================================================== */}

          <div className="min-w-0">
            <div className="flex items-start gap-3 md:gap-4">
              {/* Desktop thumbnails */}
              {listing.imageUrls.length > 1 && (
                <div className="hidden w-[72px] shrink-0 flex-col gap-3 md:flex">
                  {listing.imageUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      aria-label={`View image ${i + 1}`}
                      className={`h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-[#f3f3f3] transition ${
                        activeImage === i
                          ? "border-2 border-gray-900"
                          : "border-2 border-transparent hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Thumbnail ${i + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="min-w-0 flex-1">
                <div
                  className="relative h-[480px] w-full overflow-hidden rounded-2xl bg-[#f1f1f1] select-none sm:h-[540px] md:h-[580px] lg:h-[620px] xl:h-[650px]"
                  style={{ touchAction: "pan-y" }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img
                    src={listing.imageUrls[activeImage]}
                    alt={listing.title}
                    draggable={false}
                    className="h-full w-full object-contain p-4 sm:p-6"
                    style={{
                      opacity:
                        listing.status === "sold" ? 0.5 : 1,
                    }}
                  />

                  {/* Sold overlay */}
                  {listing.status === "sold" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-black/70 px-5 py-2 text-sm font-semibold text-white">
                        SOLD
                      </span>
                    </div>
                  )}

                  {/* Favorite */}
                  {!isOwnListing && (
                    <button
                      onClick={handleToggleFavorite}
                      aria-label={
                        isFavorited
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-105"
                    >
                      <Heart
                        size={20}
                        strokeWidth={1.8}
                        className={
                          isFavorited
                            ? "fill-red-500 text-red-500"
                            : "text-gray-800"
                        }
                      />
                    </button>
                  )}

                  {/* Mobile image indicators */}
                  {listing.imageUrls.length > 1 && (
                    <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 md:hidden">
                      {listing.imageUrls.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 rounded-full transition-all ${
                            activeImage === i
                              ? "w-5 bg-gray-900"
                              : "w-1.5 bg-gray-900/30"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile thumbnails */}
                {listing.imageUrls.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
                    {listing.imageUrls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        aria-label={`View image ${i + 1}`}
                        className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f1f1f1] ${
                          activeImage === i
                            ? "border-2 border-gray-900"
                            : "border-2 border-transparent"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${i + 1}`}
                          className="h-full w-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==========================================================
              DETAILS
          ========================================================== */}

          <div className="min-w-0 md:pt-1">
            {/* Title */}
            <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight text-gray-950 md:text-[30px] md:leading-[1.15]">
              {listing.title}
            </h1>

            {/* Seller */}
            <div className="mt-5 flex items-center justify-between gap-4 border-b border-gray-200 pb-5">
              <Link
                href={`/seller/${listing.sellerId}`}
                className="flex min-w-0 items-center gap-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {sellerInitial}
                </span>

                <span className="min-w-0">
                  <span className="block break-words font-semibold text-gray-900">
                    {sellerDisplayName}
                  </span>

                  {sellerStats && sellerStats.count > 0 ? (
                    <span className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500">
                      <Star
                        size={12}
                        className="fill-amber-400 text-amber-400"
                      />

                      <span>
                        {sellerStats.average.toFixed(1)}
                      </span>

                      <span>·</span>

                      <span>
                        {sellerStats.positivePercent}% positive
                      </span>

                      <span>·</span>

                      <span>Seller's other items</span>

                      <ChevronRight size={12} />
                    </span>
                  ) : (
                    <span className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      No reviews yet
                      <span>·</span>
                      Seller's other items
                      <ChevronRight size={12} />
                    </span>
                  )}
                </span>
              </Link>

              {!isOwnListing && (
                <button
                  onClick={handleMessageSeller}
                  disabled={
                    messaging || listing.status === "sold"
                  }
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <MessageCircle size={14} />

                  {messaging ? "Opening..." : "Message"}
                </button>
              )}
            </div>

            {/* Price */}
            <p className="mt-6 text-3xl font-bold tracking-tight text-gray-950">
              €{listing.price}
            </p>

            {/* Specifications */}
            <div className="mt-6 border-y border-gray-200">
              <div className="flex items-center gap-4 border-b border-gray-100 py-4 text-sm">
                <span className="w-28 shrink-0 text-gray-500">Category</span>
                <span className="min-w-0 break-words font-medium text-gray-900">{listing.category}</span>
              </div>

              <div className="flex items-center gap-4 border-b border-gray-100 py-4 text-sm">
                <span className="w-28 shrink-0 text-gray-500">Condition</span>
                <span className="min-w-0 break-words font-medium text-gray-900">
                  {listing.condition === "new"
                    ? "Brand new"
                    : listing.condition === "used"
                      ? "Used"
                      : "Not specified"}
                </span>
              </div>

              <div className="flex items-center gap-4 border-b border-gray-100 py-4 text-sm">
                <span className="w-28 shrink-0 text-gray-500">Location</span>
                <span className="min-w-0 break-words font-medium text-gray-900">{listing.location}</span>
              </div>

              <div className="flex items-center gap-4 py-4 text-sm">
                <span className="w-28 shrink-0 text-gray-500">Available</span>
                <span className="font-medium text-gray-900">
                  {listing.quantity > 1
                    ? `${listing.quantity} in stock`
                    : "1 available"}
                </span>
              </div>
            </div>

            {/* ========================================================
                ACTIONS
            ======================================================== */}

            {isOwnListing ? (
              <div className="mt-6 space-y-2">
                {!sellerCanReceivePayments && listing.status !== "sold" && (
                  <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                    <p className="text-sm font-semibold text-amber-800">
                      Buyers can't use Buy Now on this listing yet
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Set up payouts so buyers can purchase instantly, and so you can accept offers and get paid.
                    </p>
                    <Link
                      href="/profile"
                      className="mt-3 inline-block rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                    >
                      Set up payouts
                    </Link>
                  </div>
                )}

                {listing.status !== "sold" && (
                  <>
                    <button
                      onClick={() =>
                        router.push(`/sell?edit=${listing.id}`)
                      }
                      className="w-full rounded-full border border-gray-300 px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Edit listing
                    </button>

                    <button
                      onClick={handleMarkAsSold}
                      disabled={updating}
                      className="w-full rounded-full bg-teal px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-dark disabled:opacity-60"
                    >
                      {updating
                        ? "Updating..."
                        : "Mark as sold"}
                    </button>
                  </>
                )}

                <button
                  onClick={handleDelete}
                  disabled={updating}
                  className="w-full rounded-full border border-red-300 px-6 py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Delete listing
                </button>
              </div>
            ) : (
              listing.status !== "sold" && (
                <div className="mt-6 space-y-2">
                  {sellerCanReceivePayments && (
                    <button
                      onClick={handleBuyNow}
                      disabled={buyingNow}
                      className="w-full rounded-full bg-teal px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-dark disabled:opacity-60"
                    >
                      {buyingNow ? "Redirecting to checkout..." : "Buy now"}
                    </button>
                  )}

                  <button
                    onClick={openOfferModal}
                    className={
                      sellerCanReceivePayments
                        ? "w-full rounded-full border border-teal px-6 py-3.5 text-sm font-semibold text-teal transition hover:bg-teal/5"
                        : "w-full rounded-full bg-teal px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-dark"
                    }
                  >
                    Make an offer
                  </button>
                </div>
              )
            )}

            {/* ========================================================
                SAFETY WARNING
            ======================================================== */}

            {!isOwnListing && (
              <div className="mt-6 flex gap-3 border-t border-amber-200 pt-5">
                <ShieldAlert
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <p className="min-w-0 break-words text-xs leading-relaxed text-gray-600">
                  Bazaaric does not process payments or verify buyers
                  and sellers. All arrangements — including price,
                  payment, and delivery or pickup — happen directly
                  between you and the other party, entirely outside
                  the platform. Meet in a safe, public location,
                  inspect items before paying, and never send money
                  before confirming what you're receiving. See our{" "}
                  <a
                    href="/terms"
                    className="font-medium underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Service
                  </a>{" "}
                  for full details.
                </p>
              </div>
            )}

            {/* Report */}
            {!isOwnListing && (
              <button
                onClick={() => {
                  if (!user) {
                    router.push(`/auth?redirect=/item/${id}`);
                    return;
                  }

                  setShowReportModal(true);
                }}
                className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 transition hover:text-red-600"
              >
                <Flag size={13} />
                Report this listing
              </button>
            )}
          </div>
        </div>

        {/* ============================================================
            BELOW THE FOLD — DESCRIPTION
        ============================================================ */}

        {listing.description && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-semibold text-gray-950">
              Description
            </h2>

            <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">
              {listing.description}
            </p>
          </div>
        )}

        {/* ============================================================
            BELOW THE FOLD — SELLER REVIEWS
        ============================================================ */}

        <div className="mt-10 border-t border-gray-200 pb-4 pt-8">
          <h2 className="text-lg font-semibold text-gray-950">
            Reviews for {sellerDisplayName}{" "}
            {sellerStats && sellerStats.count > 0
              ? `(${sellerStats.count})`
              : ""}
          </h2>

          {sellerReviews.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              No reviews yet.
            </p>
          ) : (
            <div className="mt-4 max-w-3xl space-y-3">
              {sellerReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="break-words text-sm font-semibold">
                      {review.reviewerName}
                    </span>

                    <span className="flex shrink-0 items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={14}
                          className={
                            n <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700">
                      {review.comment}
                    </p>
                  )}

                  {review.createdAt && (
                    <p className="mt-2 text-xs text-gray-400">
                      {review.createdAt
                        .toDate()
                        .toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/seller/${listing.sellerId}`}
            className="mt-4 inline-block text-sm font-semibold text-teal hover:underline"
          >
            View all of {sellerDisplayName}'s listings →
          </Link>
        </div>
      </div>

      {/* ==============================================================
          MAKE AN OFFER MODAL
      ============================================================== */}

      {showOfferModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-4 md:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Make an offer
              </h3>

              <button
                onClick={() => setShowOfferModal(false)}
                aria-label="Close"
                className="rounded-full p-1 transition hover:bg-gray-100"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-500">
              Listed at{" "}
              <span className="font-semibold text-gray-900">
                €{listing.price}
              </span>
            </p>

            <form
              onSubmit={handleSubmitOffer}
              className="space-y-3"
            >
              <div className="flex items-center gap-1 rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-black/10">
                <span className="text-sm text-gray-500">
                  €
                </span>

                <input
                  type="number"
                  step="0.01"
                  value={offerAmount}
                  onChange={(e) =>
                    setOfferAmount(e.target.value)
                  }
                  placeholder="0.00"
                  autoFocus
                  className="w-full bg-transparent text-base outline-none placeholder:text-gray-400 md:text-sm"
                />
              </div>

              {offerError && (
                <p className="text-sm text-red-600">
                  {offerError}
                </p>
              )}

              <button
                type="submit"
                disabled={submittingOffer}
                className="w-full rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
              >
                {submittingOffer
                  ? "Sending..."
                  : "Send offer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          REPORT MODAL
      ============================================================== */}

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