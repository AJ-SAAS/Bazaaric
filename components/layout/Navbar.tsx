"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Home,
  Plus,
  MessageCircle,
  User,
  Heart,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listenToUserChats } from "@/lib/chat";

export default function Navbar() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = listenToUserChats(user.uid, (chats) => {
      const count = chats.filter(
        (c) => c.lastMessage && !c.readBy?.includes(user.uid)
      ).length;
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-50
          border-t
          border-black/5
          bg-white/90
          backdrop-blur
          md:hidden
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-md
            items-center
            justify-around
            px-4
            py-2
            text-[11px]
            text-gray-500
          "
        >
          <Link href="/" className="flex flex-col items-center gap-1">
            <Home size={21} />
            Home
          </Link>

          <Link href="/favorites" className="flex flex-col items-center gap-1">
            <Heart size={21} />
            Favorites
          </Link>

          <Link
            href="/sell"
            className="
              -mt-7
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-teal
              text-white
              shadow-lg
            "
          >
            <Plus size={28} />
          </Link>

          <Link href="/inbox" className="relative flex flex-col items-center gap-1">
            <MessageCircle size={21} />
            Inbox
            {unreadCount > 0 && (
              <span className="absolute -top-1 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link href="/profile" className="flex flex-col items-center gap-1">
              <User size={21} />
              Profile
            </Link>
          ) : (
            <Link href="/auth" className="flex flex-col items-center gap-1">
              <User size={21} />
              Log in
            </Link>
          )}
        </div>
      </nav>

      {/* Desktop top nav */}
      <nav
        className="
          hidden
          md:block
          sticky
          top-0
          z-50
          border-b
          border-black/5
          bg-white/90
          backdrop-blur
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
            px-8
            py-4
          "
        >
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Bazaaric" width={32} height={32} />
            <span className="text-xl font-bold tracking-tight">Bazaaric</span>
          </Link>

          <div className="flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/" className="flex items-center gap-2 hover:text-black">
              <Home size={18} />
              Home
            </Link>
            <Link href="/favorites" className="flex items-center gap-2 hover:text-black">
              <Heart size={18} />
              Favorites
            </Link>
            <Link href="/inbox" className="relative flex items-center gap-2 hover:text-black">
              <MessageCircle size={18} />
              Inbox
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            {user && (
              <Link href="/profile" className="flex items-center gap-2 hover:text-black">
                <User size={18} />
                Profile
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!user && (
              <Link
                href="/auth"
                className="
                  rounded-full
                  border
                  border-gray-300
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-gray-700
                  transition
                  hover:bg-gray-50
                "
              >
                Sign up / Log in
              </Link>
            )}

            <Link
              href="/sell"
              className="
                flex
                items-center
                gap-2
                rounded-full
                bg-teal
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-teal-dark
              "
            >
              <Plus size={18} />
              Sell
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}