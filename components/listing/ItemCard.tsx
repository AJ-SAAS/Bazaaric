type ItemCardProps = {
  title: string;
  price: string;
  location: string;
  image: string;
};

export default function ItemCard({ title, price, location, image }: ItemCardProps) {
  return (
    <div className="cursor-pointer">
      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="mt-1.5">
        <p className="font-semibold text-sm leading-tight">{price}</p>
        <p className="text-xs text-gray-800 line-clamp-1 mt-0.5">{title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">📍 {location}</p>
      </div>
    </div>
  );
}