import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as fbLimit,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  imageUrls: string[];
  quantity: number;
  sellerId: string;
  sellerEmail: string;
  createdAt: Timestamp | null;
  status: "active" | "draft" | "sold";
};

type CreateListingInput = {
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  quantity: number;
  photos: File[];
  sellerId: string;
  sellerEmail: string;
  status?: "active" | "draft";
};

export async function uploadPhotos(
  sellerId: string,
  photos: File[]
): Promise<string[]> {
  const urls: string[] = [];

  for (const photo of photos) {
    const path = `listings/${sellerId}/${Date.now()}-${photo.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, photo);
    const url = await getDownloadURL(storageRef);
    urls.push(url);
  }

  return urls;
}

// Best-effort deletion — a photo already gone or a permissions hiccup
// shouldn't block the rest of the operation, so failures are swallowed.
export async function deletePhotosByUrl(urls: string[]) {
  await Promise.all(
    urls.map(async (url) => {
      try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
      } catch (err) {
        console.warn("Could not delete storage file:", url, err);
      }
    })
  );
}

export async function createListing(input: CreateListingInput) {
  const {
    title, description, category, price, location, quantity,
    photos, sellerId, sellerEmail, status = "active",
  } = input;

  const imageUrls = await uploadPhotos(sellerId, photos);

  const docRef = await addDoc(collection(db, "listings"), {
    title, description, category, price, location, quantity, imageUrls,
    sellerId, sellerEmail,
    createdAt: serverTimestamp(),
    status,
  });

  return docRef.id;
}

export async function getListing(id: string): Promise<Listing | null> {
  const snap = await getDoc(doc(db, "listings", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Listing;
}

export async function getListings(max = 20): Promise<Listing[]> {
  const q = query(
    collection(db, "listings"),
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    fbLimit(max)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
}

export async function getListingsByUser(uid: string): Promise<Listing[]> {
  const q = query(
    collection(db, "listings"),
    where("sellerId", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
}

export async function updateListing(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    category: string;
    price: number;
    location: string;
    quantity: number;
    imageUrls: string[];
    status: "active" | "draft" | "sold";
  }>
) {
  await updateDoc(doc(db, "listings", id), updates);
}

// Deletes the Firestore doc AND any photos in Storage tied to it.
export async function deleteListing(id: string) {
  const listing = await getListing(id);

  await deleteDoc(doc(db, "listings", id));

  if (listing && listing.imageUrls.length > 0) {
    await deletePhotosByUrl(listing.imageUrls);
  }
}