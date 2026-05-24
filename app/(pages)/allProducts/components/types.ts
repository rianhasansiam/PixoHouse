export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  badge?: string;
  category: string;
  brand?: string;
  inStock: boolean;
};

export type SortOption =
  | "popular"
  | "price-low"
  | "price-high"
  | "rating"
  | "newest";

export type ViewMode = "grid" | "list";

export type Filters = {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  minRating: number;
  inStockOnly: boolean;
};
