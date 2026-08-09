"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserFavoriteListings, removeFavorite } from "@/lib/favorites";
import { Listing } from "@/lib/listings";
import ItemCard from "@/components/listing/ItemCard";
import ItemCardSkeleton from "@/components/listing/ItemCardSkeleton";
import Navbar from "@/components/layout/Navbar";

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getUserFavoriteListings(user.uid)
      .then(setFavorites)
      .finally(() => setFavoritesLoading(false));
  }, [user]);

  async function handleRemove(listingId: string) {
    if (!user) return;
    setFavorites((prev) => prev.filter((l) => l.id !== listingId));
    await removeFavorite(user.uid, listingId);
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-7xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold">Favorites</h1>

        {favoritesLoading ? (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            Nothing saved yet — tap the heart on an item to save it here.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {favorites.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={`€${item.price}`}
                location={item.location}
                image={item.imageUrls[0] || "https://via.placeholder.com/500"}
                quantity={item.quantity}
                sold={item.status === "sold"}
                isFavorited={true}
                onToggleFavorite={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}