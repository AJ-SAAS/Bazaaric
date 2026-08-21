import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function getAuthedUid(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const idToken = authHeader.slice("Bearer ".length);

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}