"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="
      fixed
      bottom-0
      left-0
      right-0
      z-50
      border-t
      bg-white/90
      backdrop-blur
    ">

      <div className="
        mx-auto
        flex
        max-w-xl
        items-center
        justify-around
        py-3
        text-xs
        text-gray-500
      ">

        <Link href="/" className="flex flex-col items-center gap-1">
          <span className="text-xl">⌂</span>
          Home
        </Link>


        <Link href="/search" className="flex flex-col items-center gap-1">
          <span className="text-xl">⌕</span>
          Search
        </Link>


        <Link
          href="/sell"
          className="
            -mt-8
            flex
            h-14
            w-14
            flex-col
            items-center
            justify-center
            rounded-full
            bg-black
            text-white
            shadow-lg
          "
        >
          <span className="text-2xl leading-none">
            +
          </span>
        </Link>


        <Link href="/inbox" className="flex flex-col items-center gap-1">
          <span className="text-xl">♡</span>
          Inbox
        </Link>


        <Link href="/profile" className="flex flex-col items-center gap-1">
          <span className="text-xl">○</span>
          Profile
        </Link>

      </div>

    </nav>
  );
}