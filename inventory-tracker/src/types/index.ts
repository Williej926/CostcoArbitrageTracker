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

export interface PurchaseAllocationRecord {
    purchaseId: string;
    purchaseDate: Date;
    amount: number;
    costBasisPerUnit: number;
    costBasis: number;
  }
  
  export interface Sale {
    id: string;                        // Unique identifier for the sale
    date: Date;                        // When the sale occurred
    amount: number;                    // Total amount of gold sold
    unit: GoldUnit;                    // oz, g, kg
    pricePerUnit: number;              // Sale price per unit
    currency: Currency;                // USD, EUR, GBP
    orderNumber: string;               // Pure order #
    notes?: string;                    // Any additional notes
    totalPrice: number;                // amount * pricePerUnit
    
    // Financial calculations
    originalPurchasePrice: number;     // What you paid for this amount at list price
    effectivePurchasePrice: number;    // Original price minus discounts (your cost basis)
    fees: number;                      // Total fees associated with the sale
    profit: number;                    // Sale price minus effective purchase price minus fees
    profitPercentage: number;          // (profit / effectivePurchasePrice) * 100
    
    // Multi-purchase support
    purchaseAllocations?: PurchaseAllocationRecord[]; // Records of which purchases this sale came from
    
    // For backward compatibility with single-purchase model
    purchaseId?: string;               // Reference to original purchase (legacy field)
    purchaseDate?: Date;               // Date of the original purchase (legacy field)
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

export interface PureProduct {
    id: string;
    name: string;
    weight: string;
  }