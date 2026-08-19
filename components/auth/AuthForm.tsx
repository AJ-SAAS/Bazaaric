"use client";

import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { claimUsername, isUsernameAvailable, isValidUsername } from "@/lib/profiles";

type Mode = "login" | "signup" | "reset";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/profile";

  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  useEffect(() => {
    if (mode !== "signup") return;

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus("idle");
      return;
    }

    const validationError = isValidUsername(trimmed);
    if (validationError) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(trimmed);
        setUsernameStatus(available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [username, mode]);

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

      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      if (mode === "signup") {
        const trimmedUsername = username.trim();
        const validationError = isValidUsername(trimmedUsername);
        if (validationError) {
          setMessage(validationError);
          setLoading(false);
          return;
        }

        const available = await isUsernameAvailable(trimmedUsername);
        if (!available) {
          setMessage("That username is already taken.");
          setUsernameStatus("taken");
          setLoading(false);
          return;
        }

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

        try {
          await claimUsername(user.uid, trimmedUsername);
        } catch (claimError: any) {
          console.error("Username claim failed after signup:", claimError);
        }

        router.push(redirectTo);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.push(redirectTo);
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const usernameHint =
    usernameStatus === "checking"
      ? "Checking availability..."
      : usernameStatus === "available"
      ? "Username is available"
      : usernameStatus === "taken"
      ? "That username is already taken"
      : usernameStatus === "invalid"
      ? "3-20 characters, letters/numbers/underscores only"
      : "";

  const usernameHintColor =
    usernameStatus === "available"
      ? "text-green-600"
      : usernameStatus === "taken" || usernameStatus === "invalid"
      ? "text-red-600"
      : "text-gray-500";

  return (
    <div className="w-full max-w-md mx-auto mt-12 min-w-0">
      {mode !== "reset" && (
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-xl p-3 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-ink text-white"
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
                ? "bg-ink text-white"
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

      <form onSubmit={handleSubmit} className="space-y-3 min-w-0">
        {mode === "signup" && (
          <input
            className="w-full rounded-xl bg-white p-3 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        {mode === "signup" && (
          <div className="min-w-0">
            <input
              className="w-full rounded-xl bg-white p-3 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
            {usernameHint && (
              <p className={`mt-1 pl-1 text-xs break-words ${usernameHintColor}`}>{usernameHint}</p>
            )}
            {!usernameHint && (
              <p className="mt-1 pl-1 text-xs text-gray-400 break-words">
                This is what buyers and sellers will see instead of your email.
              </p>
            )}
          </div>
        )}

        <input
          className="w-full rounded-xl bg-white p-3 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {mode !== "reset" && (
          <input
            className="w-full rounded-xl bg-white p-3 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-teal"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}

        {mode === "login" && (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm min-w-0">
            <label className="flex items-center gap-2 text-gray-600 min-w-0">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded shrink-0"
              />
              <span className="truncate">Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => setMode("reset")}
              className="text-teal font-medium shrink-0"
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          disabled={loading || (mode === "signup" && usernameStatus === "taken")}
          className="w-full rounded-xl bg-teal p-3 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
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
        <p className="mt-4 text-sm text-center text-gray-700 break-words">{message}</p>
      )}
    </div>
  );
}