import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type OrderStatus =
  | "offer_pending"
  | "offer_accepted"
  | "offer_declined"
  | "completed"
  | "cancelled";

export type Order = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  originalPrice: number;
  offerAmount: number;
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerEmail: string;
  status: OrderStatus;
  // Reserved for future payment integration (Stripe Connect, etc.)
  // "not_applicable" until checkout exists — flips to unpaid/paid/refunded later
  paymentStatus: "not_applicable" | "unpaid" | "paid" | "refunded";
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

type CreateOfferInput = {
  listingId: string;
  listingTitle: string;
  listingImage: string;
  originalPrice: number;
  offerAmount: number;
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerEmail: string;
};

export async function createOffer(input: CreateOfferInput): Promise<string> {
  const docRef = await addDoc(collection(db, "orders"), {
    ...input,
    status: "offer_pending" as OrderStatus,
    paymentStatus: "not_applicable",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function acceptOffer(orderId: string) {
  await updateOrderStatus(orderId, "offer_accepted");
}

export async function declineOffer(orderId: string) {
  await updateOrderStatus(orderId, "offer_declined");
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

// Fetches orders where the user is either buyer or seller
export async function getOrdersForUser(uid: string): Promise<Order[]> {
  const buyerQ = query(
    collection(db, "orders"),
    where("buyerId", "==", uid),
    orderBy("createdAt", "desc")
  );
  const sellerQ = query(
    collection(db, "orders"),
    where("sellerId", "==", uid),
    orderBy("createdAt", "desc")
  );

  const [buyerSnap, sellerSnap] = await Promise.all([
    getDocs(buyerQ),
    getDocs(sellerQ),
  ]);

  const buyerOrders = buyerSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  const sellerOrders = sellerSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));

  const map = new Map<string, Order>();
  [...buyerOrders, ...sellerOrders].forEach((o) => map.set(o.id, o));

  return Array.from(map.values()).sort((a, b) => {
    const at = a.createdAt?.toMillis() ?? 0;
    const bt = b.createdAt?.toMillis() ?? 0;
    return bt - at;
  });
}