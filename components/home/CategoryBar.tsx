const categories = [
  { name: "Fashion", icon: "👕" },
  { name: "Electronics", icon: "📱" },
  { name: "Home", icon: "🏠" },
  { name: "Sports", icon: "⚽" },
  { name: "Kids", icon: "🧸" },
  { name: "Other", icon: "✨" },
];

type CategoryBarProps = {
  selected: string | null;
  onSelect: (category: string | null) => void;
};

export default function CategoryBar({ selected, onSelect }: CategoryBarProps) {
  return (
    <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
      {categories.map((category) => {
        const isActive = selected === category.name;

        return (
          <button
            key={category.name}
            onClick={() => onSelect(isActive ? null : category.name)}
            className={`
              flex
              min-w-fit
              items-center
              gap-2
              rounded-2xl
              px-4
              py-3
              text-sm
              shadow-sm
              ring-1
              transition
              active:scale-95
              ${
                isActive
                  ? "bg-[#2F855A] text-white ring-[#2F855A]"
                  : "bg-white ring-black/5"
              }
            `}
          >
            <span className="text-lg">{category.icon}</span>
            <span className="font-medium">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}