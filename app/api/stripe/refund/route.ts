import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
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

  if (order.buyerId !== uid && order.sellerId !== uid) {
    return NextResponse.json({ error: "This isn't your order." }, { status: 403 });
  }

  if (order.paymentStatus !== "paid") {
    return NextResponse.json({ error: "This order hasn't been paid, so there's nothing to refund." }, { status: 400 });
  }

  const sessionId = order.stripeCheckoutSessionId as string | undefined;
  if (!sessionId) {
    return NextResponse.json({ error: "No payment record found for this order." }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntentId = session.payment_intent as string | null;

  if (!paymentIntentId) {
    return NextResponse.json({ error: "Couldn't find the original payment." }, { status: 400 });
  }

  // Refund the full amount, reversing both the transfer to the seller
  // and Bazaaric's own application fee, so both sides get their money back.
  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reverse_transfer: true,
    refund_application_fee: true,
  });

  await orderRef.set(
    {
      status: "cancelled",
      paymentStatus: "refunded",
      updatedAt: new Date(),
    },
    { merge: true }
  );

  if (order.listingId) {
    await adminDb.collection("listings").doc(order.listingId).set(
      { status: "active" },
      { merge: true }
    );
  }

  return NextResponse.json({ success: true });
}