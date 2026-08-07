"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import SearchBar from "@/components/home/SearchBar";
import CategoryBar from "@/components/home/CategoryBar";
import ItemCard from "@/components/listing/ItemCard";
import { getListings, Listing } from "@/lib/listings";
import { useAuth } from "@/lib/auth-context";
import { addFavorite, removeFavorite, getUserFavoriteIds } from "@/lib/favorites";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getListings(50)
      .then(setListings)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    getUserFavoriteIds(user.uid).then(setFavoriteIds);
  }, [user]);

  async function handleToggleFavorite(listingId: string) {
    if (!user) {
      router.push(`/auth?redirect=/`);
      return;
    }

    const isFavorited = favoriteIds.has(listingId);
    const next = new Set(favoriteIds);

    // optimistic update
    if (isFavorited) {
      next.delete(listingId);
    } else {
      next.add(listingId);
    }
    setFavoriteIds(next);

    try {
      if (isFavorited) {
        await removeFavorite(user.uid, listingId);
      } else {
        await addFavorite(user.uid, listingId);
      }
    } catch {
      // revert on failure
      setFavoriteIds(favoriteIds);
    }
  }

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category ? item.category === category : true;
      return matchesSearch && matchesCategory;
    });
  }, [listings, search, category]);

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-7xl px-4 md:px-8">
        <header className="pt-6 md:pt-10">
          <div className="flex justify-between items-start md:hidden">
            <div>
              <p className="text-sm text-gray-500">Good afternoon 👋</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Bazaaric</h1>
            </div>
          </div>

          <h2 className="mt-8 md:mt-0 text-xl md:text-3xl font-semibold">Find something you love</h2>

          <div className="mt-4 md:mt-6 md:max-w-2xl">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </header>

        <section className="mt-6 md:mt-8">
          <CategoryBar selected={category} onSelect={setCategory} />
        </section>

        <section className="mt-8 md:mt-12">
          <div className="mb-4 md:mb-6 flex justify-between items-center">
            <h2 className="text-lg md:text-2xl font-bold">
              {search || category ? "Results" : "Fresh finds"}
            </h2>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading listings...</p>
          ) : filteredListings.length === 0 ? (
            <p className="text-sm text-gray-500">
              {listings.length === 0
                ? "No listings yet — be the first to sell something!"
                : "No items match your search."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {filteredListings.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={`€${item.price}`}
                  location={item.location}
                  image={item.imageUrls[0] || "https://via.placeholder.com/500"}
                  isFavorited={favoriteIds.has(item.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}