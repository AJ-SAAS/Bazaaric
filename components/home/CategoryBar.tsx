const categories = [
  {
    name: "Fashion",
    icon: "👕",
  },
  {
    name: "Electronics",
    icon: "📱",
  },
  {
    name: "Home",
    icon: "🏠",
  },
  {
    name: "Sports",
    icon: "⚽",
  },
  {
    name: "Kids",
    icon: "🧸",
  },
  {
    name: "Other",
    icon: "✨",
  },
];

export default function CategoryBar() {
  return (
    <div className="
      flex
      gap-3
      overflow-x-auto
      py-2
      scrollbar-hide
    ">

      {categories.map((category) => (
        <button
          key={category.name}
          className="
            flex
            min-w-fit
            items-center
            gap-2
            rounded-2xl
            bg-white
            px-4
            py-3
            text-sm
            shadow-sm
            ring-1
            ring-black/5
            transition
            active:scale-95
          "
        >

          <span className="text-lg">
            {category.icon}
          </span>

          <span className="font-medium">
            {category.name}
          </span>

        </button>
      ))}

    </div>
  );
}