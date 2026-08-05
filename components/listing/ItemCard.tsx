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

      <div className="
        relative
        aspect-[4/5]
        overflow-hidden
        rounded-2xl
        bg-gray-100
      ">

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
            right-3
            top-3
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-white/90
            text-lg
            shadow-sm
          "
        >
          ♡
        </button>

      </div>


      <div className="mt-3 px-1">

        <div className="flex items-center justify-between">

          <p className="
            text-lg
            font-bold
            tracking-tight
          ">
            {price}
          </p>

        </div>


        <p className="
          mt-1
          text-sm
          font-medium
          text-gray-900
          line-clamp-1
        ">
          {title}
        </p>


        <p className="
          mt-1
          text-xs
          text-gray-500
        ">
          📍 {location}
        </p>

      </div>

    </article>
  );
}