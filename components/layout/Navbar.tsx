"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="max-w-xl mx-auto flex justify-around py-3 text-sm">

        <Link href="/" className="flex flex-col items-center">
          🏠
          <span>Home</span>
        </Link>

        <Link href="/search" className="flex flex-col items-center">
          🔍
          <span>Search</span>
        </Link>

        <Link
          href="/sell"
          className="flex flex-col items-center bg-black text-white rounded-full px-5 py-2 -mt-6"
        >
          ＋
          <span>Sell</span>
        </Link>

        <Link href="/inbox" className="flex flex-col items-center">
          💬
          <span>Inbox</span>
        </Link>

        <Link href="/profile" className="flex flex-col items-center">
          👤
          <span>Profile</span>
        </Link>

      </div>
    </nav>
  );
}