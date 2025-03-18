// src/components/ProductSelector.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { getProducts } from '@/utils/productStorage';
import { PureProduct } from '@/types';

interface ProductSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function ProductSelector({
  value,
  onChange,
  className = "",
  disabled = false,
  placeholder = "Search for a product..."
}: ProductSelectorProps) {
  const [products, setProducts] = useState<PureProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PureProduct | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Load products from localStorage
  useEffect(() => {
    const storedProducts = getProducts();
    setProducts(storedProducts);
    
    // Find the selected product if there's a value
    if (value) {
      const product = storedProducts.find(p => p.id === value) || null;
      setSelectedProduct(product);
      if (product) {
        setSearchTerm(product.name);
      }
    }
  }, [value]);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filter products based on search term
  const filteredProducts = searchTerm.trim() === '' 
    ? products 
    : products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
  // Handle selection of a product
  const handleSelectProduct = (product: PureProduct) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setIsOpen(false);
    onChange(product.id);
  };
  
  // Clear selection
  const handleClear = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    onChange('');
  };
  
  // Show message if no products are loaded yet
  if (products.length === 0) {
    return (
      <div>
        <input
          type="text"
          className={className}
          disabled
          placeholder="No products available"
        />
        <p className="mt-1 text-xs text-gray-500">
          Please refresh product data in Settings
        </p>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (e.target.value === '' && selectedProduct) {
              setSelectedProduct(null);
              onChange('');
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
        />
        {selectedProduct && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
            onClick={handleClear}
          >
            <span className="sr-only">Clear</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {isOpen && filteredProducts.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                selectedProduct?.id === product.id ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
              } hover:bg-gray-100`}
              onClick={() => handleSelectProduct(product)}
            >
              <span className="block truncate">{product.name}</span>
              {selectedProduct?.id === product.id && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Hidden input for form submission */}
      <input type="hidden" name="productId" value={selectedProduct?.id || ''} />
    </div>
  );
}