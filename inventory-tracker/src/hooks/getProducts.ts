// src/hooks/getProducts.ts
import { useState, useEffect } from 'react';
import { PureProduct } from '@/types';

export function getProducts() {
  const [products, setProducts] = useState<PureProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/pure-products');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        
        // Transform the API data into your simplified PureProduct structure
        const pureProducts: PureProduct[] = data.map((item: any) => ({
          id: item.id,
          name: item.title
        }));
        
        // Add custom option
        pureProducts.push({
          id: 'custom',
          name: 'Custom Amount'
        });
        
        setProducts(pureProducts);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Error fetching products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}