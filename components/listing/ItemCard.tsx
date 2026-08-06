type ItemCardProps = {
  title: string;
  price: string;
  location: string;
  image: string;
};

export default function ItemCard({
  title,
  price,
  location,
  image,
}: ItemCardProps) {
  return (
    <article className="group cursor-pointer">
      <div
        className="
          relative
          aspect-square
          overflow-hidden
          rounded-xl
          bg-gray-100
        "
      >
        <img
          src={image}
          alt={title}
          className="
            h-full
            w-full
            object-cover
            transition
            duration-300
            group-hover:scale-105
          "
        />

        <button
          className="
            absolute
            right-2
            top-2
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            bg-white/95
            text-gray-700
            shadow-sm
          "
        >
          ♡
        </button>
      </div>

      <div className="mt-2">
        <p className="text-base md:text-lg font-semibold leading-tight">
          {price}
        </p>

        <p className="mt-1 text-sm md:text-base text-gray-800 line-clamp-1">
          {title}
        </p>

        <p className="mt-1 text-xs md:text-sm text-gray-500">
          {location}
        </p>
      </div>
    </article>
  );
}