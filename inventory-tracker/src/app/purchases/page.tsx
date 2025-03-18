// src/app/purchases/page.tsx
"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Purchase, GoldUnit, Currency } from "@/types";

export default function PurchasesPage() {
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    unit: "oz" as GoldUnit,
    pricePerUnit: "",
    currency: "USD" as Currency,
    orderNumber: "",
    notes: "",

    // Payment methods
    paymentMethods: {
      amexSub: false,
      citiAA: false,
      bofaPlatHonors: false,
      venmo: false,
      costcoCiti: false,
      usBankSmartly: false,
      chaseInkPremier: false,
      other: false,
    },
    otherPaymentMethodName: "",

    // Discount settings (changed cashback to kasheesh)
    usedKasheesh: false,
    hasExecutiveMembership: false,
    otherDiscount: false,
    otherDiscountRate: "",
    otherDiscountName: "",
  });
  const paymentMethodDiscounts = {
    amexSub: 0, // 1.5%
    citiAA: 0.018, // 2%
    bofaPlatHonors: 0.02625, // 2.5%
    venmo: 0.05, // 1%
    costcoCiti: 0.038, // 2%
    usBankSmartly: 0.04, // 1.5%
    chaseInkPremier: 0.025, // 3%
    other: 0, // 0% by default
  };
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Handle different input types appropriately
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  // Handle payment method card clicks
  const handlePaymentMethodToggle = (method: string) => {
    setFormData({
      ...formData,
      paymentMethods: {
        ...formData.paymentMethods,
        [method]: !formData.paymentMethods[method],
      },
    });
  };
  const updateCalculatedPrice = () => {
    if (!formData.amount || !formData.pricePerUnit) {
      setCalculatedPrice(null);
      return;
    }

    const amount = parseFloat(formData.amount);
    const pricePerUnit = parseFloat(formData.pricePerUnit);

    if (isNaN(amount) || isNaN(pricePerUnit)) {
      setCalculatedPrice(null);
      return;
    }

    const basePrice = amount * pricePerUnit;
    const effectivePrice = calculateEffectivePrice(basePrice);
    setCalculatedPrice(effectivePrice);
  };
  const calculateEffectivePrice = (basePrice: number): number => {
    let effectivePrice = basePrice;
    let discountDetails = [];
    
    // Get only user-entered notes (excluding any previously generated notes)
    // This is a key change - we need to track user notes separately
    const userEnteredNotes = formData.userEnteredNotes || ""; // Use a separate field for user's actual notes
    
    // Apply payment method discounts
    const selectedMethods = Object.keys(formData.paymentMethods).filter(
      (method) => formData.paymentMethods[method],
    );
  
    for (const method of selectedMethods) {
      const discountRate = paymentMethodDiscounts[method] || 0;
      if (discountRate > 0) {
        const discountAmount = basePrice * discountRate;
        effectivePrice -= discountAmount;
        discountDetails.push(
          `${method}: ${(discountRate * 100).toFixed(1)}% (-$${discountAmount.toFixed(2)})`,
        );
      }
    }
  
    // Apply Kasheesh fee if used
    if (formData.usedKasheesh) {
      const kasheeshRate = 0.02;
      const kasheeshAmount = basePrice * kasheeshRate;
      effectivePrice += kasheeshAmount;
      discountDetails.push(`Kasheesh: 2% fee (+$${kasheeshAmount.toFixed(2)})`);
    }
  
    // Apply executive membership discount
    if (formData.hasExecutiveMembership) {
      const execDiscountRate = 0.02;
      const execDiscountAmount = basePrice * execDiscountRate;
      effectivePrice -= execDiscountAmount;
      discountDetails.push(
        `Executive membership: 2% (-$${execDiscountAmount.toFixed(2)})`,
      );
    }
  
    // Apply other discount if applicable
    if (formData.otherDiscount && formData.otherDiscountRate) {
      const otherRate = parseFloat(formData.otherDiscountRate) / 100;
      const otherAmount = basePrice * otherRate;
      effectivePrice -= otherAmount;
      discountDetails.push(
        `${formData.otherDiscountName || "Other discount"}: ${formData.otherDiscountRate}% (-$${otherAmount.toFixed(2)})`,
      );
    }
  
    // Generate new notes based on current state
    let generatedNotes = "";
  
    // Add discount details to notes if any were applied
    if (discountDetails.length > 0) {
      generatedNotes += `Applied discounts: ${discountDetails.join(", ")}. Original price: $${basePrice.toFixed(2)}`;
    }
  
    // Add payment methods to notes
    if (selectedMethods.length > 0) {
      const paymentMethodNote = `Payment methods: ${selectedMethods
        .map((method) =>
          method === "other"
            ? formData.otherPaymentMethodName || "Other"
            : method,
        )
        .join(", ")}`;
  
      if (generatedNotes) {
        generatedNotes += "\n" + paymentMethodNote;
      } else {
        generatedNotes = paymentMethodNote;
      }
    }
  
    // Combine user notes with freshly generated notes
    if (generatedNotes) {
      formData.notes = userEnteredNotes ? userEnteredNotes + "\n\n" + generatedNotes : generatedNotes;
    } else {
      formData.notes = userEnteredNotes;
    }
    
    return effectivePrice;
  };
  useEffect(() => {
    updateCalculatedPrice();
  }, [
    formData.amount,
    formData.pricePerUnit,
    formData.paymentMethods,
    formData.usedKasheesh,
    formData.hasExecutiveMembership,
    formData.otherDiscount,
    formData.otherDiscountRate,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    const pricePerUnit = parseFloat(formData.pricePerUnit);

    if (isNaN(amount) || isNaN(pricePerUnit)) {
      alert("Please enter valid numbers for amount and price");
      return;
    }

    // Calculate base total price
    const baseTotalPrice = amount * pricePerUnit;

    // Calculate effective price after discounts
    const effectiveTotalPrice = calculateEffectivePrice(baseTotalPrice);

    // Calculate effective price per unit
    const effectivePricePerUnit = effectiveTotalPrice / amount;

    const newPurchase: Purchase = {
      id: uuidv4(),
      date: new Date(formData.date),
      amount,
      unit: formData.unit,
      pricePerUnit, // Original price per unit
      effectivePricePerUnit, // Price after discounts
      currency: formData.currency,
      orderNumber: formData.orderNumber,
      notes: formData.notes,
      totalPrice: baseTotalPrice,
      effectiveTotalPrice,
      discountsApplied: baseTotalPrice !== effectiveTotalPrice,
      paymentMethods: formData.paymentMethods,
    };

    setPurchases([newPurchase, ...purchases]);

    // Reset form
    setFormData({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      unit: "oz" as GoldUnit,
      pricePerUnit: "",
      currency: "USD" as Currency,
      orderNumber: "",
      notes: "",
      paymentMethods: {
        amexSub: false,
        citiAA: false,
        bofaPlatHonors: false,
        venmo: false,
        costcoCiti: false,
        usBankSmartly: false,
        chaseInkPremier: false,
        other: false,
      },
      otherPaymentMethodName: "",
      usedKasheesh: false,
      hasExecutiveMembership: false,
      otherDiscount: false,
      otherDiscountRate: "",
      otherDiscountName: "",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gold Purchases</h1>

      {/* Purchase Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700" >Add New Purchase</h2>

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
                placeholder="#"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.001"
                min="0"
                placeholder="1.0"
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
                Price Per Unit
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
          </div>

          {/* Discount Settings Section - Improved Layout */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Discount Settings
            </h3>

            {/* Payment Method Selection - Updated for clickable cards */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Amex SUB */}
                <div
                  className={`flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                    formData.paymentMethods.amexSub
                      ? "bg-indigo-50 border-indigo-300"
                      : ""
                  }`}
                  onClick={() => handlePaymentMethodToggle("amexSub")}
                >
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.amexSub}
                    onChange={() => {}} // Handling in the onClick of the label
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Amex SUB
                  </span>
                </div>

                {/* Citi AA */}
                <div
                  className={`flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                    formData.paymentMethods.citiAA
                      ? "bg-indigo-50 border-indigo-300"
                      : ""
                  }`}
                  onClick={() => handlePaymentMethodToggle("citiAA")}
                >
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.citiAA}
                    onChange={() => {}} // Handling in the onClick of the label
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Citi AA
                  </span>
                </div>

                {/* BofA Plat Honors */}
                <div
                  className={`flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                    formData.paymentMethods.bofaPlatHonors
                      ? "bg-indigo-50 border-indigo-300"
                      : ""
                  }`}
                  onClick={() => handlePaymentMethodToggle("bofaPlatHonors")}
                >
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.bofaPlatHonors}
                    onChange={() => {}} // Handling in the onClick of the label
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    BofA Plat Honors
                  </span>
                </div>

                {/* Venmo */}
                <div
                  className={`flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                    formData.paymentMethods.venmo
                      ? "bg-indigo-50 border-indigo-300"
                      : ""
                  }`}
                  onClick={() => handlePaymentMethodToggle("venmo")}
                >
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.venmo}
                    onChange={() => {}} // Handling in the onClick of the label
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Venmo
                  </span>
                </div>

                {/* Costco Citi */}
                <div
                  className={`flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                    formData.paymentMethods.costcoCiti
                      ? "bg-indigo-50 border-indigo-300"
                      : ""
                  }`}
                  onClick={() => handlePaymentMethodToggle("costcoCiti")}
                >
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.costcoCiti}
                    onChange={() => {}} // Handling in the onClick of the label
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Costco Citi
                  </span>
                </div>

                {/* US Bank Smartly */}
                <div
                  className={`flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                    formData.paymentMethods.usBankSmartly
                      ? "bg-indigo-50 border-indigo-300"
                      : ""
                  }`}
                  onClick={() => handlePaymentMethodToggle("usBankSmartly")}
                >
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.usBankSmartly}
                    onChange={() => {}} // Handling in the onClick of the label
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    US Bank Smartly
                  </span>
                </div>

                {/* Chase Ink Premier */}
                <div
                  className={`flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                    formData.paymentMethods.chaseInkPremier
                      ? "bg-indigo-50 border-indigo-300"
                      : ""
                  }`}
                  onClick={() => handlePaymentMethodToggle("chaseInkPremier")}
                >
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.chaseInkPremier}
                    onChange={() => {}} // Handling in the onClick of the label
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Chase Ink Premier
                  </span>
                </div>
              </div>

              {/* Show optional payment method name field if "Other" is selected */}
              {formData.paymentMethods.other && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Method Name
                  </label>
                  <input
                    type="text"
                    name="otherPaymentMethodName"
                    value={formData.otherPaymentMethodName}
                    onChange={handleChange}
                    placeholder="Enter payment method name"
                    className="form-input"
                  />
                </div>
              )}
            </div>

            {/* Discounts and Rebates Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Discounts & Rebates
              </label>
              <div className="space-y-4">
                {/* Executive Membership Discount */}
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="hasExecutiveMembership"
                      name="hasExecutiveMembership"
                      type="checkbox"
                      checked={formData.hasExecutiveMembership}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="hasExecutiveMembership"
                      className="font-medium text-gray-700"
                    >
                      Executive Membership (2%)
                    </label>
                    <p className="text-gray-500">
                      Costco Executive Membership reward
                    </p>
                  </div>
                </div>

                {/* Kasheesh Discount */}
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="usedKasheesh"
                      name="usedKasheesh"
                      type="checkbox"
                      checked={formData.usedKasheesh}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="usedKasheesh"
                      className="font-medium text-gray-700"
                    >
                      Kasheesh (2%)
                    </label>
                    <p className="text-gray-500">Applied Kasheesh discount</p>
                  </div>
                </div>

                {/* Other Discount with Inline Rate and Name */}
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="otherDiscount"
                      name="otherDiscount"
                      type="checkbox"
                      checked={formData.otherDiscount}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 text-gray-700"
                    />
                  </div>
                  <div className="ml-3 text-sm flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="otherDiscount"
                      className="font-medium text-gray-700"
                    >
                      Other Discount
                    </label>
                    {formData.otherDiscount && (
                      <>
                        <div className="flex items-center">
                          <input
                            type="text"
                            name="otherDiscountName"
                            value={formData.otherDiscountName}
                            onChange={handleChange}
                            placeholder="Discount name"
                            className="w-32 sm:w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-700"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="number"
                            name="otherDiscountRate"
                            value={formData.otherDiscountRate}
                            onChange={handleChange}
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="Rate"
                            className="w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-700"
                          />
                          <span className="ml-1">%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Dynamic Price Display */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Total Cost
                    </h3>
                    <p className="text-sm text-gray-500">
                      Price after applying all discounts
                    </p>
                  </div>
                  <div className="text-right">
                    {formData.amount && formData.pricePerUnit ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 line-through">
                            $
                            {(
                              parseFloat(formData.amount) *
                              parseFloat(formData.pricePerUnit)
                            ).toFixed(2)}
                          </span>
                          <span className="text-lg font-bold text-emerald-600">
                            $
                            {calculatedPrice !== null
                              ? calculatedPrice.toFixed(2)
                              : "0.00"}
                          </span>
                        </div>
                        {calculatedPrice !== null && (
                          <p className="text-xs text-gray-500">
                            Savings: $
                            {(
                              parseFloat(formData.amount) *
                                parseFloat(formData.pricePerUnit) -
                              calculatedPrice
                            ).toFixed(2)}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-400">
                        Enter amount and price
                      </span>
                    )}
                  </div>
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
                    List Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discounts
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.date.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.amount} {purchase.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.currency === "USD"
                        ? "$"
                        : purchase.currency === "EUR"
                          ? "€"
                          : "£"}
                      {purchase.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.currency === "USD"
                        ? "$"
                        : purchase.currency === "EUR"
                          ? "€"
                          : "£"}
                      {purchase.effectiveTotalPrice?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {purchase.discountsApplied ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Applied
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          None
                        </span>
                      )}
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
