"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createListing, updateListing, getListing, uploadPhotos } from "@/lib/listings";

const categories = ["Fashion", "Electronics", "Home", "Sports", "Kids", "Other"];

type NewPhoto = { file: File; url: string };

export default function SellPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingListing, setLoadingListing] = useState(isEditMode);

  useEffect(() => {
    if (!editId) return;

    getListing(editId).then((listing) => {
      if (!listing) {
        setError("Listing not found.");
        setLoadingListing(false);
        return;
      }

      setTitle(listing.title);
      setDescription(listing.description);
      setCategory(listing.category);
      setLocation(listing.location);
      setPrice(String(listing.price));
      setExistingImages(listing.imageUrls);
      setLoadingListing(false);
    });
  }, [editId]);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const added = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setNewPhotos((prev) => [...prev, ...added].slice(0, 8 - existingImages.length));
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewPhoto(index: number) {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(status: "active" | "draft") {
    setError("");

    if (!user) {
      setError("You need to be logged in to sell an item.");
      return;
    }

    const totalPhotos = existingImages.length + newPhotos.length;

    if (!title || !price || !category || totalPhotos === 0) {
      setError("Please add at least one photo, a title, category, and price.");
      return;
    }

    setSubmitting(true);

    try {
      const uploadedUrls = newPhotos.length
        ? await uploadPhotos(user.uid, newPhotos.map((p) => p.file))
        : [];

      const finalImageUrls = [...existingImages, ...uploadedUrls];

      if (isEditMode && editId) {
        await updateListing(editId, {
          title,
          description,
          category,
          price: parseFloat(price),
          location: location || "Unknown",
          imageUrls: finalImageUrls,
          status,
        });
        router.push(`/item/${editId}`);
      } else {
        const id = await createListing({
          title,
          description,
          category,
          price: parseFloat(price),
          location: location || "Unknown",
          photos: newPhotos.map((p) => p.file),
          sellerId: user.uid,
          sellerEmail: user.email || "",
          status,
        });
        router.push(`/item/${id}`);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loadingListing) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold">You need an account to sell</p>
        <button
          onClick={() => router.push("/auth")}
          className="rounded-full bg-[#2F855A] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Log in or sign up
        </button>
      </main>
    );
  }

  const totalPhotos = existingImages.length + newPhotos.length;

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <div className="mx-auto max-w-md md:max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {isEditMode ? "Edit item" : "Sell an item"}
        </h1>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Photos</h2>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {existingImages.map((url, i) => (
                <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={url} alt={`Existing ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeExistingImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {newPhotos.map((photo, i) => (
                <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={photo.url} alt={`New ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeNewPhoto(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {totalPhotos < 8 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-[#2F855A] hover:text-[#2F855A]">
                  <Plus size={22} />
                  <span className="text-xs font-medium">Add photo</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">About your item</h2>
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 divide-y divide-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700 shrink-0">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tell buyers what you're selling"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-2 px-4 py-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700 shrink-0">Description</label>
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

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Item details</h2>
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 divide-y divide-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700 shrink-0">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-gray-900"
              >
                <option value="" disabled>Select a category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700 shrink-0">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Vilnius"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Pricing</h2>
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-4">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700 shrink-0">Price</label>
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

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-10 flex justify-end gap-3">
          <button
            onClick={() => handleSubmit("draft")}
            disabled={submitting}
            className="rounded-full border border-[#2F855A] px-6 py-2.5 text-sm font-semibold text-[#2F855A] transition hover:bg-[#2F855A]/5 disabled:opacity-60"
          >
            Save draft
          </button>

          <button
            onClick={() => handleSubmit("active")}
            disabled={submitting}
            className="rounded-full bg-[#2F855A] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#276749] disabled:opacity-60"
          >
            {submitting ? "Saving..." : isEditMode ? "Save changes" : "Upload"}
          </button>
        </div>
      </div>
    </main>
  );
}