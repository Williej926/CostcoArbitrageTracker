// src/types/index.ts

export type GoldUnit = 'oz' | 'g' | 'kg';
export type Currency = 'USD' | 'EUR' | 'GBP';

export interface Purchase {
  id: string;
  date: Date;
  amount: number;  // Amount of gold
  unit: GoldUnit;  // Unit of measurement
  pricePerUnit: number;  // Price paid per unit
  currency: Currency;
  source: string;  // Where the gold was purchased
  notes?: string;
  totalPrice: number;  // amount * pricePerUnit
}

export interface Sale {
  id: string;
  date: Date;
  purchaseId: string;  // Reference to the purchase
  amount: number;  // Amount of gold sold
  unit: GoldUnit;  // Unit of measurement
  pricePerUnit: number;  // Price sold per unit
  currency: Currency;
  buyer: string;  // Who bought the gold
  notes?: string;
  totalPrice: number;  // amount * pricePerUnit
  profit: number;  // Profit from this sale
}

export interface GoldPrice {
  date: Date;
  pricePerOz: number;
  currency: Currency;
}

export interface UserSettings {
  defaultUnit: GoldUnit;
  defaultCurrency: Currency;
  displayDecimalPlaces: number;
}