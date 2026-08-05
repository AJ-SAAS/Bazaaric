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
];


export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28">

      <div className="mx-auto max-w-md px-4">


        {/* Top */}
        <header className="pt-6">

          <div className="flex justify-between items-start">

            <div>
              <p className="text-sm text-gray-500">
                Good afternoon 👋
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Bazaaric
              </h1>
            </div>


            <button className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-white
              shadow-sm
            ">
              ♡
            </button>

          </div>


          <h2 className="
            mt-8
            text-xl
            font-semibold
          ">
            Find something you love
          </h2>


          <div className="mt-4">
            <SearchBar />
          </div>

        </header>



        {/* Categories */}
        <section className="mt-6">
          <CategoryBar />
        </section>



        {/* Fresh */}
        <section className="mt-8">

          <div className="mb-4 flex justify-between">

            <h2 className="text-lg font-bold">
              Fresh finds
            </h2>

            <button className="text-sm text-gray-500">
              View all
            </button>

          </div>


          <div className="
            grid
            grid-cols-2
            gap-4
          ">

            {items.map((item)=>(
              <ItemCard
                key={item.title}
                {...item}
              />
            ))}

          </div>

        </section>



        {/* Location */}
        <section className="mt-10">

          <h2 className="mb-4 text-lg font-bold">
            Near Tallinn
          </h2>


          <div className="
            flex
            gap-4
            overflow-x-auto
            pb-3
          ">

            {items.slice(0,3).map((item)=>(
              <div
                key={item.title}
                className="min-w-[150px]"
              >
                <ItemCard {...item}/>
              </div>
            ))}

          </div>

        </section>


      </div>


      <Navbar />

    </main>
  );
}