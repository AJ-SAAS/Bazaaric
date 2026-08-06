"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getListing, deleteListing, updateListing, Listing } from "@/lib/listings";
import { useAuth } from "@/lib/auth-context";
import { getOrCreateChat } from "@/lib/chat";
import { addFavorite, removeFavorite, getUserFavoriteIds } from "@/lib/favorites";
import Navbar from "@/components/layout/Navbar";
import { Heart } from "lucide-react";

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
      router.push("/auth");
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
      router.push("/auth");
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
          className="rounded-full bg-[#2F855A] px-6 py-2.5 text-sm font-semibold text-white"
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
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={listing.imageUrls[activeImage]}
                alt={listing.title}
                className={`h-full w-full object-cover ${listing.status === "sold" ? "opacity-50" : ""}`}
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
            </div>

            {listing.imageUrls.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {listing.imageUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 ${
                      activeImage === i ? "ring-[#2F855A]" : "ring-transparent"
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
            <h1 className="mt-2 text-xl md:text-2xl font-semibold">{listing.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {listing.location} · {listing.category}
            </p>

            {listing.description && (
              <p className="mt-6 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                {listing.description}
              </p>
            )}

            <div className="mt-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-gray-500">Seller</p>
              <p className="mt-1 font-semibold">{listing.sellerEmail}</p>
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
                      className="w-full rounded-full bg-[#2F855A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#276749] disabled:opacity-60"
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
              <button
                onClick={handleMessageSeller}
                disabled={messaging || listing.status === "sold"}
                className="mt-6 w-full rounded-full bg-[#2F855A] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#276749] disabled:opacity-60"
              >
                {listing.status === "sold"
                  ? "This item is sold"
                  : messaging
                  ? "Starting chat..."
                  : "Message seller"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}