export default function SearchBar() {
  return (
    <div className="w-full mb-3">
      <input
        type="text"
        placeholder="Search items..."
        className="w-full rounded-full bg-gray-100 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
      />
    </div>
  );
}