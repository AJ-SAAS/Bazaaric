import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        const usersSnap = await adminDb
          .collection("users")
          .where("stripeAccountId", "==", account.id)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const uid = usersSnap.docs[0].id;
          const profileRef = adminDb.collection("public_profiles").doc(uid);
          const profileSnap = await profileRef.get();

          if (profileSnap.exists) {
            await profileRef.set(
              { stripeChargesEnabled: !!account.charges_enabled },
              { merge: true }
            );
          }
        }

        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error("checkout.session.completed missing orderId in metadata");
          break;
        }

        const orderRef = adminDb.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
          console.error("checkout.session.completed: order not found", orderId);
          break;
        }

        const order = orderSnap.data()!;

        await orderRef.set(
          {
            status: "completed",
            paymentStatus: "paid",
            stripeCheckoutSessionId: session.id,
            updatedAt: new Date(),
          },
          { merge: true }
        );

        if (order.listingId) {
          await adminDb.collection("listings").doc(order.listingId).set(
            { status: "sold" },
            { merge: true }
          );
        }

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}