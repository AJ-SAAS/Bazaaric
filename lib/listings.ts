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

export type Condition = "new" | "used";

export type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: Condition;
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
  condition: Condition;
  price: number;
  location: string;
  quantity: number;
  photos: File[];
  sellerId: string;
  sellerEmail: string;
  status?: "active" | "draft";
  onUploadProgress?: (completed: number, total: number) => void;
};

// Resizes an image to a max dimension and re-encodes it as a compressed JPEG,
// entirely in the browser via canvas — no server round-trip, no user action needed.
function compressImage(file: File, maxDimension = 1600, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
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

export async function uploadPhotos(
  sellerId: string,
  photos: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  const total = photos.length;
  let completed = 0;

  async function uploadOne(photo: File): Promise<string> {
    const compressed = await compressImage(photo);

    const path = `listings/${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });
    const url = await getDownloadURL(storageRef);

    completed++;
    onProgress?.(completed, total);

    return url;
  }

  // All photos compress + upload in parallel instead of one at a time —
  // this is the main fix for multi-minute upload times.
  return Promise.all(photos.map(uploadOne));
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
    title, description, category, condition, price, location, quantity,
    photos, sellerId, sellerEmail, status = "active", onUploadProgress,
  } = input;

  const imageUrls = await uploadPhotos(sellerId, photos, onUploadProgress);

  const docRef = await addDoc(collection(db, "listings"), {
    title, description, category, condition, price, location, quantity, imageUrls,
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

// Owner-only view — includes drafts and sold items. Only works when the
// viewer IS the seller, since the rule falls back to status=="active"
// for anyone else. Use getActiveListingsByUser for public/seller-page views.
export async function getListingsByUser(uid: string): Promise<Listing[]> {
  const q = query(
    collection(db, "listings"),
    where("sellerId", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
}

// Public-safe version for viewing someone else's listings (e.g. a seller's
// public profile page). Filters status in the query itself, since the
// listings rule can't validate an unfiltered query for a non-owner viewer.
export async function getActiveListingsByUser(uid: string): Promise<Listing[]> {
  const q = query(
    collection(db, "listings"),
    where("sellerId", "==", uid),
    where("status", "==", "active"),
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
    condition: Condition;
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