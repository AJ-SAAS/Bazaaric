type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <div
        className="
          flex
          items-center
          gap-3
          rounded-2xl
          bg-white
          px-4
          py-3.5
          shadow-sm
          ring-1
          ring-black/5
        "
      >
        <span className="text-gray-400 text-lg">🔍</span>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search clothes, electronics, furniture..."
          className="
            w-full
            bg-transparent
            text-sm
            text-gray-900
            placeholder:text-gray-400
            outline-none
          "
        />
      </div>
    </div>
  );
}