import { doc, updateDoc, getDoc } from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  User,
} from "firebase/auth";
import { db } from "@/lib/firebase";

export async function updateDisplayName(uid: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name can't be empty.");
  await updateDoc(doc(db, "users", uid), { name: trimmed });
}

export async function getUserName(uid: string): Promise<string> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return "";
  return (snap.data().name as string) || "";
}

export async function changeUserPassword(
  user: User,
  currentPassword: string,
  newPassword: string
) {
  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }
  if (!user.email) {
    throw new Error("This account doesn't have an email/password login.");
  }

  // Firebase requires re-proving identity with the current password
  // before it'll allow a password change — this is Firebase's own
  // security requirement, not something we're adding.
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}