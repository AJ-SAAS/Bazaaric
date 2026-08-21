import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { getAuthedUid } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const uid = await getAuthedUid(req);
  if (!uid) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const accountId = userSnap.data()?.stripeAccountId as string | undefined;

  if (!accountId) {
    return NextResponse.json({ chargesEnabled: false, detailsSubmitted: false });
  }

  const account = await stripe.accounts.retrieve(accountId);

  const chargesEnabled = !!account.charges_enabled;
  const detailsSubmitted = !!account.details_submitted;

  const profileRef = adminDb.collection("public_profiles").doc(uid);
  const profileSnap = await profileRef.get();

  // Only touch the public profile if it already exists (i.e. they've
  // claimed a username) — don't create a partial doc missing required fields.
  if (profileSnap.exists) {
    await profileRef.set({ stripeChargesEnabled: chargesEnabled }, { merge: true });
  }

  return NextResponse.json({ chargesEnabled, detailsSubmitted });
}