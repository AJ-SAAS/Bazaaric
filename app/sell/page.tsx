import { Suspense } from "react";
import SellPageContent from "./SellPageContent";

export default function SellPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </main>
      }
    >
      <SellPageContent />
    </Suspense>
  );
}