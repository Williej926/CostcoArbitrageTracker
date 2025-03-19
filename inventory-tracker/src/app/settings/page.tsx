// src/app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  getProducts,
  getLastFetched,
  fetchAndSaveProducts,
} from "@/utils/productStorage";
import { PureProduct } from "@/types";

// Define fee settings interface
interface FeeSettings {
  kasheeshFee: number;
  pureFee: number;
}

// Fee preset options
const KASHEESH_FEE_OPTIONS = [
  { label: "1.00% (Default)", value: 0.01 },
  { label: "0.75%", value: 0.0075 },
  { label: "0.50%", value: 0.005 },
];

const PURE_FEE_OPTIONS = [
  { label: "0.75% (Default)", value: 0.0075 },
  { label: "0.70%", value: 0.007 },
  { label: "0.63%", value: 0.0063 },
  { label: "0.50%", value: 0.005 },
];

// Local storage keys
const FEE_SETTINGS_KEY = "goldArbitrage_feeSettings";

export default function SettingsPage() {
  const [products, setProducts] = useState<PureProduct[]>([]);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fee settings state
  const [feeSettings, setFeeSettings] = useState<FeeSettings>({
    kasheeshFee: 0.01, // Default 1%
    pureFee: 0.00075, // Default 0.075%
  });

  // Load initial data
  useEffect(() => {
    setProducts(getProducts());
    setLastFetched(getLastFetched());

    // Load fee settings from localStorage
    const storedFeeSettings = localStorage.getItem(FEE_SETTINGS_KEY);
    if (storedFeeSettings) {
      try {
        setFeeSettings(JSON.parse(storedFeeSettings));
      } catch (err) {
        console.error("Error parsing fee settings:", err);
      }
    }
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    const { products: newProducts, error: newError } =
      await fetchAndSaveProducts();

    setProducts(newProducts);
    setLastFetched(getLastFetched());
    setError(newError);
    setLoading(false);
  };

  // Handle fee setting changes
  const handleFeeChange = (fee: "kasheeshFee" | "pureFee", value: number) => {
    const newSettings = { ...feeSettings, [fee]: value };
    setFeeSettings(newSettings);
    localStorage.setItem(FEE_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Product Data Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Product Data
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-700">
            <strong>Products Count:</strong> {products.length}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Last Updated:</strong>{" "}
            {lastFetched ? new Date(lastFetched).toLocaleString() : "Never"}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {loading ? "Refreshing..." : "Refresh Product Data"}
        </button>

        {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>}
      </div>

      {/* Fee Settings Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Fee Settings
        </h2>

        {/* Kasheesh Fee */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kasheesh Fee Rate
          </label>
          <div className="space-y-2">
            {KASHEESH_FEE_OPTIONS.map((option) => (
              <div className="flex items-center" key={option.value.toString()}>
                <input
                  id={`kasheesh-${option.value}`}
                  name="kasheeshFee"
                  type="radio"
                  checked={feeSettings.kasheeshFee === option.value}
                  onChange={() => handleFeeChange("kasheeshFee", option.value)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label
                  htmlFor={`kasheesh-${option.value}`}
                  className="ml-3 text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            This fee is applied when using Kasheesh as a payment method.
          </p>
        </div>

        {/* Pure Marketplace Fee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pure Marketplace Fee Rate
          </label>
          <div className="space-y-2">
            {PURE_FEE_OPTIONS.map((option) => (
              <div className="flex items-center" key={option.value.toString()}>
                <input
                  id={`pure-${option.value}`}
                  name="pureFee"
                  type="radio"
                  checked={feeSettings.pureFee === option.value}
                  onChange={() => handleFeeChange("pureFee", option.value)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label
                  htmlFor={`pure-${option.value}`}
                  className="ml-3 text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            This fee is applied to transactions on the Pure marketplace.
          </p>
        </div>
      </div>
    </div>
  );
}
