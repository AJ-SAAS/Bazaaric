import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getListing, Listing } from "@/lib/listings";

function favoriteId(userId: string, listingId: string) {
  return `${userId}_${listingId}`;
}

export async function addFavorite(userId: string, listingId: string) {
  await setDoc(doc(db, "favorites", favoriteId(userId, listingId)), {
    userId,
    listingId,
    createdAt: new Date(),
  });
}

export async function removeFavorite(userId: string, listingId: string) {
  await deleteDoc(doc(db, "favorites", favoriteId(userId, listingId)));
}

export async function getUserFavoriteIds(userId: string): Promise<Set<string>> {
  const q = query(collection(db, "favorites"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => d.data().listingId as string));
}

export async function getUserFavoriteListings(userId: string): Promise<Listing[]> {
  const ids = await getUserFavoriteIds(userId);
  const listings = await Promise.all(
    Array.from(ids).map((id) => getListing(id))
  );
  return listings.filter((l): l is Listing => l !== null);
}