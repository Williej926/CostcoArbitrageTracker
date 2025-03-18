// src/utils/feeSettings.ts
export interface FeeSettings {
  kasheeshFee: number;
  pureFee: number;
}

const DEFAULT_SETTINGS: FeeSettings = {
  kasheeshFee: 0.01, // Default 1%
  pureFee: 0.00075, // Default 0.075%
};

const FEE_SETTINGS_KEY = "goldArbitrage_feeSettings";

export const getFeeSettings = (): FeeSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  const storedSettings = localStorage.getItem(FEE_SETTINGS_KEY);
  if (!storedSettings) return DEFAULT_SETTINGS;

  try {
    return JSON.parse(storedSettings);
  } catch (err) {
    console.error("Error parsing fee settings:", err);
    return DEFAULT_SETTINGS;
  }
};
