// src/utils/productStorage.ts
import { PureProduct } from "@/types";

const STORAGE_KEY = "goldArbitrage_products";
const TIMESTAMP_KEY = "goldArbitrage_productsTimestamp";

export const getProducts = (): PureProduct[] => {
  if (typeof window === "undefined") return [];

  const storedProducts = localStorage.getItem(STORAGE_KEY);
  if (!storedProducts) return [];

  try {
    return JSON.parse(storedProducts);
  } catch (err) {
    console.error("Error parsing stored products:", err);
    return [];
  }
};

export const getLastFetched = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TIMESTAMP_KEY);
};

export const saveProducts = (products: PureProduct[]): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
};

// Define an interface for the API response items
interface PureApiProduct {
  id: string;
  title: string;
  [key: string]: unknown; // For other properties we don't use
}

export const fetchAndSaveProducts = async (): Promise<{
  products: PureProduct[];
  error: string | null;
}> => {
  try {
    const response = await fetch("/api/pure-products");

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = (await response.json()) as PureApiProduct[];

    // Transform the API data into your simplified PureProduct structure
    const pureProducts: PureProduct[] = data.map((item) => ({
      id: item.id,
      name: item.title,
    }));

    // Save to localStorage
    saveProducts(pureProducts);

    return { products: pureProducts, error: null };
  } catch (err) {
    console.error("Error fetching products:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Error fetching products";
    return { products: [], error: errorMessage };
  }
};
