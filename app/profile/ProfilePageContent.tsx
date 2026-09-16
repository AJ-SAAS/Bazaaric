"use client";

import { useAuth } from "@/lib/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getListingsByUser, deleteListing, updateListing, Listing } from "@/lib/listings";
import {
  getPublicProfile,
  claimUsername,
  changeUsername,
  getUsernameChangeEligibility,
  isValidUsername,
  uploadStoreBanner,
  deleteStoreBanner,
  updateStoreProfile,
  PublicProfile,
} from "@/lib/profiles";
import { updateDisplayName, getUserName, changeUserPassword } from "@/lib/account";
import { getRatingStats, RatingStats } from "@/lib/reviews";
import { startStripeOnboarding, refreshStripeStatus } from "@/lib/payments";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { Plus, Star, CreditCard, CheckCircle2, Store, ImageUp } from "lucide-react";

export default function ProfilePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("profile");

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

  // Store settings state
  const [storeNameInput, setStoreNameInput] = useState("");
  const [storeBioInput, setStoreBioInput] = useState("");
  const [storeLocationInput, setStoreLocationInput] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeMessage, setStoreMessage] = useState("");

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
      setStoreNameInput(p?.storeName || "");
      setStoreBioInput(p?.storeBio || "");
      setStoreLocationInput(p?.storeLocation || "");
      setBannerPreview(p?.storeBannerUrl || "");
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
          setPayoutsMessage(t("payoutsSetUpMessage"));
        } else if (result.detailsSubmitted) {
          setPayoutsMessage(t("stripeReviewing"));
        } else {
          setPayoutsMessage(t("onboardingNotFinished"));
        }
      })
      .catch((err) => {
        console.error("FAILED: refreshStripeStatus", err);
        setPayoutsMessage(t("couldntCheckPayoutStatus"));
      })
      .finally(() => setCheckingPayouts(false));
  }, [user, searchParams, t]);

  async function handleMarkAsSold(id: string) {
    await updateListing(id, { status: "sold" });
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "sold" } : l))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDeleteListing"))) return;
    await deleteListing(id);
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleSaveName() {
    if (!user) return;
    setNameSaving(true);
    setNameMessage("");
    try {
      await updateDisplayName(user.uid, nameInput);
      setNameMessage(t("nameUpdated"));
    } catch (err: any) {
      setNameMessage(err.message || t("couldntUpdateName"));
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
      setUsernameMessage(t("usernameUpdated"));
    } catch (err: any) {
      setUsernameMessage(err.message || t("couldntUpdateUsername"));
    } finally {
      setUsernameSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordMessage(t("passwordsDontMatch"));
      return;
    }

    setPasswordSaving(true);
    try {
      await changeUserPassword(user, currentPassword, newPassword);
      setPasswordMessage(t("passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage(
        err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
          ? t("currentPasswordIncorrect")
          : err.message || t("couldntUpdatePassword")
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  function handleBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  async function handleSaveStore() {
    if (!user) return;

    setStoreSaving(true);
    setStoreMessage("");

    try {
      const previousBannerUrl = profile?.storeBannerUrl;
      let bannerUrl = profile?.storeBannerUrl;

      if (bannerFile) {
        bannerUrl = await uploadStoreBanner(user.uid, bannerFile);
      }

      await updateStoreProfile(user.uid, {
        storeName: storeNameInput.trim(),
        storeBio: storeBioInput.trim(),
        storeLocation: storeLocationInput.trim(),
        ...(bannerUrl ? { storeBannerUrl: bannerUrl } : {}),
      });

      // Only remove the old banner file once the new one is safely
      // saved on the profile doc.
      if (bannerFile && previousBannerUrl && previousBannerUrl !== bannerUrl) {
        deleteStoreBanner(previousBannerUrl).catch(() => {});
      }

      const updatedProfile = await getPublicProfile(user.uid);
      setProfile(updatedProfile);
      setBannerFile(null);
      setStoreMessage(t("storeUpdated"));
    } catch (err: any) {
      setStoreMessage(err.message || t("couldntUpdateStore"));
    } finally {
      setStoreSaving(false);
    }
  }

  async function handleSetupPayouts() {
    setStartingOnboarding(true);
    setPayoutsMessage("");
    try {
      const url = await startStripeOnboarding(sellerCountry);
      window.location.href = url;
    } catch (err: any) {
      setPayoutsMessage(err.message || t("couldntStartPayoutSetup"));
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
                {t("edit")}
              </button>

              {item.status === "active" && (
                <button
                  onClick={() => handleMarkAsSold(item.id)}
                  className="rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark"
                >
                  {t("markSold")}
                </button>
              )}
            </>
          )}

          <button
            onClick={() => handleDelete(item.id)}
            className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            {t("delete")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold">{t("title")}</h1>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">{t("signedInAs")}</p>
              <p className="mt-1 font-semibold break-all">{user.email}</p>

              {profile?.username && (
                <p className="mt-1 text-sm text-gray-600 break-words">@{profile.username}</p>
              )}

              {stats && stats.count > 0 && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {t("ratingSummary", {
                    average: stats.average.toFixed(1),
                    percent: stats.positivePercent,
                    count: stats.count,
                  })}
                </p>
              )}
            </div>

            <button
              onClick={() => signOut(auth)}
              className="shrink-0 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {t("logOut")}
            </button>
          </div>
        </div>

        {!settingsLoading && !profile && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="text-sm text-amber-800">
              {t("noUsernameYet")}
            </p>
          </div>
        )}

        <button
          onClick={() => router.push("/sell")}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-4 text-base font-semibold text-white shadow-sm transition hover:bg-teal-dark"
        >
          <Plus size={20} />
          {t("createNewListing")}
        </button>

        <div className="mt-4 flex justify-end gap-4">
          <Link href="/offers" className="text-sm font-semibold text-teal hover:underline">
            {t("viewOffers")} →
          </Link>
          <Link href="/favorites" className="text-sm font-semibold text-teal hover:underline">
            {t("viewFavorites")} →
          </Link>
        </div>

        {/* Payouts (Stripe Connect) */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg md:text-2xl font-bold">{t("payouts")}</h2>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            {payoutsEnabled ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={22} className="shrink-0 text-teal" />
                <div>
                  <p className="text-sm font-semibold">{t("payoutsSetUp")}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t("payoutsSetUpDesc")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <CreditCard size={22} className="mt-0.5 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t("setUpPayoutsToGetPaid")}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t("setUpPayoutsDesc")}
                  </p>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <select
                      value={sellerCountry}
                      onChange={(e) => setSellerCountry(e.target.value)}
                      disabled={startingOnboarding || checkingPayouts}
                      className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal disabled:opacity-60"
                    >
                      <option value="LV">{t("latvia")}</option>
                      <option value="EE">{t("estonia")}</option>
                      <option value="LT">{t("lithuania")}</option>
                    </select>

                    <button
                      onClick={handleSetupPayouts}
                      disabled={startingOnboarding || checkingPayouts}
                      className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
                    >
                      {startingOnboarding
                        ? t("redirectingToStripe")
                        : checkingPayouts
                        ? t("checkingStatus")
                        : t("setUpPayouts")}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    {t("chooseCountryNote")}
                  </p>
                </div>
              </div>
            )}

            {payoutsMessage && (
              <p className="mt-3 text-xs text-gray-600">{payoutsMessage}</p>
            )}
          </div>
        </section>

        {/* Store settings — only shown once a username exists, since the
            store page falls back to displaying the username */}
        {profile && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg md:text-2xl font-bold">
              <Store size={22} />
              {t("yourStore")}
            </h2>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 space-y-4">
              {/* Banner */}
              <div>
                <label className="text-sm font-medium text-gray-700">{t("storeBanner")}</label>

                <label
                  htmlFor="banner-upload"
                  className="mt-2 flex aspect-[3/1] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-gray-50 ring-1 ring-black/10 hover:bg-gray-100 transition"
                >
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt="Store banner preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-gray-400">
                      <ImageUp size={22} />
                      <span className="text-xs">{t("uploadBannerImage")}</span>
                    </span>
                  )}
                </label>

                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelect}
                  className="hidden"
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  {t("bannerHelp")}
                </p>
              </div>

              {/* Store name */}
              <div>
                <label className="text-sm font-medium text-gray-700">{t("storeName")}</label>
                <input
                  type="text"
                  value={storeNameInput}
                  onChange={(e) => setStoreNameInput(e.target.value)}
                  placeholder={profile.username ? t("storeNameDefaultsTo", { username: profile.username }) : t("storeNamePlaceholder")}
                  className="mt-2 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm font-medium text-gray-700">{t("aboutYourStore")}</label>
                <textarea
                  value={storeBioInput}
                  onChange={(e) => setStoreBioInput(e.target.value)}
                  placeholder={t("aboutStorePlaceholder")}
                  rows={4}
                  className="mt-2 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-gray-700">{t("location")}</label>
                <input
                  type="text"
                  value={storeLocationInput}
                  onChange={(e) => setStoreLocationInput(e.target.value)}
                  placeholder={t("locationPlaceholder")}
                  className="mt-2 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <button
                onClick={handleSaveStore}
                disabled={storeSaving}
                className="w-full rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
              >
                {storeSaving ? t("saving") : t("saveStore")}
              </button>

              {storeMessage && <p className="text-xs text-gray-600">{storeMessage}</p>}
            </div>
          </section>
        )}

        {/* Account settings */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg md:text-2xl font-bold">{t("accountSettings")}</h2>

          <div className="space-y-4">
            {/* Display name */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <label className="text-sm font-medium text-gray-700">{t("name")}</label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                />
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving || settingsLoading}
                  className="shrink-0 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
                >
                  {nameSaving ? t("saving") : t("save")}
                </button>
              </div>
              {nameMessage && <p className="mt-2 text-xs text-gray-600">{nameMessage}</p>}
            </div>

            {/* Username */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <label className="text-sm font-medium text-gray-700">{t("username")}</label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder={t("usernamePlaceholder")}
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
                  {usernameSaving ? t("saving") : profile ? t("change") : t("claim")}
                </button>
              </div>

              {usernameLocked && nextUsernameEligible && (
                <p className="mt-2 text-xs text-gray-500">
                  {t("usernameLockedUntil", { date: nextUsernameEligible.toLocaleDateString() })}
                </p>
              )}
              {!usernameLocked && (
                <p className="mt-2 text-xs text-gray-400">
                  {t("usernameRules")}
                </p>
              )}
              {usernameMessage && <p className="mt-2 text-xs text-gray-600">{usernameMessage}</p>}
            </div>

            {/* Password */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-gray-700 mb-2">{t("changePassword")}</p>
              <form onSubmit={handleChangePassword} className="space-y-2">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("currentPassword")}
                  required
                  className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("newPassword")}
                  required
                  className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirmNewPassword")}
                  required
                  className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
                />

                {passwordMessage && <p className="text-xs text-gray-600">{passwordMessage}</p>}

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
                >
                  {passwordSaving ? t("updating") : t("updatePassword")}
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg md:text-2xl font-bold">{t("yourListings")}</h2>
          </div>

          {listingsError && (
            <p className="text-sm text-red-600 mb-4">
              {t("couldntLoadListings", { error: listingsError })}
            </p>
          )}

          {listingsLoading ? (
            <p className="text-sm text-gray-500">{t("loadingListings")}</p>
          ) : activeListings.length === 0 ? (
            <p className="text-sm text-gray-500">{t("noListingsYet")}</p>
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
            <h2 className="mb-4 text-lg md:text-2xl font-bold">{t("drafts")}</h2>
            <div className="space-y-3">
              {draftListings.map((item) => (
                <ListingRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {soldListings.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg md:text-2xl font-bold">{t("sold")}</h2>
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