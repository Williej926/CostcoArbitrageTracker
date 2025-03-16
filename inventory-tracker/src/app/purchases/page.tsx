// src/app/purchases/page.tsx
'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Purchase, GoldUnit, Currency } from '@/types';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    unit: 'oz' as GoldUnit,
    pricePerUnit: '',
    currency: 'USD' as Currency,
    source: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    const pricePerUnit = parseFloat(formData.pricePerUnit);
    
    if (isNaN(amount) || isNaN(pricePerUnit)) {
      alert('Please enter valid numbers for amount and price');
      return;
    }
    
    const totalPrice = amount * pricePerUnit;
    
    const newPurchase: Purchase = {
      id: uuidv4(),
      date: new Date(formData.date),
      amount,
      unit: formData.unit,
      pricePerUnit,
      currency: formData.currency,
      source: formData.source,
      notes: formData.notes,
      totalPrice
    };
    
    setPurchases([newPurchase, ...purchases]);
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      unit: 'oz' as GoldUnit,
      pricePerUnit: '',
      currency: 'USD' as Currency,
      source: '',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gold Purchases</h1>
      
      {/* Purchase Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add New Purchase</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Source</label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="Dealer, Website, etc."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.001"
                min="0"
                placeholder="1.0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="oz">Troy Ounce (oz)</option>
                <option value="g">Gram (g)</option>
                <option value="kg">Kilogram (kg)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Price Per Unit</label>
              <input
                type="number"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="2000.00"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Purchase
            </button>
          </div>
        </form>
      </div>
      
      {/* Purchase List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Purchase History</h2>
        
        {purchases.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
            No purchases yet. Use the form above to add your first purchase.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Per Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.date.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.amount} {purchase.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.currency === 'USD' ? '$' : purchase.currency === 'EUR' ? '€' : '£'}
                      {purchase.pricePerUnit.toFixed(2)}/{purchase.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.currency === 'USD' ? '$' : purchase.currency === 'EUR' ? '€' : '£'}
                      {purchase.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}