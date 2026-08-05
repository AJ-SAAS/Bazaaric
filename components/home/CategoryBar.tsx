const categories = [
  "Women",
  "Men",
  "Kids",
  "Home",
  "Electronics",
  "Sports",
  "Other",
];

export default function CategoryBar() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          className="whitespace-nowrap rounded-full border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-100 active:bg-gray-200"
        >
          {category}
        </button>
      ))}
    </div>
  );
}