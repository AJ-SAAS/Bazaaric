"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ItemCard from "@/components/listing/ItemCard";
import { getListingsByUser, Listing } from "@/lib/listings";
import { getPublicProfile, PublicProfile } from "@/lib/profiles";
import { getRatingStats, RatingStats } from "@/lib/reviews";
import { Star, CalendarDays } from "lucide-react";

export default function SellerPage() {
  const params = useParams();
  const sellerId = params.id as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;

    async function load() {
      let p: PublicProfile | null = null;
      let l: Listing[] = [];
      let s: RatingStats | null = null;

      try {
        p = await getPublicProfile(sellerId);
      } catch (err) {
        console.error("FAILED: getPublicProfile", err);
      }

      try {
        l = await getListingsByUser(sellerId);
      } catch (err) {
        console.error("FAILED: getListingsByUser", err);
      }

      try {
        s = await getRatingStats(sellerId);
      } catch (err) {
        console.error("FAILED: getRatingStats", err);
      }

      setProfile(p);
      setAllListings(l);
      setStats(s);
      setLoading(false);
    }

    load();
  }, [sellerId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  // Checked against the FULL listing count (before filtering to active-only),
  // so a real seller whose items are all sold/draft right now still shows up.
  if (!profile && allListings.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold">Seller not found</p>
      </main>
    );
  }

  const activeListings = allListings.filter((item) => item.status === "active");
  const displayName = profile?.username || "Bazaaric seller";
  const joinDate = profile?.createdAt?.toDate();

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-5xl px-4 md:px-8 pt-6 md:pt-10">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold break-words">{displayName}</h1>

              {joinDate && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <CalendarDays size={13} />
                  Member since {joinDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </p>
              )}
            </div>

            {stats && stats.count > 0 && (
              <div className="shrink-0 rounded-xl bg-gray-50 px-4 py-2.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-sm">{stats.average.toFixed(1)}</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {stats.positivePercent}% positive · {stats.count} review{stats.count === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-4 text-lg md:text-2xl font-bold break-words">
            {displayName}'s listings
          </h2>

          {activeListings.length === 0 ? (
            <p className="text-sm text-gray-500">No active listings right now.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {activeListings.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={`€${item.price}`}
                  location={item.location}
                  image={item.imageUrls[0] || "https://via.placeholder.com/500"}
                  quantity={item.quantity}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}