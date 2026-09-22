import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuthedUid } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const uid = await getAuthedUid(req);
  if (!uid) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const orderId = body.orderId as string | undefined;
  const reason = body.reason as string | undefined;

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
  }

  const orderRef = adminDb.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const order = orderSnap.data()!;

  if (order.buyerId !== uid) {
    return NextResponse.json({ error: "Only the buyer can request a refund." }, { status: 403 });
  }

  if (order.paymentStatus !== "paid") {
    return NextResponse.json({ error: "This order hasn't been paid, so there's nothing to refund." }, { status: 400 });
  }

  if (order.status === "refund_requested") {
    return NextResponse.json({ error: "A refund has already been requested for this order." }, { status: 400 });
  }

  await orderRef.set(
    {
      status: "refund_requested",
      refundRequestedAt: new Date(),
      refundReason: reason ?? null,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return NextResponse.json({ success: true });
}