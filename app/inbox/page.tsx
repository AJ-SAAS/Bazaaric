"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listenToUserChats, Chat } from "@/lib/chat";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function InboxPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToUserChats(user.uid, (data) => {
      setChats(data);
      setChatsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold">Inbox</h1>

        {chatsLoading ? (
          <p className="mt-6 text-sm text-gray-500">Loading conversations...</p>
        ) : chats.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            No conversations yet. Message a seller from an item page to start one.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {chats.map((chat) => {
              const otherRole = chat.buyerId === user.uid ? "seller" : "buyer";

              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {chat.listingImage && (
                      <img
                        src={chat.listingImage}
                        alt={chat.listingTitle}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{chat.listingTitle}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {chat.lastMessage || `Say hello to the ${otherRole}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}