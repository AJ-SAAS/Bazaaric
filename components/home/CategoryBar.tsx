const categories = [
  { name: "Fashion", image: "/categories/fashion.jpg", emoji: "👕" },
  { name: "Electronics", image: "/categories/electronics.jpg", emoji: "📱" },
  { name: "Home", image: "/categories/home.jpg", emoji: "🏠" },
  { name: "Sports", image: "/categories/sports.jpg", emoji: "⚽" },
  { name: "Kids", image: "/categories/kids.jpg", emoji: "🧸" },
  { name: "Local Shops", image: "/categories/local-shops.jpg", emoji: "🏪" },
  { name: "Other", image: "/categories/other.jpg", emoji: "✨" },
];

type CategoryBarProps = {
  selected: string | null;
  onSelect: (category: string | null) => void;
};

export default function CategoryBar({ selected, onSelect }: CategoryBarProps) {
  return (
    <div className="flex gap-4 overflow-x-auto py-2 scrollbar-hide">
      {categories.map((category) => {
        const isActive = selected === category.name;

        return (
          <button
            key={category.name}
            onClick={() => onSelect(isActive ? null : category.name)}
            className="flex min-w-[84px] md:min-w-[104px] flex-col items-center gap-2 active:scale-95 transition"
          >
            <div
              className={`
                relative h-16 w-16 md:h-20 md:w-20 overflow-hidden rounded-2xl
                ring-2 transition
                ${isActive ? "ring-teal" : "ring-transparent"}
              `}
            >
              {/* Swap this img for a real category photo when available.
                  Falls back to an emoji tile so this works before assets exist. */}
              <img
                src={category.image}
                alt=""
                className="h-full w-full object-cover bg-gray-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-2xl bg-gray-100/0 pointer-events-none">
                {category.emoji}
              </span>
            </div>
            <span
              className={`text-xs md:text-sm font-medium text-center ${
                isActive ? "text-teal" : "text-gray-700"
              }`}
            >
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}