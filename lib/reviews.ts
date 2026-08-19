import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getOrder } from "@/lib/orders";

export type Review = {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Timestamp | null;
};

export type RatingStats = {
  count: number;
  average: number;
  positivePercent: number; // % of reviews rated 4 or 5
};

// Deterministic ID (orderId + reviewer) means the security rule's
// create-only-if-absent check is enough to stop double reviews on
// the same order.
function reviewId(orderId: string, reviewerId: string) {
  return `${orderId}_${reviewerId}`;
}

type SubmitReviewInput = {
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
};

export async function submitReview(input: SubmitReviewInput): Promise<void> {
  const { orderId, reviewerId, revieweeId, rating, comment } = input;

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const order = await getOrder(orderId);
  if (!order) throw new Error("Order not found.");
  if (order.status !== "completed") {
    throw new Error("You can only review a completed order.");
  }
  if (reviewerId !== order.buyerId && reviewerId !== order.sellerId) {
    throw new Error("You weren't part of this order.");
  }

  const id = reviewId(orderId, reviewerId);
  const existing = await getDoc(doc(db, "reviews", id));
  if (existing.exists()) {
    throw new Error("You've already reviewed this order.");
  }

  await setDoc(doc(db, "reviews", id), {
    orderId,
    reviewerId,
    revieweeId,
    rating,
    comment: comment.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function hasReviewedOrder(orderId: string, reviewerId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "reviews", reviewId(orderId, reviewerId)));
  return snap.exists();
}

export async function getReviewsForUser(userId: string): Promise<Review[]> {
  const q = query(
    collection(db, "reviews"),
    where("revieweeId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}

export async function getRatingStats(userId: string): Promise<RatingStats> {
  const reviews = await getReviewsForUser(userId);

  if (reviews.length === 0) {
    return { count: 0, average: 0, positivePercent: 0 };
  }

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const positive = reviews.filter((r) => r.rating >= 4).length;

  return {
    count: reviews.length,
    average: Math.round((total / reviews.length) * 10) / 10,
    positivePercent: Math.round((positive / reviews.length) * 100),
  };
}