"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CATEGORIES } from "@/lib/categories";

type CategoryBarProps = {
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
};

export default function CategoryBar({ selected, onSelect }: CategoryBarProps) {
  const t = useTranslations("categories");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 md:gap-6 w-full">
      {CATEGORIES.map((category) => {
        const isActive = selected === category.id;
        const imageFailed = failedImages.has(category.id);

        return (
          <button
            key={category.id}
            onClick={() => onSelect(isActive ? null : category.id)}
            className="flex w-full flex-col items-center gap-2 active:scale-95 transition"
          >
            <div
              className={`
                relative w-full aspect-square overflow-hidden rounded-2xl
                ring-2 transition bg-gray-100
                ${isActive ? "ring-teal" : "ring-transparent"}
              `}
            >
              {!imageFailed && (
                <img
                  src={category.image}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() =>
                    setFailedImages((prev) => new Set(prev).add(category.id))
                  }
                />
              )}

              {imageFailed && (
                <span className="absolute inset-0 flex items-center justify-center text-2xl md:text-4xl">
                  {category.emoji}
                </span>
              )}
            </div>
            <span
              className={`text-xs md:text-sm font-medium text-center ${
                isActive ? "text-teal" : "text-gray-700"
              }`}
            >
              {t(category.id)}
            </span>
          </button>
        );
      })}
    </div>
  );
}