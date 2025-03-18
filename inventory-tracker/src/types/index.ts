// src/types/index.ts

export type GoldUnit = "oz" | "g" | "kg";
export type Currency = "USD" | "EUR" | "GBP";

// Add to your src/types/index.ts file

export interface Purchase {
  id: string;
  date: Date;
  amount: number; // Amount of gold
  unit: GoldUnit; // Unit of measurement
  pricePerUnit: number; // Original price paid per unit
  effectivePricePerUnit?: number; // Price after discounts applied
  currency: Currency;
  orderNumber: string; // Costco order #
  notes?: string;
  totalPrice: number; // amount * pricePerUnit
  effectiveTotalPrice?: number; // Total price after all discounts
  discountsApplied?: boolean; // Flag to indicate if any discounts were applied
  paymentMethods?: {
    // Multiple payment methods can be selected
    [key: string]: boolean;
  };
}

export interface Sale {
  id: string; // Unique identifier for the sale
  date: Date; // When the sale occurred
  purchaseId: string; // Reference to the original purchase
  amount: number; // Amount of gold sold
  unit: GoldUnit; // oz, g, kg
  pricePerUnit: number; // Sale price per unit
  currency: Currency; // USD, EUR, GBP
  buyer: string; // Who bought the gold
  notes?: string; // Any additional notes
  totalPrice: number; // amount * pricePerUnit

  // Financial calculations
  originalPurchasePrice?: number; // What you paid for this amount
  effectivePurchasePrice?: number; // Original price minus discounts
  profit: number; // Sale price minus effective purchase price
  profitPercentage?: number; // (profit / effectivePurchasePrice) * 100

  // Additional data
  paymentMethod?: string; // How the buyer paid you
  fees?: number; // Any fees associated with the sale
  taxable?: boolean; // Whether this sale is taxable
  reportable?: boolean; // Whether this sale is reportable to tax authorities

  // Logistics
  shippingCost?: number; // Cost to ship if applicable
  shippingMethod?: string; // How it was shipped
  trackingNumber?: string; // Tracking info if shipped
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
