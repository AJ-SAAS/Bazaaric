import { Suspense } from "react";
import ProfilePageContent from "./ProfilePageContent";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </main>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}