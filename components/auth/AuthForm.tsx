"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

type Mode = "login" | "signup" | "reset";

export default function AuthForm() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset email sent. Check your inbox.");
        setLoading(false);
        return;
      }

      // Set persistence before signing in/up:
      // local = survives closing the browser, session = cleared when tab/browser closes
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      if (mode === "signup") {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name,
          email,
          createdAt: new Date(),
        });

        router.push("/profile");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/profile");
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto mt-12">
      {mode !== "reset" && (
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-xl p-3 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-black text-white"
                : "bg-white ring-1 ring-black/10 text-gray-600"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-xl p-3 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-black text-white"
                : "bg-white ring-1 ring-black/10 text-gray-600"
            }`}
          >
            Sign Up
          </button>
        </div>
      )}

      {mode === "reset" && (
        <h2 className="mb-6 text-center text-lg font-semibold">
          Reset your password
        </h2>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <input
            className="w-full rounded-xl bg-white p-3 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-[#2F855A]"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          className="w-full rounded-xl bg-white p-3 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-[#2F855A]"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {mode !== "reset" && (
          <input
            className="w-full rounded-xl bg-white p-3 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-[#2F855A]"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}

        {mode === "login" && (
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded"
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => setMode("reset")}
              className="text-[#2F855A] font-medium"
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-[#2F855A] p-3 text-sm font-semibold text-white transition hover:bg-[#276749] disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : mode === "signup"
            ? "Create account"
            : mode === "reset"
            ? "Send reset link"
            : "Login"}
        </button>

        {mode === "reset" && (
          <button
            type="button"
            onClick={() => setMode("login")}
            className="w-full text-center text-sm text-gray-500"
          >
            Back to login
          </button>
        )}
      </form>

      {message && (
        <p className="mt-4 text-sm text-center text-gray-700">{message}</p>
      )}
    </div>
  );
}