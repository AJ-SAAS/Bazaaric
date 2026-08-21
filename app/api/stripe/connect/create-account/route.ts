import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { getAuthedUid } from "@/lib/api-auth";

const ALLOWED_COUNTRIES = ["LV", "EE", "LT"] as const;
type AllowedCountry = (typeof ALLOWED_COUNTRIES)[number];

function isAllowedCountry(value: unknown): value is AllowedCountry {
  return typeof value === "string" && (ALLOWED_COUNTRIES as readonly string[]).includes(value);
}

export async function POST(req: NextRequest) {
  const uid = await getAuthedUid(req);
  if (!uid) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const country: AllowedCountry = isAllowedCountry(body.country) ? body.country : "LV";

  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  let accountId = userData?.stripeAccountId as string | undefined;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country, // locked in permanently at creation — can't be changed later
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
    });

    accountId = account.id;

    await userRef.set(
      { stripeAccountId: accountId, stripeAccountCountry: country },
      { merge: true }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/profile?stripe=refresh`,
    return_url: `${baseUrl}/profile?stripe=return`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}