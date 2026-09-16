"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "lv", label: "LV" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const currentLocale = useLocale();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function selectLanguage(code: string) {
    document.cookie = `locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  const currentLabel = LANGUAGES.find((l) => l.code === currentLocale)?.label || "EN";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
      >
        <Globe size={14} />
        {currentLabel}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-28 rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5 z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                lang.code === currentLocale ? "font-semibold text-teal" : "text-gray-700"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}