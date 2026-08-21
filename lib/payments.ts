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

export async function startStripeOnboarding(): Promise<string> {
  const data = await authedFetch("/api/stripe/connect/create-account", {
    method: "POST",
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