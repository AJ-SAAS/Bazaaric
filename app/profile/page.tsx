"use client";

import { useAuth } from "@/lib/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getListingsByUser, Listing } from "@/lib/listings";
import ItemCard from "@/components/listing/ItemCard";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getListingsByUser(user.uid)
      .then(setListings)
      .finally(() => setListingsLoading(false));
  }, [user]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const activeListings = listings.filter((l) => l.status === "active");
  const draftListings = listings.filter((l) => l.status === "draft");

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-5xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Signed in as</p>
            <p className="mt-1 font-semibold">{user.email}</p>
          </div>

          <button
            onClick={() => signOut(auth)}
            className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Log out
          </button>
        </div>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg md:text-2xl font-bold">Your listings</h2>
            <Link
              href="/sell"
              className="text-sm font-semibold text-[#2F855A] hover:underline"
            >
              + New listing
            </Link>
          </div>

          {listingsLoading ? (
            <p className="text-sm text-gray-500">Loading your listings...</p>
          ) : activeListings.length === 0 ? (
            <p className="text-sm text-gray-500">
              You haven't listed anything yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {activeListings.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={`€${item.price}`}
                  location={item.location}
                  image={item.imageUrls[0] || "https://via.placeholder.com/500"}
                />
              ))}
            </div>
          )}
        </section>

        {draftListings.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg md:text-2xl font-bold">Drafts</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 opacity-70">
              {draftListings.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={`€${item.price}`}
                  location={item.location}
                  image={item.imageUrls[0] || "https://via.placeholder.com/500"}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}