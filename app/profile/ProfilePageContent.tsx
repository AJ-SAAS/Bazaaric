"use client";

import { useAuth } from "@/lib/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getListingsByUser, deleteListing, updateListing, Listing } from "@/lib/listings";
import {
  getPublicProfile,
  claimUsername,
  changeUsername,
  getUsernameChangeEligibility,
  isValidUsername,
  PublicProfile,
} from "@/lib/profiles";
import { updateDisplayName, getUserName, changeUserPassword } from "@/lib/account";
import { getRatingStats, RatingStats } from "@/lib/reviews";
import { startStripeOnboarding, refreshStripeStatus } from "@/lib/payments";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { Plus, Star, CreditCard, CheckCircle2 } from "lucide-react";

export default function ProfilePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState("");

  // Settings state
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [nextUsernameEligible, setNextUsernameEligible] = useState<Date | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState("");

  const [usernameInput, setUsernameInput] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  // Payouts (Stripe Connect) state
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [startingOnboarding, setStartingOnboarding] = useState(false);
  const [checkingPayouts, setCheckingPayouts] = useState(false);
  const [payoutsMessage, setPayoutsMessage] = useState("");
  const [sellerCountry, setSellerCountry] = useState("LV");

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getListingsByUser(user.uid)
      .then(setListings)
      .catch((err) => setListingsError(err.message))
      .finally(() => setListingsLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function loadSettings() {
      let p: PublicProfile | null = null;
      let name = "";
      let eligibility: Date | null = null;
      let s: RatingStats | null = null;

      try {
        p = await getPublicProfile(user.uid);
      } catch (err) {
        console.error("FAILED: getPublicProfile", err);
      }

      try {
        name = await getUserName(user.uid);
      } catch (err) {
        console.error("FAILED: getUserName", err);
      }

      try {
        eligibility = await getUsernameChangeEligibility(user.uid);
      } catch (err) {
        console.error("FAILED: getUsernameChangeEligibility", err);
      }

      try {
        s = await getRatingStats(user.uid);
      } catch (err) {
        console.error("FAILED: getRatingStats", err);
      }

      setProfile(p);
      setUsernameInput(p?.username || "");
      setNameInput(name);
      setNextUsernameEligible(eligibility);
      setStats(s);
      setPayoutsEnabled(!!p?.stripeChargesEnabled);
      setSettingsLoading(false);
    }

    loadSettings();
  }, [user]);

  // If we just landed back from Stripe's onboarding flow, re-check status
  // immediately rather than waiting for the webhook to arrive.
  useEffect(() => {
    if (!user) return;
    const stripeParam = searchParams.get("stripe");
    if (stripeParam !== "return" && stripeParam !== "refresh") return;

    setCheckingPayouts(true);
    refreshStripeStatus()
      .then((result) => {
        setPayoutsEnabled(result.chargesEnabled);
        if (result.chargesEnabled) {
          setPayoutsMessage("Payouts are set up! You can now receive money from sales.");
        } else if (result.detailsSubmitted) {
          setPayoutsMessage("Stripe is reviewing your details. This can take a few minutes.");
        } else {
          setPayoutsMessage("Onboarding wasn't finished. You can try again below.");
        }
      })
      .catch((err) => {
        console.error("FAILED: refreshStripeStatus", err);
        setPayoutsMessage("Couldn't check your payout status. Try refreshing the page.");
      })
      .finally(() => setCheckingPayouts(false));
  }, [user, searchParams]);

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

  async function handleSaveName() {
    if (!user) return;
    setNameSaving(true);
    setNameMessage("");
    try {
      await updateDisplayName(user.uid, nameInput);
      setNameMessage("Name updated.");
    } catch (err: any) {
      setNameMessage(err.message || "Couldn't update your name.");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleSaveUsername() {
    if (!user) return;

    const validationError = isValidUsername(usernameInput);
    if (validationError) {
      setUsernameMessage(validationError);
      return;
    }

    setUsernameSaving(true);
    setUsernameMessage("");

    try {
      if (!profile) {
        await claimUsername(user.uid, usernameInput);
      } else {
        await changeUsername(user.uid, usernameInput);
      }

      const [updatedProfile, eligibility] = await Promise.all([
        getPublicProfile(user.uid),
        getUsernameChangeEligibility(user.uid),
      ]);
      setProfile(updatedProfile);
      setNextUsernameEligible(eligibility);
      setUsernameMessage("Username updated.");
    } catch (err: any) {
      setUsernameMessage(err.message || "Couldn't update your username.");
    } finally {
      setUsernameSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords don't match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changeUserPassword(user, currentPassword, newPassword);
      setPasswordMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage(
        err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
          ? "Current password is incorrect."
          : err.message || "Couldn't update your password."
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleSetupPayouts() {
    setStartingOnboarding(true);
    setPayoutsMessage("");
    try {
      const url = await startStripeOnboarding(sellerCountry);
      window.location.href = url;
    } catch (err: any) {
      setPayoutsMessage(err.message || "Couldn't start payout setup. Try again.");
      setStartingOnboarding(false);
    }
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

  const usernameLocked = !!profile && !!nextUsernameEligible;

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
                  className="rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark"
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

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="mt-1 font-semibold break-all">{user.email}</p>

              {profile?.username && (
                <p className="mt-1 text-sm text-gray-600 break-words">@{profile.username}</p>
              )}

              {stats && stats.count > 0 && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {stats.average.toFixed(1)} · {stats.positivePercent}% positive · {stats.count} review{stats.count === 1 ? "" : "s"}
                </p>
              )}
            </div>

            <button
              onClick={() => signOut(auth)}
              className="shrink-0 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </div>

        {!settingsLoading && !profile && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="text-sm text-amber-800">
              You don't have a username yet — set one below so buyers see your name instead of your email.
            </p>
          </div>
        )}

        <button
          onClick={() => router.push("/sell")}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-4 text-base font-semibold text-white shadow-sm transition hover:bg-teal-dark"
        >
          <Plus size={20} />
          Create new listing
        </button>

        <div className="mt-4 flex justify-end gap-4">
          <Link href="/offers" className="text-sm font-semibold text-teal hover:underline">
            View offers →
          </Link>
          <Link href="/favorites" className="text-sm font-semibold text-teal hover:underline">
            View favorites →
          </Link>
        </div>

        {/* Payouts (Stripe Connect) */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg md:text-2xl font-bold">Payouts</h2>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            {payoutsEnabled ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={22} className="shrink-0 text-teal" />
                <div>
                  <p className="text-sm font-semibold">Payouts are set up</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    You're ready to receive money from sales directly to your bank account.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <CreditCard size={22} className="mt-0.5 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Set up payouts to get paid</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Connect a bank account through Stripe so you can receive money when your items sell. Takes a couple of minutes.
                  </p>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <select
                      value={sellerCountry}
                      onChange={(e) => setSellerCountry(e.target.value)}
                      disabled={startingOnboarding || checkingPayouts}
                      className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal disabled:opacity-60"
                    >
                      <option value="LV">Latvia</option>
                      <option value="EE">Estonia</option>
                      <option value="LT">Lithuania</option>
                    </select>

                    <button
                      onClick={handleSetupPayouts}
                      disabled={startingOnboarding || checkingPayouts}
                      className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
                    >
                      {startingOnboarding
                        ? "Redirecting to Stripe..."
                        : checkingPayouts
                        ? "Checking status..."
                        : "Set up payouts"}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    Choose the country where you're based. This can't be changed once you start.
                  </p>
                </div>
              </div>
            )}

            {payoutsMessage && (
              <p className="mt-3 text-xs text-gray-600">{payoutsMessage}</p>
            )}
          </div>
        </section>

        {/* Account settings */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg md:text-2xl font-bold">Account settings</h2>

          <div className="space-y-4">
            {/* Display name */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                />
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving || settingsLoading}
                  className="shrink-0 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
                >
                  {nameSaving ? "Saving..." : "Save"}
                </button>
              </div>
              {nameMessage && <p className="mt-2 text-xs text-gray-600">{nameMessage}</p>}
            </div>

            {/* Username */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Choose a username"
                  disabled={usernameLocked}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal disabled:opacity-60"
                />
                <button
                  onClick={handleSaveUsername}
                  disabled={usernameSaving || settingsLoading || usernameLocked}
                  className="shrink-0 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
                >
                  {usernameSaving ? "Saving..." : profile ? "Change" : "Claim"}
                </button>
              </div>

              {usernameLocked && nextUsernameEligible && (
                <p className="mt-2 text-xs text-gray-500">
                  You can change your username again on {nextUsernameEligible.toLocaleDateString()}.
                </p>
              )}
              {!usernameLocked && (
                <p className="mt-2 text-xs text-gray-400">
                  3-20 characters, letters/numbers/underscores only. Changing your username again is locked for 30 days after this.
                </p>
              )}
              {usernameMessage && <p className="mt-2 text-xs text-gray-600">{usernameMessage}</p>}
            </div>

            {/* Password */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-gray-700 mb-2">Change password</p>
              <form onSubmit={handleChangePassword} className="space-y-2">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  required
                  className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  required
                  className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                />

                {passwordMessage && <p className="text-xs text-gray-600">{passwordMessage}</p>}

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
                >
                  {passwordSaving ? "Updating..." : "Update password"}
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg md:text-2xl font-bold">Your listings</h2>
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