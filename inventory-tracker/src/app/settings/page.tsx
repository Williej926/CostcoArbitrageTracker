// src/app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getProducts, getLastFetched, fetchAndSaveProducts } from '@/utils/productStorage';
import { PureProduct } from '@/types';

export default function SettingsPage() {
  const [products, setProducts] = useState<PureProduct[]>([]);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load initial data
  useEffect(() => {
    setProducts(getProducts());
    setLastFetched(getLastFetched());
  }, []);
  
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    const { products: newProducts, error: newError } = await fetchAndSaveProducts();
    
    setProducts(newProducts);
    setLastFetched(getLastFetched());
    setError(newError);
    setLoading(false);
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Product Data</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-700">
            <strong>Products Count:</strong> {products.length}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Last Updated:</strong> {lastFetched ? new Date(lastFetched).toLocaleString() : 'Never'}
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {loading ? 'Refreshing...' : 'Refresh Product Data'}
        </button>
        
        {error && (
          <p className="mt-2 text-sm text-red-600">Error: {error}</p>
        )}
      </div>
    </div>
  );
}