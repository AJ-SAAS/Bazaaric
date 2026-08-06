"use client";

import { useAuth } from "@/lib/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getListingsByUser, deleteListing, updateListing, Listing } from "@/lib/listings";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getListingsByUser(user.uid)
      .then((data) => {
        console.log("Profile: fetched listings for", user.uid, data);
        setListings(data);
      })
      .catch((err) => {
        console.error("Profile: error fetching listings", err);
        setListingsError(err.message);
      })
      .finally(() => setListingsLoading(false));
  }, [user]);

  async function handleMarkAsSold(id: string) {
    await updateListing(id, { status: "sold" });
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "sold" } : l))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    await deleteListing(id);
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const activeListings = listings.filter((l) => l.status === "active");
  const draftListings = listings.filter((l) => l.status === "draft");
  const soldListings = listings.filter((l) => l.status === "sold");

  function ListingRow({ item }: { item: Listing }) {
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
        <Link href={`/item/${item.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
          <img
            src={item.imageUrls[0] || "https://via.placeholder.com/200"}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{item.title}</p>
          <p className="text-xs text-gray-500">€{item.price}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          {item.status !== "sold" && (
            <>
              <button
                onClick={() => router.push(`/sell?edit=${item.id}`)}
                className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>

              {item.status === "active" && (
                <button
                  onClick={() => handleMarkAsSold(item.id)}
                  className="rounded-full bg-[#2F855A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#276749]"
                >
                  Mark sold
                </button>
              )}
            </>
          )}

          <button
            onClick={() => handleDelete(item.id)}
            className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
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

        <div className="mt-4 flex justify-end">
          <Link href="/favorites" className="text-sm font-semibold text-[#2F855A] hover:underline">
            View favorites →
          </Link>
        </div>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg md:text-2xl font-bold">Your listings</h2>
            <Link href="/sell" className="text-sm font-semibold text-[#2F855A] hover:underline">
              + New listing
            </Link>
          </div>

          {listingsError && (
            <p className="text-sm text-red-600 mb-4">
              Couldn't load your listings: {listingsError}
            </p>
          )}

          {listingsLoading ? (
            <p className="text-sm text-gray-500">Loading your listings...</p>
          ) : activeListings.length === 0 ? (
            <p className="text-sm text-gray-500">You haven't listed anything yet.</p>
          ) : (
            <div className="space-y-3">
              {activeListings.map((item) => (
                <ListingRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {draftListings.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg md:text-2xl font-bold">Drafts</h2>
            <div className="space-y-3">
              {draftListings.map((item) => (
                <ListingRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {soldListings.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg md:text-2xl font-bold">Sold</h2>
            <div className="space-y-3 opacity-70">
              {soldListings.map((item) => (
                <ListingRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}