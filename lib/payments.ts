import { auth } from "@/lib/firebase";

async function authedFetch(path: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("You need to be logged in.");

  const idToken = await user.getIdToken();

  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Something went wrong.");
  }

  return res.json();
}

export async function startStripeOnboarding(country: string): Promise<string> {
  const data = await authedFetch("/api/stripe/connect/create-account", {
    method: "POST",
    body: JSON.stringify({ country }),
  });
  return data.url as string;
}

export async function refreshStripeStatus(): Promise<{
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  return authedFetch("/api/stripe/connect/refresh-status", {
    method: "POST",
  });
}

export async function createCheckoutSession(orderId: string): Promise<string> {
  const data = await authedFetch("/api/stripe/checkout/create-session", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
  return data.url as string;
}

export async function requestRefund(orderId: string): Promise<void> {
  await authedFetch("/api/stripe/refund", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}