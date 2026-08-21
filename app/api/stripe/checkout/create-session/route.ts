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

  if (order.buyerId !== uid) {
    return NextResponse.json({ error: "This isn't your order." }, { status: 403 });
  }

  if (order.status !== "offer_accepted") {
    return NextResponse.json({ error: "This offer hasn't been accepted yet." }, { status: 400 });
  }

  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "This order has already been paid." }, { status: 400 });
  }

  const sellerUserSnap = await adminDb.collection("users").doc(order.sellerId).get();
  const sellerAccountId = sellerUserSnap.data()?.stripeAccountId as string | undefined;

  const sellerProfileSnap = await adminDb.collection("public_profiles").doc(order.sellerId).get();
  const sellerChargesEnabled = !!sellerProfileSnap.data()?.stripeChargesEnabled;

  if (!sellerAccountId || !sellerChargesEnabled) {
    return NextResponse.json(
      { error: "The seller hasn't finished setting up payouts yet. Try again later or message them." },
      { status: 400 }
    );
  }

  const offerAmount = order.offerAmount as number;

  // €0.50 flat + 5% buyer protection fee
  const fee = Math.round((0.5 + offerAmount * 0.05) * 100) / 100;
  const totalCents = Math.round((offerAmount + fee) * 100);
  const feeCents = Math.round(fee * 100);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: order.listingTitle,
            images: order.listingImage ? [order.listingImage] : undefined,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: feeCents,
      transfer_data: {
        destination: sellerAccountId,
      },
    },
    metadata: {
      orderId,
    },
    success_url: `${baseUrl}/orders/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/offers`,
  });

  return NextResponse.json({ url: session.url });
}