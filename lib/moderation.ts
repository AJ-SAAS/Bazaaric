import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ReportReason =
  | "scam_or_fraud"
  | "harassment"
  | "prohibited_item"
  | "counterfeit"
  | "spam"
  | "other";

function blockId(blockerId: string, blockedId: string) {
  return `${blockerId}_${blockedId}`;
}

export async function blockUser(blockerId: string, blockedId: string) {
  await setDoc(doc(db, "blocks", blockId(blockerId, blockedId)), {
    blockerId,
    blockedId,
    createdAt: serverTimestamp(),
  });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await deleteDoc(doc(db, "blocks", blockId(blockerId, blockedId)));
}

export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const q = query(
    collection(db, "blocks"),
    where("blockerId", "==", blockerId),
    where("blockedId", "==", blockedId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// Returns true if either user has blocked the other
export async function isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean> {
  const q1 = query(
    collection(db, "blocks"),
    where("blockerId", "==", userIdA),
    where("blockedId", "==", userIdB)
  );
  const q2 = query(
    collection(db, "blocks"),
    where("blockerId", "==", userIdB),
    where("blockedId", "==", userIdA)
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  return !snap1.empty || !snap2.empty;
}

// Returns the set of userIds this user has blocked
export async function getBlockedUserIds(blockerId: string): Promise<Set<string>> {
  const q = query(collection(db, "blocks"), where("blockerId", "==", blockerId));
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => d.data().blockedId as string));
}

// Returns the set of userIds this user has blocked, OR who have blocked this user —
// used to hide listings symmetrically (so a blocked user's listings also disappear
// for someone THEY blocked, and vice versa)
export async function getMutuallyBlockedUserIds(userId: string): Promise<Set<string>> {
  const q1 = query(collection(db, "blocks"), where("blockerId", "==", userId));
  const q2 = query(collection(db, "blocks"), where("blockedId", "==", userId));

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const ids = new Set<string>();
  snap1.docs.forEach((d) => ids.add(d.data().blockedId as string));
  snap2.docs.forEach((d) => ids.add(d.data().blockerId as string));

  return ids;
}

type ReportUserInput = {
  reporterId: string;
  reportedUserId: string;
  reportedUserEmail: string;
  reason: ReportReason;
  details: string;
  chatId?: string;
  listingId?: string;
};

export async function reportUser(input: ReportUserInput) {
  await addDoc(collection(db, "reports"), {
    type: "user",
    ...input,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

type ReportListingInput = {
  reporterId: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  reason: ReportReason;
  details: string;
};

export async function reportListing(input: ReportListingInput) {
  await addDoc(collection(db, "reports"), {
    type: "listing",
    ...input,
    status: "open",
    createdAt: serverTimestamp(),
  });
}