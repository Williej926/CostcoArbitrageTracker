// src/app/sales/page.tsx
"use client";
import { getFeeSettings } from "@/utils/feeSettings";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Sale, Purchase, GoldUnit, Currency } from "@/types";

const { pureFee } = getFeeSettings();

// Define a type for purchase allocations
interface PurchaseAllocation {
  purchaseId: string;
  purchase: Purchase | null;
  amount: number;
  costBasis: number;
}

// Create an interface for parsed purchases/sales from localStorage
interface ParsedPurchase extends Omit<Purchase, "date"> {
  date: string;
}

interface ParsedSale extends Omit<Sale, "date" | "purchaseAllocations"> {
  date: string;
  purchaseAllocations?: Array<{
    purchaseId: string;
    purchaseDate: string;
    amount: number;
    costBasisPerUnit: number;
    costBasis: number;
  }>;
}

// Define a type for allocation field changes
type AllocationField = "purchaseId" | "amount";

export default function SalesPage() {
  const [calculatedProfit, setCalculatedProfit] = useState<number | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [allocations, setAllocations] = useState<PurchaseAllocation[]>([]);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    unit: "oz" as GoldUnit,
    pricePerUnit: "",
    currency: "USD" as Currency,
    orderNumber: "",
    notes: "",
    userEnteredNotes: "",

    // Additional fees
    shippingCost: "",
    sellerFee: "",
    paymentProcessingFee: "",
    otherFee: false,
    otherFeeName: "",
    otherFeeAmount: "",
  });
  // Load purchases and sales when component mounts
  useEffect(() => {
    // Load purchases from localStorage
    const savedPurchases = localStorage.getItem("goldPurchases");
    if (savedPurchases) {
      const parsedPurchases = JSON.parse(savedPurchases) as ParsedPurchase[];
      const purchasesWithDates = parsedPurchases.map((purchase) => ({
        ...purchase,
        date: new Date(purchase.date),
      }));
      setPurchases(purchasesWithDates);
    }

    // Load sales from localStorage
    const savedSales = localStorage.getItem("goldSales");
    if (savedSales) {
      const parsedSales = JSON.parse(savedSales) as ParsedSale[];
      const salesWithDates = parsedSales.map((sale) => ({
        ...sale,
        date: new Date(sale.date),
        // Handle nested dates for purchase allocations if they exist
        purchaseAllocations: sale.purchaseAllocations
          ? sale.purchaseAllocations.map((alloc) => ({
              ...alloc,
              purchaseDate: alloc.purchaseDate
                ? new Date(alloc.purchaseDate)
                : undefined,
            }))
          : undefined,
      }));
      setSales(salesWithDates);
    }

    // Initialize with one empty allocation
    setAllocations([
      {
        purchaseId: "",
        purchase: null,
        amount: 0,
        costBasis: 0,
      },
    ]);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Handle different input types appropriately
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    // Special handling for notes field
    if (name === "notes") {
      setFormData({
        ...formData,
        notes: value,
        userEnteredNotes: value, // Update both fields
      });
    } else {
      setFormData({
        ...formData,
        [name]: newValue,
      });
    }
  };
  // Function to start editing a sale
  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setIsEditing(true);

    // Convert date to ISO string format for the date input
    const dateString =
      sale.date instanceof Date
        ? sale.date.toISOString().split("T")[0]
        : new Date(sale.date).toISOString().split("T")[0];

    // Set form data with the sale details
    setFormData({
      date: dateString,
      amount: sale.amount.toString(),
      unit: sale.unit || ("oz" as GoldUnit),
      pricePerUnit: sale.pricePerUnit.toString(),
      currency: sale.currency || ("USD" as Currency),
      orderNumber: sale.orderNumber || "",
      notes: sale.notes || "",
      userEnteredNotes: sale.notes || "",
      shippingCost: sale.fees ? (sale.fees / 4).toString() : "", // Estimate, since we don't have the breakdown
      sellerFee: "",
      paymentProcessingFee: "",
      otherFee: false,
      otherFeeName: "",
      otherFeeAmount: "",
    });

    // Set allocations based on sale's purchase allocations
    if (sale.purchaseAllocations && sale.purchaseAllocations.length > 0) {
      const newAllocations = sale.purchaseAllocations.map((alloc) => {
        const purchase =
          purchases.find((p) => p.id === alloc.purchaseId) || null;
        return {
          purchaseId: alloc.purchaseId,
          purchase,
          amount: alloc.amount,
          costBasis: alloc.costBasis,
        };
      });
      setAllocations(newAllocations);
    }

    // Scroll to the form
    document
      .querySelector(".bg-white.p-6.rounded-lg.shadow-md")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingSale(null);

    // Reset form to default values
    setFormData({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      unit: "oz" as GoldUnit,
      pricePerUnit: "",
      currency: "USD" as Currency,
      orderNumber: "",
      notes: "",
      userEnteredNotes: "",
      shippingCost: "",
      sellerFee: "",
      paymentProcessingFee: "",
      otherFee: false,
      otherFeeName: "",
      otherFeeAmount: "",
    });

    // Reset allocations
    setAllocations([
      {
        purchaseId: "",
        purchase: null,
        amount: 0,
        costBasis: 0,
      },
    ]);
  };

  // Function to delete a sale
  const handleDeleteSale = (saleId: string) => {
    if (window.confirm("Are you sure you want to delete this sale?")) {
      const updatedSales = sales.filter((s) => s.id !== saleId);
      setSales(updatedSales);
      localStorage.setItem("goldSales", JSON.stringify(updatedSales));

      // If we're currently editing this sale, cancel the edit
      if (editingSale && editingSale.id === saleId) {
        handleCancelEdit();
      }
    }
  };
  // Calculate available amount that can be sold from a specific purchase
  const getAvailableAmount = (purchaseId: string) => {
    if (!purchaseId) return 0;

    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) return 0;

    // Find all previous sales from this purchase
    const previousSales = sales.flatMap(
      (sale) =>
        sale.purchaseAllocations?.filter(
          (alloc) => alloc.purchaseId === purchaseId,
        ) || [],
    );

    const totalSold = previousSales.reduce(
      (sum, alloc) => sum + alloc.amount,
      0,
    );

    // Calculate remaining amount
    return Math.max(0, purchase.amount - totalSold);
  };

  // Handle changes to a purchase allocation
  const handleAllocationChange = (
    index: number,
    field: AllocationField,
    value: string,
  ) => {
    const newAllocations = [...allocations];

    if (field === "purchaseId") {
      const purchase = purchases.find((p) => p.id === value) || null;
      newAllocations[index] = {
        ...newAllocations[index],
        purchaseId: value,
        purchase: purchase,
        // Reset amount when changing purchase
        amount: 0,
        costBasis: 0,
      };
    } else if (field === "amount") {
      const amount = parseFloat(value) || 0;
      const purchase = newAllocations[index].purchase;

      if (purchase) {
        const costBasisPerUnit =
          purchase.effectivePricePerUnit || purchase.pricePerUnit;
        const costBasis = amount * costBasisPerUnit;

        newAllocations[index] = {
          ...newAllocations[index],
          amount,
          costBasis,
        };
      }
    }

    setAllocations(newAllocations);
    updateTotalAmount(newAllocations);
  };

  // Add a new allocation
  const addAllocation = () => {
    setAllocations([
      ...allocations,
      {
        purchaseId: "",
        purchase: null,
        amount: 0,
        costBasis: 0,
      },
    ]);
  };

  // Remove an allocation
  const removeAllocation = (index: number) => {
    if (allocations.length <= 1) return; // Keep at least one allocation

    const newAllocations = allocations.filter((_, i) => i !== index);
    setAllocations(newAllocations);
    updateTotalAmount(newAllocations);
  };

  // Update total amount based on all allocations
  const updateTotalAmount = (currentAllocations: PurchaseAllocation[]) => {
    const totalAmount = currentAllocations.reduce(
      (sum, alloc) => sum + alloc.amount,
      0,
    );
    setFormData((prev) => ({
      ...prev,
      amount: totalAmount.toString(),
    }));
  };

  // Filter out purchases that have been completely sold
  const getAvailablePurchases = () => {
    return purchases.filter((purchase) => {
      return getAvailableAmount(purchase.id) > 0;
    });
  };
  // Calculate profit and update display
  const updateCalculatedProfit = () => {
    if (allocations.some((a) => !a.purchase) || !formData.pricePerUnit) {
      setCalculatedProfit(null);
      return;
    }

    const totalAmount = allocations.reduce(
      (sum, alloc) => sum + alloc.amount,
      0,
    );
    const salePricePerUnit = parseFloat(formData.pricePerUnit);

    if (totalAmount <= 0 || isNaN(salePricePerUnit)) {
      setCalculatedProfit(null);
      return;
    }

    // Calculate sales total
    const saleTotal = totalAmount * salePricePerUnit;

    // Calculate total cost basis from all allocations
    const totalCostBasis = allocations.reduce(
      (sum, alloc) => sum + alloc.costBasis,
      0,
    );

    // Calculate fees
    const shippingCost = parseFloat(formData.shippingCost) || 0;
    const sellerFee = pureFee * totalAmount * salePricePerUnit; // Calculate based on percentage of sale value
    const paymentProcessingFee = parseFloat(formData.paymentProcessingFee) || 0;
    const otherFee = formData.otherFee
      ? parseFloat(formData.otherFeeAmount) || 0
      : 0;

    const totalFees =
      shippingCost + sellerFee + paymentProcessingFee + otherFee;

    // Calculate profit
    const profit = saleTotal - totalCostBasis - totalFees;
    setCalculatedProfit(profit);

    // Update form notes with profit details
    const userNotes = formData.userEnteredNotes;

    // Generate profit details note
    const generatedNotes =
      `Profit Details:\n` +
      `Sale Amount: ${totalAmount} ${formData.unit} @ $${salePricePerUnit.toFixed(2)} = $${saleTotal.toFixed(2)}\n` +
      generateCostBasisText(
        allocations,
        totalAmount,
        totalCostBasis,
        formData.unit,
      ) +
      generateFeesText(
        shippingCost,
        sellerFee,
        paymentProcessingFee,
        otherFee,
        totalFees,
        formData.otherFeeName,
      ) +
      generateProfitText(profit, totalCostBasis);

    // Update notes
    formData.notes = userNotes
      ? `${userNotes}\n\n${generatedNotes}`
      : generatedNotes;
  };

  // Helper function to generate cost basis text
  const generateCostBasisText = (
    allocations: PurchaseAllocation[],
    totalAmount: number,
    totalCostBasis: number,
    unit: GoldUnit,
  ): string => {
    if (allocations.length > 1) {
      let text = `Cost Basis Details:\n`;

      allocations.forEach((alloc, index) => {
        if (alloc.purchase && alloc.amount > 0) {
          const purchase = alloc.purchase;
          const costBasisPerUnit =
            purchase.effectivePricePerUnit || purchase.pricePerUnit;

          text += `  - Purchase ${index + 1}: ${alloc.amount} ${unit} @ $${costBasisPerUnit.toFixed(2)} = $${alloc.costBasis.toFixed(2)}\n`;
        }
      });

      text += `Total Cost Basis: $${totalCostBasis.toFixed(2)}\n`;
      return text;
    } else if (allocations.length === 1 && allocations[0].purchase) {
      const purchase = allocations[0].purchase;
      const costBasisPerUnit =
        purchase.effectivePricePerUnit || purchase.pricePerUnit;

      return `Cost Basis: ${totalAmount} ${unit} @ $${costBasisPerUnit.toFixed(2)} = $${totalCostBasis.toFixed(2)}\n`;
    }

    return "";
  };
  // Helper function to generate fees text
  const generateFeesText = (
    shippingCost: number,
    sellerFee: number,
    paymentProcessingFee: number,
    otherFee: number,
    totalFees: number,
    otherFeeName: string,
  ): string => {
    if (totalFees > 0) {
      let text = `Fees:\n`;
      if (shippingCost > 0)
        text += `  - Shipping: ${shippingCost.toFixed(2)}\n`;
      // Modified seller fee to show percentage
      if (sellerFee > 0)
        text += `  - Seller Fee (${(pureFee * 100).toFixed(2)}%): ${sellerFee.toFixed(2)}\n`;
      if (paymentProcessingFee > 0)
        text += `  - Payment Processing: ${paymentProcessingFee.toFixed(2)}\n`;
      if (otherFee > 0)
        text += `  - ${otherFeeName || "Other Fee"}: ${otherFee.toFixed(2)}\n`;
      text += `Total Fees: ${totalFees.toFixed(2)}\n`;
      return text;
    }
    return "";
  };

  // Helper function to generate profit text
  const generateProfitText = (
    profit: number,
    totalCostBasis: number,
  ): string => {
    const profitPercentage =
      totalCostBasis > 0 ? (profit / totalCostBasis) * 100 : 0;
    return `Net Profit: $${profit.toFixed(2)} (${profitPercentage.toFixed(2)}% ROI)`;
  };
  // Update profit calculation when relevant form fields change
  useEffect(() => {
    updateCalculatedProfit();
  }, [
    allocations,
    formData.pricePerUnit,
    formData.shippingCost,
    formData.sellerFee,
    formData.paymentProcessingFee,
    formData.otherFee,
    formData.otherFeeAmount,
    formData.otherFeeName,
    formData.unit,
  ]);

  // Ensure sellerFee always matches pureFee
  useEffect(() => {
    if (formData.sellerFee !== pureFee.toString()) {
      setFormData((prev) => ({
        ...prev,
        sellerFee: "",
      }));
    }
  }, [formData.sellerFee, pureFee]);

  // Calculate total cost basis from all allocations
  const getTotalCostBasis = () => {
    return allocations.reduce((sum, alloc) => sum + alloc.costBasis, 0);
  };

  // Calculate ROI percentage
  const getROIPercentage = () => {
    if (!calculatedProfit) return 0;

    const totalCostBasis = getTotalCostBasis();
    if (totalCostBasis <= 0) return 0;

    return (calculatedProfit / totalCostBasis) * 100;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validAllocations = allocations.filter(
      (alloc) => alloc.purchase && alloc.amount > 0,
    );

    if (validAllocations.length === 0) {
      alert("Please select at least one purchase and enter valid amounts");
      return;
    }

    const totalAmount = validAllocations.reduce(
      (sum, alloc) => sum + alloc.amount,
      0,
    );
    const pricePerUnit = parseFloat(formData.pricePerUnit);

    if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
      alert("Please enter a valid price per unit");
      return;
    }

    // Validate that each allocation doesn't exceed available amount
    for (const alloc of validAllocations) {
      // Skip validation for the current sale's allocations if editing
      if (
        isEditing &&
        editingSale &&
        editingSale.purchaseAllocations?.some(
          (a) => a.purchaseId === alloc.purchaseId,
        )
      ) {
        continue;
      }

      const availableAmount = getAvailableAmount(alloc.purchaseId);
      if (alloc.amount > availableAmount) {
        alert(
          `You can only sell up to ${availableAmount} ${formData.unit} from purchase dated ${alloc.purchase?.date.toLocaleDateString()}`,
        );
        return;
      }
    }
    // Calculate fees
    const shippingCost = parseFloat(formData.shippingCost) || 0;
    const sellerFee = pureFee * totalAmount * pricePerUnit; // Calculate as percentage of sale value
    const paymentProcessingFee = parseFloat(formData.paymentProcessingFee) || 0;
    const otherFee = formData.otherFee
      ? parseFloat(formData.otherFeeAmount) || 0
      : 0;
    const totalFees =
      shippingCost + sellerFee + paymentProcessingFee + otherFee;

    // Calculate sales total
    const totalPrice = totalAmount * pricePerUnit;

    // Calculate total cost basis
    const totalCostBasis = validAllocations.reduce(
      (sum, alloc) => sum + alloc.costBasis,
      0,
    );

    // Calculate profit
    const profit = totalPrice - totalCostBasis - totalFees;
    const profitPercentage = (profit / totalCostBasis) * 100;

    // Create purchase allocations for the record
    const purchaseAllocations = validAllocations.map((alloc) => {
      const purchase = alloc.purchase!;
      return {
        purchaseId: alloc.purchaseId,
        purchaseDate: purchase.date,
        amount: alloc.amount,
        costBasisPerUnit:
          purchase.effectivePricePerUnit || purchase.pricePerUnit,
        costBasis: alloc.costBasis,
      };
    });

    let updatedSales;

    if (isEditing && editingSale) {
      // Update existing sale
      const updatedSale: Sale = {
        ...editingSale,
        date: new Date(formData.date),
        amount: totalAmount,
        unit: formData.unit,
        pricePerUnit,
        currency: formData.currency,
        orderNumber: formData.orderNumber,
        notes: formData.notes,
        totalPrice,
        originalPurchasePrice: validAllocations.reduce(
          (sum, alloc) =>
            sum + alloc.amount * (alloc.purchase?.pricePerUnit || 0),
          0,
        ),
        effectivePurchasePrice: totalCostBasis,
        fees: totalFees,
        profit,
        profitPercentage,
        purchaseAllocations,
      };

      // Replace the old sale with the updated one
      updatedSales = sales.map((s) =>
        s.id === editingSale.id ? updatedSale : s,
      );
    } else {
      // Create new sale
      const newSale: Sale = {
        id: uuidv4(),
        date: new Date(formData.date),
        amount: totalAmount,
        unit: formData.unit,
        pricePerUnit,
        currency: formData.currency,
        orderNumber: formData.orderNumber,
        notes: formData.notes,
        totalPrice,
        originalPurchasePrice: validAllocations.reduce(
          (sum, alloc) =>
            sum + alloc.amount * (alloc.purchase?.pricePerUnit || 0),
          0,
        ),
        effectivePurchasePrice: totalCostBasis,
        fees: totalFees,
        profit,
        profitPercentage,
        purchaseAllocations,
      };

      // Add to sales array
      updatedSales = [newSale, ...sales];
    }

    // Update sales array
    setSales(updatedSales);

    // Save to localStorage
    localStorage.setItem("goldSales", JSON.stringify(updatedSales));

    // Reset form and editing state
    setIsEditing(false);
    setEditingSale(null);

    // Reset form
    setFormData({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      unit: "oz" as GoldUnit,
      pricePerUnit: "",
      currency: "USD" as Currency,
      orderNumber: "",
      notes: "",
      userEnteredNotes: "",
      shippingCost: "",
      sellerFee: "",
      paymentProcessingFee: "",
      otherFee: false,
      otherFeeName: "",
      otherFeeAmount: "",
    });

    // Reset allocations
    setAllocations([
      {
        purchaseId: "",
        purchase: null,
        amount: 0,
        costBasis: 0,
      },
    ]);
  };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gold Sales</h1>

      {/* Sale Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {isEditing ? "Edit Sale" : "Record New Sale"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Order Number
              </label>
              <input
                type="text"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                placeholder="Dealer, Individual, etc."
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="oz">Troy Ounce (oz)</option>
                <option value="g">Gram (g)</option>
                <option value="kg">Kilogram (kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sale Price Per Unit
              </label>
              <input
                type="number"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="2000.00"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Amount
              </label>
              <input
                type="text"
                name="totalAmount"
                value={parseFloat(formData.amount || "0").toFixed(3)}
                className="form-input bg-gray-100"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Calculated from purchase allocations below
              </p>
            </div>
          </div>
          {/* Purchase Allocations Section */}
          <div className="mt-6 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">
                Purchase Allocations
              </h3>
              <button
                type="button"
                onClick={addAllocation}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700"
              >
                Add Purchase
              </button>
            </div>

            {allocations.map((allocation, index) => (
              <div
                key={index}
                className="mb-4 p-4 border border-gray-200 rounded-md"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md font-medium text-gray-700">
                    Allocation #{index + 1}
                  </h4>
                  {allocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAllocation(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Select Purchase
                    </label>
                    <select
                      value={allocation.purchaseId}
                      onChange={(e) =>
                        handleAllocationChange(
                          index,
                          "purchaseId",
                          e.target.value,
                        )
                      }
                      className="form-input"
                      required
                    >
                      <option value="">Select a purchase</option>
                      {getAvailablePurchases().map((purchase) => (
                        <option
                          key={purchase.id}
                          value={purchase.id}
                          disabled={allocations.some(
                            (a) =>
                              a !== allocation && a.purchaseId === purchase.id,
                          )}
                        >
                          {purchase.date.toLocaleDateString()} -{" "}
                          {purchase.productName}
                          (Available:{" "}
                          {getAvailableAmount(purchase.id).toFixed(3)}{" "}
                          {purchase.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount to Sell
                    </label>
                    <input
                      type="number"
                      value={allocation.amount || ""}
                      onChange={(e) =>
                        handleAllocationChange(index, "amount", e.target.value)
                      }
                      step="1"
                      min="1"
                      max={
                        allocation.purchase
                          ? getAvailableAmount(allocation.purchaseId)
                          : undefined
                      }
                      placeholder={
                        allocation.purchase
                          ? `Max: ${getAvailableAmount(allocation.purchaseId)}`
                          : "0.000"
                      }
                      className="form-input"
                      disabled={!allocation.purchase}
                      required
                    />
                  </div>
                  {allocation.purchase && allocation.amount > 0 && (
                    <div className="md:col-span-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700 ml-2">
                          Cost Basis:{" "}
                        </span>
                        <span className="text-gray-700 ml-2">
                          ${allocation.costBasis.toFixed(2)}
                        </span>
                        <span className="text-gray-700 ml-2">
                          ({allocation.amount} {formData.unit} @ $
                          {(
                            allocation.purchase.effectivePricePerUnit ||
                            allocation.purchase.pricePerUnit
                          ).toFixed(2)}
                          )
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Fees Section */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Fees & Expenses
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Cost
                </label>
                <input
                  type="number"
                  name="shippingCost"
                  value={formData.shippingCost}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Seller Fee
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="sellerFee"
                    value={`${(pureFee * 100).toFixed(2)}%`}
                    readOnly={true}
                    className="form-input bg-gray-100"
                  />
                  {parseFloat(formData.pricePerUnit) > 0 &&
                    parseFloat(formData.amount) > 0 && (
                      <div className="absolute right-0 top-0 h-full flex items-center pr-3 text-sm text-gray-500">
                        ≈ $
                        {(
                          pureFee *
                          parseFloat(formData.pricePerUnit) *
                          parseFloat(formData.amount)
                        ).toFixed(2)}
                      </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Fixed at {(pureFee * 100).toFixed(2)}% of sale value
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Processing Fee
                </label>
                <input
                  type="number"
                  name="paymentProcessingFee"
                  value={formData.paymentProcessingFee}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="form-input"
                />
              </div>

              {/* Other Fee */}
              <div className="flex items-start mt-2">
                <div className="flex h-5 items-center">
                  <input
                    id="otherFee"
                    name="otherFee"
                    type="checkbox"
                    checked={formData.otherFee}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="otherFee"
                    className="font-medium text-gray-700"
                  >
                    Other Fee
                  </label>
                </div>
              </div>

              {/* Other Fee Details */}
              {formData.otherFee && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fee Description
                    </label>
                    <input
                      type="text"
                      name="otherFeeName"
                      value={formData.otherFeeName}
                      onChange={handleChange}
                      placeholder="Insurance, Tax, etc."
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fee Amount
                    </label>
                    <input
                      type="number"
                      name="otherFeeAmount"
                      value={formData.otherFeeAmount}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="form-input"
                      required={formData.otherFee}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Profit Calculation Display */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Profit Calculation
                  </h3>
                  <p className="text-sm text-gray-500">
                    Based on your cost basis and sale price
                  </p>
                </div>
                <div className="text-right">
                  {allocations.some((a) => a.purchase && a.amount > 0) &&
                  formData.pricePerUnit ? (
                    <>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-lg font-bold text-gray-900">
                          Net Profit:
                        </span>
                        <span
                          className={`text-xl font-bold ${
                            calculatedProfit && calculatedProfit > 0
                              ? "text-emerald-600"
                              : calculatedProfit && calculatedProfit < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          $
                          {calculatedProfit !== null
                            ? calculatedProfit.toFixed(2)
                            : "0.00"}
                        </span>
                      </div>
                      {calculatedProfit !== null && getTotalCostBasis() > 0 && (
                        <p className="text-sm text-gray-600">
                          {calculatedProfit > 0
                            ? `Return on Investment: ${getROIPercentage().toFixed(2)}%`
                            : calculatedProfit < 0
                              ? `Loss: ${getROIPercentage().toFixed(2)}%`
                              : "Break even (0% ROI)"}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      Select purchases and enter details
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="form-input"
            />
          </div>

          <div className="flex justify-end space-x-4">
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isEditing ? "Update Sale" : "Record Sale"}
            </button>
          </div>
        </form>
      </div>
      {/* Sales History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Sales History</h2>

        {sales.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
            No sales recorded yet. Use the form above to record your first sale.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* This makes it scrollable */}
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                {/* Sticky header */}
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Basis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEditSale(sale)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.date instanceof Date
                          ? sale.date.toLocaleDateString()
                          : new Date(sale.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.amount} {sale.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.currency === "USD"
                          ? "$"
                          : sale.currency === "EUR"
                            ? "€"
                            : "£"}
                        {sale.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.currency === "USD"
                          ? "$"
                          : sale.currency === "EUR"
                            ? "€"
                            : "£"}
                        {sale.effectivePurchasePrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`${
                            sale.profit > 0
                              ? "text-emerald-600"
                              : sale.profit < 0
                                ? "text-red-600"
                                : "text-gray-500"
                          }`}
                        >
                          {sale.currency === "USD"
                            ? "$"
                            : sale.currency === "EUR"
                              ? "€"
                              : "£"}
                          {sale.profit.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            sale.profit > 0
                              ? "bg-green-100 text-green-800"
                              : sale.profit < 0
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {sale.profitPercentage.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div
                          className="flex space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSale(sale);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSale(sale.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
