"use client";

import Link from "next/link";
import {
  Home,
  Plus,
  MessageCircle,
  User,
  Heart,
} from "lucide-react";

export default function Navbar() {
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
              bg-[#2F855A]
              text-white
              shadow-lg
            "
          >
            <Plus size={28} />
          </Link>

          <Link href="/inbox" className="flex flex-col items-center gap-1">
            <MessageCircle size={21} />
            Inbox
          </Link>

          <Link href="/profile" className="flex flex-col items-center gap-1">
            <User size={21} />
            Profile
          </Link>
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
          <Link href="/" className="text-xl font-bold tracking-tight">
            Bazaaric
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
            <Link href="/inbox" className="flex items-center gap-2 hover:text-black">
              <MessageCircle size={18} />
              Inbox
            </Link>
            <Link href="/profile" className="flex items-center gap-2 hover:text-black">
              <User size={18} />
              Profile
            </Link>
          </div>

          <Link
            href="/sell"
            className="
              flex
              items-center
              gap-2
              rounded-full
              bg-[#2F855A]
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-[#276749]
            "
          >
            <Plus size={18} />
            Sell
          </Link>
        </div>
      </nav>
    </>
  );
}