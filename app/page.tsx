"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Navbar from "@/components/layout/Navbar";
import CategoryBar from "@/components/home/CategoryBar";
import HeroCarousel, { Slide } from "@/components/home/HeroCarousel";
import ItemCard from "@/components/listing/ItemCard";
import ItemCardSkeleton from "@/components/listing/ItemCardSkeleton";
import { getListings, Listing } from "@/lib/listings";
import { useAuth } from "@/lib/auth-context";
import { addFavorite, removeFavorite, getUserFavoriteIds } from "@/lib/favorites";
import { getMutuallyBlockedUserIds } from "@/lib/moderation";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations("home");
  const tHero = useTranslations("hero");

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const heroSlides: Slide[] = useMemo(
    () => [
      {
        image: "/hero/slide-1.png",
        mobileImage: "/hero/slide-1-mobile.png",
        headline: tHero("slide1Headline"),
        subtext: tHero("slide1Subtext"),
        ctaText: tHero("slide1Cta"),
        ctaHref: "/sell",
      },
      {
        image: "/hero/slide-4.png",
        mobileImage: "/hero/slide-3-mobile.png",
        headline: tHero("slide4Headline"),
        subtext: tHero("slide4Subtext"),
        ctaText: tHero("slide4Cta"),
        ctaHref: "/",
      },
      {
        image: "/hero/slide-3.png",
        mobileImage: "/hero/slide-2-mobile.png",
        headline: tHero("slide3Headline"),
        subtext: tHero("slide3Subtext"),
        ctaText: tHero("slide3Cta"),
        ctaHref: "/",
      },
      {
        image: "/hero/slide-2.png",
        mobileImage: "/hero/slide-4-mobile.png",
        headline: tHero("slide2Headline"),
        subtext: tHero("slide2Subtext"),
        ctaText: tHero("slide2Cta"),
        ctaHref: "/",
      },
    ],
    [tHero]
  );

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

  useEffect(() => {
    if (!user) {
      setBlockedIds(new Set());
      return;
    }
    getMutuallyBlockedUserIds(user.uid).then(setBlockedIds);
  }, [user]);

  async function handleToggleFavorite(listingId: string) {
    if (!user) {
      router.push(`/register?redirect=/`);
      return;
    }

    const isFavorited = favoriteIds.has(listingId);
    const next = new Set(favoriteIds);

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
      setFavoriteIds(favoriteIds);
    }
  }

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category ? item.category === category : true;
      const notBlocked = !blockedIds.has(item.sellerId);
      return matchesSearch && matchesCategory && notBlocked;
    });
  }, [listings, search, category, blockedIds]);

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar searchValue={search} onSearchChange={setSearch} />

      <HeroCarousel slides={heroSlides} />

      <div className="mx-auto max-w-md md:max-w-7xl px-4 md:px-8">
        <section className="mt-6 md:mt-10">
          <CategoryBar selected={category} onSelect={setCategory} />
        </section>
      </div>

      <div className="mx-auto max-w-md md:max-w-7xl px-4 md:px-8">
        <section className="mt-8 md:mt-12 rounded-2xl bg-gray-50 px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-3xl font-bold tracking-tight">
              Buying and selling made easy
            </h2>
            <p className="mt-2 text-sm md:text-base text-gray-600">
              Secure payments, real reviews, and support every step of the way.
            </p>
          </div>

          <Link
            href={user ? "/sell" : "/register"}
            className="inline-flex w-fit items-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black/80"
          >
            {user ? "Start selling" : "Start now"}
          </Link>
        </section>
      </div>

      <div className="mx-auto max-w-md md:max-w-7xl px-4 md:px-8">
        <section className="mt-8 md:mt-12">
          <div className="mb-4 md:mb-6 flex justify-between items-center">
            <h2 className="text-lg md:text-2xl font-bold">
              {search || category ? t("results") : t("freshFinds")}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
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
                  quantity={item.quantity}
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