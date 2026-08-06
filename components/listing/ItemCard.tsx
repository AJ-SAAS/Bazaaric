import Link from "next/link";
import { Heart } from "lucide-react";

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
  return (
    <article className="group relative">
      <Link href={`/item/${id}`}>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
          <img
            src={image}
            alt={title}
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