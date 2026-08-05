"use client";

import Link from "next/link";
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
} from "lucide-react";


export default function Navbar() {
  return (
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

        <Link
          href="/"
          className="
            flex
            flex-col
            items-center
            gap-1
          "
        >
          <Home size={21}/>
          Home
        </Link>


        <Link
          href="/search"
          className="
            flex
            flex-col
            items-center
            gap-1
          "
        >
          <Search size={21}/>
          Search
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
          <Plus size={28}/>
        </Link>


        <Link
          href="/inbox"
          className="
            flex
            flex-col
            items-center
            gap-1
          "
        >
          <MessageCircle size={21}/>
          Inbox
        </Link>


        <Link
          href="/profile"
          className="
            flex
            flex-col
            items-center
            gap-1
          "
        >
          <User size={21}/>
          Profile
        </Link>

      </div>

    </nav>
  );
}