import Navbar from "@/components/layout/Navbar";
import SearchBar from "@/components/home/SearchBar";
import CategoryBar from "@/components/home/CategoryBar";
import ItemCard from "@/components/listing/ItemCard";

const items = [
  { title: "Vintage jacket", price: "€25", location: "Vilnius", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500" },
  { title: "Nike sneakers", price: "€40", location: "Riga", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500" },
  { title: "Desk lamp", price: "€10", location: "Tallinn", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500" },
  { title: "Leather bag", price: "€35", location: "Vilnius", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500" },
  { title: "Sunglasses", price: "€18", location: "Riga", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500" },
  { title: "Winter coat", price: "€55", location: "Tallinn", image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500" },
  { title: "Running shoes", price: "€30", location: "Vilnius", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500" },
  { title: "Denim jacket", price: "€28", location: "Riga", image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500" },
  { title: "Headphones", price: "€45", location: "Tallinn", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500" },
  { title: "White sneakers", price: "€22", location: "Vilnius", image: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500" },
  { title: "Backpack", price: "€20", location: "Riga", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500" },
  { title: "Watch", price: "€60", location: "Tallinn", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500" },
  { title: "Hoodie", price: "€25", location: "Vilnius", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500" },
  { title: "Boots", price: "€40", location: "Riga", image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500" },
  { title: "T-shirt", price: "€12", location: "Tallinn", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500" },
];

export default function Home() {
  return (
    <main className="min-h-screen pb-24 bg-white">
      {/* Full width container */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        
        {/* Header */}
        <header className="pt-4 pb-3">
          <h1 className="text-2xl font-bold">Bazaaric</h1>
          <p className="text-sm text-gray-500">Buy & sell across the Baltics</p>
        </header>

        <SearchBar />
        <CategoryBar />

        {/* Dense grid */}
        <section className="mt-5">
          <h2 className="text-lg font-semibold mb-3">Near you</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5">
            {items.map((item) => (
              <ItemCard key={item.title + item.price} {...item} />
            ))}
          </div>
        </section>
      </div>

      <Navbar />
    </main>
  );
}