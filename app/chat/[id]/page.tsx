"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listenToMessages, sendMessage, getChat, markChatAsRead, Chat, Message } from "@/lib/chat";
import Navbar from "@/components/layout/Navbar";
import { Send } from "lucide-react";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;

  const { user, loading } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!chatId) return;
    getChat(chatId).then(setChat);
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = listenToMessages(chatId, setMessages);
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !user) return;
    markChatAsRead(chatId, user.uid);
  }, [chatId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;

    setSending(true);
    try {
      await sendMessage(chatId, user.uid, text);
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] flex flex-col">
      <Navbar />

      <div className="mx-auto w-full max-w-md md:max-w-2xl px-4 md:px-8 pt-4 flex-1 flex flex-col">
        {chat && (
          <div className="flex items-center gap-3 border-b border-black/5 pb-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {chat.listingImage && (
                <img src={chat.listingImage} alt={chat.listingTitle} className="h-full w-full object-cover" />
              )}
            </div>
            <p className="text-sm font-semibold truncate">{chat.listingTitle}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-gray-500 mt-8">
              Say hello to start the conversation.
            </p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === user.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMine
                        ? "bg-[#2F855A] text-white"
                        : "bg-white ring-1 ring-black/5 text-gray-900"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="sticky bottom-20 md:bottom-4 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5 mb-4"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2F855A] text-white disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </main>
  );
}