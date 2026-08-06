import Navbar from "@/components/layout/Navbar";
import SearchBar from "@/components/home/SearchBar";
import CategoryBar from "@/components/home/CategoryBar";
import ItemCard from "@/components/listing/ItemCard";

const items = [
  {
    title: "Vintage jacket",
    price: "€25",
    location: "Vilnius",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500",
  },
  {
    title: "Nike sneakers",
    price: "€40",
    location: "Riga",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
  },
  {
    title: "Desk lamp",
    price: "€10",
    location: "Tallinn",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500",
  },
  {
    title: "Leather bag",
    price: "€35",
    location: "Vilnius",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-7xl px-4 md:px-8">
        {/* Top */}
        <header className="pt-6 md:pt-10">
          <div className="flex justify-between items-start md:hidden">
            <div>
              <p className="text-sm text-gray-500">Good afternoon 👋</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Bazaaric
              </h1>
            </div>

            <button
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-white
                shadow-sm
              "
            >
              ♡
            </button>
          </div>

          <h2 className="mt-8 md:mt-0 text-xl md:text-3xl font-semibold">
            Find something you love
          </h2>

          <div className="mt-4 md:mt-6 md:max-w-2xl">
            <SearchBar />
          </div>
        </header>

        {/* Categories */}
        <section className="mt-6 md:mt-8">
          <CategoryBar />
        </section>

        {/* Fresh */}
        <section className="mt-8 md:mt-12">
          <div className="mb-4 md:mb-6 flex justify-between items-center">
            <h2 className="text-lg md:text-2xl font-bold">Fresh finds</h2>
            <button className="text-sm md:text-base text-gray-500 hover:text-black">
              View all
            </button>
          </div>

          <div
            className="
              grid
              grid-cols-2
              sm:grid-cols-3
              md:grid-cols-4
              lg:grid-cols-5
              gap-4
              md:gap-6
            "
          >
            {items.map((item) => (
              <ItemCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        {/* Location */}
        <section className="mt-10 md:mt-14">
          <h2 className="mb-4 md:mb-6 text-lg md:text-2xl font-bold">
            Near Tallinn
          </h2>

          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-3">
            {items.slice(0, 3).map((item) => (
              <div key={item.title} className="min-w-[150px] md:min-w-[220px]">
                <ItemCard {...item} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}