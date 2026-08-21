import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PublicProfile = {
  uid: string;
  username: string;
  usernameChangedAt: Timestamp | null;
  createdAt: Timestamp | null;
  stripeChargesEnabled?: boolean;
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