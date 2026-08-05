import Navbar from "@/components/layout/Navbar";
import SearchBar from "@/components/home/SearchBar";
import CategoryBar from "@/components/home/CategoryBar";
import ItemCard from "@/components/listing/ItemCard";

const items = [
  {
    title: "Vintage jacket",
    price: "€25",
    location: "Vilnius",
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500",
  },
  {
    title: "Nike sneakers",
    price: "€40",
    location: "Riga",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
  },
  {
    title: "Desk lamp",
    price: "€10",
    location: "Tallinn",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500",
  },
  {
    title: "Leather bag",
    price: "€35",
    location: "Vilnius",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500",
  },
  {
    title: "Sunglasses",
    price: "€18",
    location: "Riga",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500",
  },
  {
    title: "Winter coat",
    price: "€55",
    location: "Tallinn",
    image:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500",
  },
  {
    title: "Running shoes",
    price: "€30",
    location: "Vilnius",
    image:
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500",
  },
  {
    title: "Headphones",
    price: "€45",
    location: "Tallinn",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf9f6] pb-24">

      <div className="max-w-md mx-auto px-4">

        {/* Header */}
        <header className="pt-6">

          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Bazaaric
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Buy and sell nearby
              </p>
            </div>


            <button
              className="
                h-10
                w-10
                rounded-full
                bg-white
                shadow-sm
                ring-1
                ring-black/5
              "
            >
              ♡
            </button>

          </div>


          {/* Search */}
          <div className="mt-6">
            <SearchBar />
          </div>

        </header>


        {/* Categories */}
        <section className="mt-5">
          <CategoryBar />
        </section>


        {/* Featured */}
        <section className="mt-8">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-lg font-bold">
              Fresh finds
            </h2>

            <button className="text-sm text-gray-500">
              See all
            </button>

          </div>


          <div
            className="
              grid
              grid-cols-2
              gap-x-3
              gap-y-6
            "
          >

            {items.map((item) => (
              <ItemCard
                key={item.title}
                {...item}
              />
            ))}

          </div>

        </section>


      </div>


      <Navbar />

    </main>
  );
}