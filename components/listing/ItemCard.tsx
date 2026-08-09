import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";

type ItemCardProps = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string;
  sold?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
};

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='%239ca3af' text-anchor='middle' dy='.3em'%3ENo image%3C/text%3E%3C/svg%3E";

export default function ItemCard({
  id,
  title,
  price,
  location,
  image,
  sold = false,
  isFavorited = false,
  onToggleFavorite,
}: ItemCardProps) {
  const [imgSrc, setImgSrc] = useState(image);

  return (
    <article className="group relative">
      <Link href={`/item/${id}`}>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
          <img
            src={imgSrc}
            alt={title}
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
              sold ? "opacity-50" : ""
            }`}
          />

          {sold && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/70 px-4 py-1.5 text-xs font-semibold text-white">
                SOLD
              </span>
            </div>
          )}
        </div>

        <div className="mt-2">
          <p className="text-base md:text-lg font-semibold leading-tight">{price}</p>
          <p className="mt-1 text-sm md:text-base text-gray-800 line-clamp-1">{title}</p>
          <p className="mt-1 text-xs md:text-sm text-gray-500">{location}</p>
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(id);
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm"
        >
          <Heart
            size={16}
            className={isFavorited ? "fill-red-500 text-red-500" : ""}
          />
        </button>
      )}
    </article>
  );
}