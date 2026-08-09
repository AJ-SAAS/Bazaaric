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
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isBlockedEitherWay } from "@/lib/moderation";

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
  lastMessageSenderId: string;
  readBy: string[];
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

  if (buyerId === sellerId) {
    throw new Error("You can't message yourself about your own listing.");
  }

  const blocked = await isBlockedEitherWay(buyerId, sellerId);
  if (blocked) {
    throw new Error("You can't message this user.");
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
    lastMessageSenderId: "",
    readBy: [buyerId, sellerId], // no message yet, so nothing to be "unread"
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const chat = await getChat(chatId);
  if (chat) {
    const otherUserId = chat.buyerId === senderId ? chat.sellerId : chat.buyerId;
    const blocked = await isBlockedEitherWay(senderId, otherUserId);
    if (blocked) {
      throw new Error("You can't send messages in this conversation.");
    }
  }

  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
    readBy: [senderId], // reset — only the sender has "read" their own message
  });
}

// Call this when a user opens a chat, to mark it as read for them
export async function markChatAsRead(chatId: string, userId: string) {
  await updateDoc(doc(db, "chats", chatId), {
    readBy: arrayUnion(userId),
  });
}

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

export function listenToUserChats(
  uid: string,
  callback: (chats: Chat[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
      callback(chats);
    },
    (error) => {
      console.error("listenToUserChats error:", error);
      if (onError) onError(error);
    }
  );
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const q = query(collection(db, "chats"), where("__name__", "==", chatId), fbLimit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Chat;
}