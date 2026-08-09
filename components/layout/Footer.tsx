import Link from "next/link";

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-black/5 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-lg font-bold tracking-tight">Bazaaric</p>
            <p className="mt-1 text-xs text-gray-500">
              Buy and sell across the Baltics.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            <Link href="/terms" className="hover:text-black">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-black">
              Privacy Policy
            </Link>
            <a href="mailto:hello@bazaaric.com" className="hover:text-black">
              hello@bazaaric.com
            </a>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Bazaaric LTD. All rights reserved.
        </p>
      </div>
    </footer>
  );
}