import { Suspense } from "react";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <main className="min-h-screen overflow-x-hidden p-6">
      <Link
        href="/"
        className="inline-block text-xl font-bold tracking-tight"
      >
        Bazaaric
      </Link>

      <h1 className="text-3xl font-bold text-center mt-6 break-words">
        Welcome to Bazaaric
      </h1>

      <p className="text-center text-gray-500 mt-2 break-words">
        Buy and sell across the Baltics
      </p>

      <Suspense fallback={<div className="mt-20 text-center text-sm text-gray-500">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}