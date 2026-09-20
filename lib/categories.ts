export type CategoryId =
  | "fashion"
  | "electronics"
  | "home"
  | "sports"
  | "kids"
  | "local_shops"
  | "other";

export type Category = {
  id: CategoryId;
  label: string; // English for now — swap for a translation lookup once i18n is added
  emoji: string;
  image: string;
};

export const CATEGORIES: Category[] = [
  { id: "fashion", label: "Fashion", emoji: "👕", image: "/categories/fashion.png" },
  { id: "electronics", label: "Electronics", emoji: "📱", image: "/categories/electronics.png" },
  { id: "home", label: "Home", emoji: "🏠", image: "/categories/home.png" },
  { id: "sports", label: "Sports", emoji: "⚽", image: "/categories/sports.png" },
  { id: "kids", label: "Kids", emoji: "🧸", image: "/categories/kids.png" },
  { id: "local_shops", label: "Local Shops", emoji: "🏪", image: "/categories/local-shops.png" },
  { id: "other", label: "Other", emoji: "✨", image: "/categories/other.png" },
];

export function getCategoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

// Maps the OLD display-string category values ("Fashion", "Electronics", ...)
// that existing listings were created with, to the new stable IDs. Used only
// by the one-time migration script — nothing in the live app should need this.
export const LEGACY_CATEGORY_MAP: Record<string, CategoryId> = {
  Fashion: "fashion",
  Electronics: "electronics",
  Home: "home",
  Sports: "sports",
  Kids: "kids",
  Other: "other",
  // "Local Shops" never existed as a sellable category before this change,
  // so no existing listing can have that old value.
};