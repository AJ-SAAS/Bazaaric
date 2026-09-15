import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { deletePhotosByUrl } from "@/lib/listings";

export type PublicProfile = {
  uid: string;
  username: string;
  usernameChangedAt: Timestamp | null;
  createdAt: Timestamp | null;
  stripeChargesEnabled?: boolean;
  storeName?: string;
  storeBannerUrl?: string;
  storeBio?: string;
  storeLocation?: string;
};

const USERNAME_COOLDOWN_DAYS = 30;

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 3) return "Username must be at least 3 characters.";
  if (trimmed.length > 20) return "Username must be 20 characters or fewer.";
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return "Username can only contain letters, numbers, and underscores.";
  }
  return null;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const snap = await getDoc(doc(db, "usernames", normalized));
  return !snap.exists();
}

// Claims a username for a brand-new account. Used once, at signup.
export async function claimUsername(uid: string, username: string): Promise<void> {
  const normalized = normalizeUsername(username);
  const validationError = isValidUsername(username);
  if (validationError) throw new Error(validationError);

  const usernameRef = doc(db, "usernames", normalized);
  const profileRef = doc(db, "public_profiles", uid);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(usernameRef);
    if (existing.exists()) {
      throw new Error("That username is already taken.");
    }

    tx.set(usernameRef, { uid, createdAt: serverTimestamp() });
    tx.set(profileRef, {
      uid,
      username: username.trim(),
      usernameChangedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  });
}

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(db, "public_profiles", uid));
  if (!snap.exists()) return null;
  return snap.data() as PublicProfile;
}

// Returns null if the user can change their username now, or the
// Date they'll next be allowed to, if they're still in the cooldown.
export async function getUsernameChangeEligibility(uid: string): Promise<Date | null> {
  const profile = await getPublicProfile(uid);
  if (!profile?.usernameChangedAt) return null;

  const changedAt = profile.usernameChangedAt.toDate();
  const nextEligible = new Date(changedAt);
  nextEligible.setDate(nextEligible.getDate() + USERNAME_COOLDOWN_DAYS);

  return nextEligible > new Date() ? nextEligible : null;
}

// Changes an existing user's username, enforcing the 30-day cooldown
// and releasing their old reservation so someone else can claim it.
export async function changeUsername(uid: string, newUsername: string): Promise<void> {
  const validationError = isValidUsername(newUsername);
  if (validationError) throw new Error(validationError);

  const nextEligible = await getUsernameChangeEligibility(uid);
  if (nextEligible) {
    throw new Error(
      `You can change your username again on ${nextEligible.toLocaleDateString()}.`
    );
  }

  const profile = await getPublicProfile(uid);
  if (!profile) throw new Error("Profile not found.");

  const oldNormalized = normalizeUsername(profile.username);
  const newNormalized = normalizeUsername(newUsername);

  if (oldNormalized === newNormalized) {
    throw new Error("That's already your username.");
  }

  const newUsernameRef = doc(db, "usernames", newNormalized);
  const oldUsernameRef = doc(db, "usernames", oldNormalized);
  const profileRef = doc(db, "public_profiles", uid);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(newUsernameRef);
    if (existing.exists()) {
      throw new Error("That username is already taken.");
    }

    tx.set(newUsernameRef, { uid, createdAt: serverTimestamp() });
    tx.delete(oldUsernameRef);
    tx.update(profileRef, {
      username: newUsername.trim(),
      usernameChangedAt: serverTimestamp(),
    });
  });
}

// Same in-browser resize + re-encode approach as listing photo uploads,
// just wider dimensions since a store banner is a full-bleed hero strip
// (3:1), matching the homepage hero carousel, not a square product shot.
function compressBannerImage(file: File, maxWidth = 2400, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas not supported on this device."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Image compression failed."));
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Couldn't read that image file."));
    };

    img.src = objectUrl;
  });
}

// Uploads a new banner and returns its URL. Does not delete the old
// banner — call deleteStoreBanner separately with the previous URL
// once the profile doc is updated, so a failed profile write never
// leaves a seller with no banner at all.
export async function uploadStoreBanner(uid: string, file: File): Promise<string> {
  const compressed = await compressBannerImage(file);

  const path = `store-banners/${uid}/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });
  return getDownloadURL(storageRef);
}

export async function deleteStoreBanner(url: string): Promise<void> {
  await deletePhotosByUrl([url]);
}

type StoreProfileInput = {
  storeName?: string;
  storeBannerUrl?: string;
  storeBio?: string;
  storeLocation?: string;
};

// Uses setDoc with merge so this works even if, for some edge case,
// the profile doc doesn't exist yet — though in practice a seller
// needs a username (and therefore a profile doc) before reaching
// store settings in the UI.
export async function updateStoreProfile(uid: string, input: StoreProfileInput): Promise<void> {
  await setDoc(doc(db, "public_profiles", uid), input, { merge: true });
}