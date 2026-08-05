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
  { title: "Headphones", price: "€45", location: "Tallinn", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500" },
];

const categories = [
  "Fashion",
  "Electronics",
  "Home",
  "Vehicles",
  "Sports",
  "Collectibles",
];

function ProductGrid({ title, data }: { title: string; data: typeof items }) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button className="text-sm text-gray-500">
          See all
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data.map((item) => (
          <ItemCard
            key={item.title}
            {...item}
          />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 pb-24">

      <div className="max-w-7xl mx-auto px-4">

        {/* Hero */}
        <section className="pt-8">

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Find something
            <br />
            <span className="text-gray-500">
              worth keeping.
            </span>
          </h1>

          <p className="mt-3 text-gray-500">
            Buy and sell unique items across the Baltics.
          </p>

          <div className="mt-6">
            <SearchBar />
          </div>

        </section>


        {/* Categories */}
        <section className="mt-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                className="
                  whitespace-nowrap
                  rounded-full
                  bg-white
                  border
                  px-4
                  py-2
                  text-sm
                  hover:bg-gray-100
                "
              >
                {category}
              </button>
            ))}
          </div>
        </section>


        {/* Existing category component */}
        <div className="mt-4">
          <CategoryBar />
        </div>


        {/* Trending */}
        <ProductGrid
          title="🔥 Trending now"
          data={items.slice(0, 4)}
        />


        {/* Fresh */}
        <ProductGrid
          title="✨ Fresh arrivals"
          data={items.slice(4)}
        />

      </div>


      <Navbar />

    </main>
  );
}