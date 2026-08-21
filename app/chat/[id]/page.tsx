"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listenToMessages, sendMessage, getChat, markChatAsRead, Chat, Message } from "@/lib/chat";
import { blockUser, reportUser } from "@/lib/moderation";
import { getOrder, acceptOffer, declineOffer, Order } from "@/lib/orders";
import { getPublicProfile } from "@/lib/profiles";
import { createCheckoutSession } from "@/lib/payments";
import Navbar from "@/components/layout/Navbar";
import ReportModal from "@/components/moderation/ReportModal";
import { Send, MoreVertical, ShieldOff, Flag, Check, X as XIcon } from "lucide-react";

const orderStatusStyles: Record<Order["status"], string> = {
  offer_pending: "bg-amber-100 text-amber-700",
  offer_accepted: "bg-green-100 text-green-700",
  offer_declined: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

const orderStatusLabels: Record<Order["status"], string> = {
  offer_pending: "Pending",
  offer_accepted: "Accepted",
  offer_declined: "Declined",
  completed: "Paid",
  cancelled: "Cancelled",
};

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

  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [blocking, setBlocking] = useState(false);

  // Live order data keyed by orderId, for any offer messages in this chat
  const [ordersById, setOrdersById] = useState<Record<string, Order>>({});
  const [actingOnOrder, setActingOnOrder] = useState<string | null>(null);

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

  // Whenever the message list changes, fetch/refresh the live order data
  // for any offer messages present, so status stays accurate.
  useEffect(() => {
    const orderIds = Array.from(
      new Set(messages.map((m) => m.orderId).filter((id): id is string => !!id))
    );
    if (orderIds.length === 0) return;

    Promise.all(orderIds.map((id) => getOrder(id))).then((results) => {
      const map: Record<string, Order> = {};
      results.forEach((order) => {
        if (order) map[order.id] = order;
      });
      setOrdersById((prev) => ({ ...prev, ...map }));
    });
  }, [messages]);

  useEffect(() => {
    if (!chatId || !user) return;
    markChatAsRead(chatId, user.uid);
  }, [chatId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function otherUserId() {
    if (!chat || !user) return null;
    return chat.buyerId === user.uid ? chat.sellerId : chat.buyerId;
  }

  async function handleBlock() {
    const otherId = otherUserId();
    if (!user || !otherId) return;
    if (!confirm("Block this user? You won't see their listings or be able to message them.")) return;

    setBlocking(true);
    try {
      await blockUser(user.uid, otherId);
      router.push("/inbox");
    } finally {
      setBlocking(false);
    }
  }

  async function handleReportSubmit(reason: any, details: string) {
    const otherId = otherUserId();
    if (!user || !otherId || !chat) return;

    await reportUser({
      reporterId: user.uid,
      reportedUserId: otherId,
      reportedUserEmail: "",
      reason,
      details,
      chatId: chat.id,
      listingId: chat.listingId,
    });
  }

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

  async function refreshOrder(orderId: string) {
    const order = await getOrder(orderId);
    if (order) {
      setOrdersById((prev) => ({ ...prev, [orderId]: order }));
    }
  }

  async function handleAcceptOffer(order: Order) {
    if (!user) return;

    const profile = await getPublicProfile(user.uid);
    if (!profile?.stripeChargesEnabled) {
      if (
        confirm(
          "You need to set up payouts before accepting offers, so you can actually get paid. Set up payouts now?"
        )
      ) {
        router.push("/profile");
      }
      return;
    }

    setActingOnOrder(order.id);
    try {
      await acceptOffer(order.id);
      await refreshOrder(order.id);
    } finally {
      setActingOnOrder(null);
    }
  }

  async function handleDeclineOffer(order: Order) {
    setActingOnOrder(order.id);
    try {
      await declineOffer(order.id);
      await refreshOrder(order.id);
    } finally {
      setActingOnOrder(null);
    }
  }

  async function handlePayNow(order: Order) {
    setActingOnOrder(order.id);
    try {
      const url = await createCheckoutSession(order.id);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message || "Couldn't start checkout. Try again.");
      setActingOnOrder(null);
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
          <div className="relative flex items-center justify-between gap-3 border-b border-black/5 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {chat.listingImage && (
                  <img src={chat.listingImage} alt={chat.listingTitle} className="h-full w-full object-cover" />
                )}
              </div>
              <p className="text-sm font-semibold truncate">{chat.listingTitle}</p>
            </div>

            <button
              onClick={() => setShowMenu((v) => !v)}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-1">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Flag size={15} />
                  Report user
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleBlock();
                  }}
                  disabled={blocking}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <ShieldOff size={15} />
                  Block user
                </button>
              </div>
            )}
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
              const order = msg.orderId ? ordersById[msg.orderId] : undefined;

              // Offer message with live order data — render as an interactive card
              if (msg.orderId && order && chat) {
                const isSeller = chat.sellerId === user.uid;
                const isBuyer = chat.buyerId === user.uid;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[85%] w-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                      {msg.imageUrl && (
                        <div className="mb-3 h-28 w-full overflow-hidden rounded-xl bg-black/5">
                          <img src={msg.imageUrl} alt="Item" className="h-full w-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900">
                          Offer: €{order.offerAmount.toFixed(2)}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusStyles[order.status]}`}
                        >
                          {orderStatusLabels[order.status]}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        Listed at €{order.originalPrice.toFixed(2)}
                      </p>

                      {isSeller && order.status === "offer_pending" && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleAcceptOffer(order)}
                            disabled={actingOnOrder === order.id}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-teal px-4 py-2 text-xs font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
                          >
                            <Check size={13} />
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineOffer(order)}
                            disabled={actingOnOrder === order.id}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            <XIcon size={13} />
                            Decline
                          </button>
                        </div>
                      )}

                      {isBuyer && order.status === "offer_accepted" && order.paymentStatus !== "paid" && (
                        <button
                          onClick={() => handlePayNow(order)}
                          disabled={actingOnOrder === order.id}
                          className="mt-3 w-full rounded-full bg-teal px-4 py-2 text-xs font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
                        >
                          {actingOnOrder === order.id ? "Redirecting..." : "Pay now"}
                        </button>
                      )}

                      {order.paymentStatus === "paid" && (
                        <p className="mt-3 text-xs font-medium text-teal">Payment received ✓</p>
                      )}
                    </div>
                  </div>
                );
              }

              // Image message with no linked order (fallback, shouldn't normally happen)
              if (msg.imageUrl) {
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] overflow-hidden rounded-2xl text-sm ${
                        isMine
                          ? "bg-teal text-white"
                          : "bg-white ring-1 ring-black/5 text-gray-900"
                      }`}
                    >
                      <div className="h-32 w-full bg-black/5">
                        <img
                          src={msg.imageUrl}
                          alt="Item"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="px-4 py-2.5 break-words">{msg.text}</div>
                    </div>
                  </div>
                );
              }

              // Plain text message
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm break-words ${
                      isMine
                        ? "bg-teal text-white"
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-white disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {showReportModal && (
        <ReportModal
          title="Report this user"
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </main>
  );
}