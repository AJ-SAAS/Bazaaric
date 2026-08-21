"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getOrder, Order } from "@/lib/orders";
import Navbar from "@/components/layout/Navbar";
import { CheckCircle2 } from "lucide-react";

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <CheckCircle2 size={56} className="mx-auto text-teal" />

        <h1 className="mt-6 text-2xl font-bold">Payment successful!</h1>

        <p className="mt-3 text-sm text-gray-600">
          {order
            ? `Your payment for "${order.listingTitle}" went through. The seller has been notified.`
            : "Your payment went through. The seller has been notified."}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/offers"
            className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-dark"
          >
            View your orders
          </Link>

          <Link
            href="/"
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Continue browsing
          </Link>
        </div>
      </div>
    </main>
  );
}