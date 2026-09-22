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

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
  }

  const orderRef = adminDb.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const order = orderSnap.data()!;

  if (order.sellerId !== uid) {
    return NextResponse.json({ error: "Only the seller can decline a refund." }, { status: 403 });
  }

  if (order.status !== "refund_requested") {
    return NextResponse.json({ error: "There's no pending refund request for this order." }, { status: 400 });
  }

  await orderRef.set(
    {
      status: "completed",
      refundDeclinedAt: new Date(),
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return NextResponse.json({ success: true });
}