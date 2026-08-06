"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const categories = [
  "Fashion",
  "Electronics",
  "Home",
  "Sports",
  "Kids",
  "Other",
];

export default function SellPage() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 8));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <div className="mx-auto max-w-md md:max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Sell an item
        </h1>

        {/* Photos */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Photos
          </h2>

          <div
            className="
              rounded-2xl
              bg-white
              p-4
              shadow-sm
              ring-1
              ring-black/5
            "
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {photos.map((photo, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                >
                  <img
                    src={photo}
                    alt={`Upload ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    className="
                      absolute
                      right-1
                      top-1
                      flex
                      h-6
                      w-6
                      items-center
                      justify-center
                      rounded-full
                      bg-black/60
                      text-white
                    "
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {photos.length < 8 && (
                <label
                  className="
                    flex
                    aspect-square
                    cursor-pointer
                    flex-col
                    items-center
                    justify-center
                    gap-1
                    rounded-xl
                    border-2
                    border-dashed
                    border-gray-300
                    text-gray-500
                    transition
                    hover:border-[#2F855A]
                    hover:text-[#2F855A]
                  "
                >
                  <Plus size={22} />
                  <span className="text-xs font-medium">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </section>

        {/* About your item */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            About your item
          </h2>

          <div
            className="
              rounded-2xl
              bg-white
              shadow-sm
              ring-1
              ring-black/5
              divide-y
              divide-gray-100
            "
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700 shrink-0">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tell buyers what you're selling"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-2 px-4 py-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700 shrink-0">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell buyers more about it"
                rows={4}
                className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </section>

        {/* Item details */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Item details
          </h2>

          <div
            className="
              rounded-2xl
              bg-white
              shadow-sm
              ring-1
              ring-black/5
            "
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700 shrink-0">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-gray-900"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Pricing
          </h2>

          <div
            className="
              rounded-2xl
              bg-white
              shadow-sm
              ring-1
              ring-black/5
            "
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700 shrink-0">
                Price
              </label>
              <div className="flex items-center gap-1 w-full">
                <span className="text-sm text-gray-500">€</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-10 flex justify-end gap-3">
          <button
            className="
              rounded-full
              border
              border-[#2F855A]
              px-6
              py-2.5
              text-sm
              font-semibold
              text-[#2F855A]
              transition
              hover:bg-[#2F855A]/5
            "
          >
            Save draft
          </button>

          <button
            className="
              rounded-full
              bg-[#2F855A]
              px-6
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-[#276749]
            "
          >
            Upload
          </button>
        </div>
      </div>
    </main>
  );
}