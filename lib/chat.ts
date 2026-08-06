import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit as fbLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Chat = {
  id: string;
  participants: string[];
  buyerId: string;
  sellerId: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  lastMessage: string;
  lastMessageAt: Timestamp | null;
  createdAt: Timestamp | null;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp | null;
};

// Finds an existing chat between this buyer and this listing, or creates one.
export async function getOrCreateChat(params: {
  listingId: string;
  listingTitle: string;
  listingImage: string;
  buyerId: string;
  sellerId: string;
}): Promise<string> {
  const { listingId, listingTitle, listingImage, buyerId, sellerId } = params;

  // Sellers can't message themselves
  if (buyerId === sellerId) {
    throw new Error("You can't message yourself about your own listing.");
  }

  const q = query(
    collection(db, "chats"),
    where("listingId", "==", listingId),
    where("buyerId", "==", buyerId)
  );

  const existing = await getDocs(q);
  if (!existing.empty) {
    return existing.docs[0].id;
  }

  const docRef = await addDoc(collection(db, "chats"), {
    participants: [buyerId, sellerId],
    buyerId,
    sellerId,
    listingId,
    listingTitle,
    listingImage,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  // Update chat preview fields — using addDoc's parent path directly
  const { updateDoc, doc: docRef } = await import("firebase/firestore");
  await updateDoc(docRef(db, "chats", chatId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
  });
}

// Real-time listener for messages in a chat
export function listenToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
    callback(messages);
  });
}

// Real-time listener for a user's chat list (inbox)
export function listenToUserChats(
  uid: string,
  callback: (chats: Chat[]) => void
) {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
    callback(chats);
  });
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const q = query(collection(db, "chats"), where("__name__", "==", chatId), fbLimit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Chat;
}