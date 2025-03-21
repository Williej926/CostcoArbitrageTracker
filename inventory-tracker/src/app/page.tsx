// src/app/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { CardTitle } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/Card";
import { Card } from "@/components/ui/Card";
import { Sale, Purchase } from "@/types";

// Helper interfaces for parsed localStorage data
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

// Extended transaction interface with details for the expandable rows
interface Transaction {
  id: string;
  date: Date;
  type: "purchase" | "sale";
  amount: number;
  unit: string;
  price: number;
  total: number;
  productName?: string;
  source?: string;
  paymentMethods?: { [key: string]: boolean };
  notes?: string;
  profit?: number;
  purchaseAllocations?: any[];
}

export default function Home() {
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("Loading...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Portfolio statistics
  const [currentHoldings, setCurrentHoldings] = useState<number>(0);
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const [profitPercentage, setProfitPercentage] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {},
  );

  useEffect(() => {
    // Fetch gold price
    const fetchGoldPrice = async () => {
      try {
        setIsLoading(true);
        // Now calling your own API route instead of the external API directly
        const response = await fetch("/api/gold-price");

        if (!response.ok) {
          throw new Error("Failed to fetch gold price");
        }

        const data = await response.json();
        // Adjust this based on the structure of the API response
        setGoldPrice(data.Gold.bid);
        setLastUpdated(new Date().toLocaleString());
      } catch (err) {
        console.error("Error fetching gold price:", err);
        setError("Could not load current gold price");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoldPrice();

    // Load transaction data and calculate statistics
    loadTransactionData();

    // Optional: Set up an interval to periodically update the price
    const intervalId = setInterval(fetchGoldPrice, 300000); // every 5 minutes

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this runs once when component mounts

  // Update estimated value when gold price changes
  useEffect(() => {
    if (goldPrice !== null) {
      setEstimatedValue(currentHoldings * goldPrice);
    }
  }, [goldPrice, currentHoldings]);

  const loadTransactionData = () => {
    try {
      // Load purchases from localStorage
      const savedPurchases = localStorage.getItem("goldPurchases");
      const purchases: Purchase[] = [];

      if (savedPurchases) {
        const parsedPurchases = JSON.parse(savedPurchases) as ParsedPurchase[];
        parsedPurchases.forEach((purchase) => {
          purchases.push({
            ...purchase,
            date: new Date(purchase.date),
          });
        });
      }

      // Load sales from localStorage
      const savedSales = localStorage.getItem("goldSales");
      const sales: Sale[] = [];

      if (savedSales) {
        const parsedSales = JSON.parse(savedSales) as ParsedSale[];
        parsedSales.forEach((sale) => {
          sales.push({
            ...sale,
            date: new Date(sale.date),
            purchaseAllocations: sale.purchaseAllocations
              ? sale.purchaseAllocations.map((alloc) => ({
                  ...alloc,
                  purchaseDate: new Date(alloc.purchaseDate),
                }))
              : undefined,
          });
        });
      }

      // Calculate current holdings (purchases - sales)
      calculateCurrentHoldings(purchases, sales);

      // Calculate total profit from sales
      calculateTotalProfit(sales);

      // Populate recent transactions
      populateRecentTransactions(purchases, sales);
    } catch (error) {
      console.error("Error loading transaction data:", error);
    }
  };

  const calculateCurrentHoldings = (purchases: Purchase[], sales: Sale[]) => {
    // Sum up all purchase amounts
    const totalPurchased = purchases.reduce((total, purchase) => {
      // Convert all units to oz for consistency if needed
      // For simplicity, assuming all are in the same unit (oz)
      return total + purchase.amount;
    }, 0);

    // Sum up all sale amounts
    const totalSold = sales.reduce((total, sale) => {
      // Again, assuming consistent units
      return total + sale.amount;
    }, 0);

    // Calculate current holdings
    const holdings = totalPurchased - totalSold;
    setCurrentHoldings(holdings);

    // Calculate total investment (cost basis)
    const investment = purchases.reduce((total, purchase) => {
      // Use effective price if available, otherwise use original price
      const price = purchase.effectiveTotalPrice || purchase.totalPrice;
      return total + price;
    }, 0);

    setTotalInvestment(investment);
  };

  const calculateTotalProfit = (sales: Sale[]) => {
    // Sum up profit from all sales
    const profit = sales.reduce((total, sale) => {
      return total + sale.profit;
    }, 0);

    setTotalProfit(profit);

    // Calculate overall profit percentage
    if (totalInvestment > 0) {
      setProfitPercentage((profit / totalInvestment) * 100);
    }
  };

  const populateRecentTransactions = (purchases: Purchase[], sales: Sale[]) => {
    // Create a map of purchase IDs to product names for quick lookup
    const purchaseProductMap = new Map<string, string>();
    purchases.forEach((purchase) => {
      if (purchase.id && purchase.productName) {
        purchaseProductMap.set(purchase.id, purchase.productName);
      }
    });

    // Combine purchases and sales into a single array of transactions
    const allTransactions = [
      ...purchases.map((purchase) => ({
        id: purchase.id,
        date: purchase.date,
        type: "purchase" as const,
        amount: purchase.amount,
        unit: purchase.unit,
        price: purchase.pricePerUnit,
        total: purchase.effectiveTotalPrice || purchase.totalPrice,
        productName: purchase.productName,
        source: purchase.source,
        paymentMethods: purchase.paymentMethods,
        notes: purchase.notes,
      })),
      ...sales.map((sale) => {
        // Enhance purchase allocations with product names if possible
        const enhancedAllocations = sale.purchaseAllocations?.map((alloc) => ({
          ...alloc,
          productName: purchaseProductMap.get(alloc.purchaseId) || "",
        }));

        return {
          id: sale.id,
          date: sale.date,
          type: "sale" as const,
          amount: sale.amount,
          unit: sale.unit,
          price: sale.pricePerUnit,
          total: sale.totalPrice,
          profit: sale.profit,
          source: sale.orderNumber,
          notes: sale.notes,
          purchaseAllocations: enhancedAllocations,
        };
      }),
    ];

    // Sort by date, most recent first
    allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Take only the 10 most recent transactions
    setRecentTransactions(allTransactions.slice(0, 10));
  };

  // Toggle expanded row
  const toggleExpandRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper to format payment methods list
  const formatPaymentMethods = (methods: { [key: string]: boolean }) => {
    if (!methods) return "None";

    const activePayments = Object.entries(methods)
      .filter(([, active]) => active)
      .map(([method]) => {
        // Format the payment method name for better readability
        return method === "amexSub"
          ? "Amex SUB"
          : method === "citiAA"
            ? "Citi AA"
            : method === "bofaPlatHonors"
              ? "BofA Plat Honors"
              : method === "venmo"
                ? "Venmo"
                : method === "costcoCiti"
                  ? "Costco Citi"
                  : method === "usBankSmartly"
                    ? "US Bank Smartly"
                    : method === "chaseInkPremier"
                      ? "Chase Ink Premier"
                      : method === "other"
                        ? "Other"
                        : method;
      });

    return activePayments.length > 0 ? activePayments.join(", ") : "None";
  };

  // Format structured transaction notes
  const formatTransactionNotes = (notes: string) => {
    if (!notes) return null;

    if (notes.includes("Profit Details:")) {
      const sections = notes.split(/\n+/);

      return (
        <>
          {sections.map((section, index) => {
            if (section.includes(":")) {
              const [title, ...rest] = section.split(":");
              const content = rest.join(":").trim();

              if (
                title.trim() === "Cost Basis Details" ||
                title.trim() === "Total Cost Basis"
              ) {
                return (
                  <div key={index} className="mt-1">
                    <span className="font-medium">{title.trim()}:</span>
                    <span className="ml-1">{content}</span>
                  </div>
                );
              }

              if (title.trim() === "Fees") {
                return (
                  <div key={index} className="mt-1">
                    <span className="font-medium">{title.trim()}:</span>
                    <span className="ml-1">{content}</span>
                  </div>
                );
              }

              if (section.includes("Net Profit:")) {
                return (
                  <div key={index} className="mt-1 font-medium text-green-600">
                    {section}
                  </div>
                );
              }

              return (
                <div key={index} className="mt-1">
                  <span className="font-medium">{title.trim()}:</span>
                  <span className="ml-1">{content}</span>
                </div>
              );
            }

            return <div key={index}>{section}</div>;
          })}
        </>
      );
    }

    return notes;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Current Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mt-2 text-gray-800">
              {currentHoldings.toFixed(2)} oz
            </p>
            <p className="text-sm text-gray-700 mt-1">
              Estimated Value: ${estimatedValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold mt-2 ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              ${totalProfit.toFixed(2)}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              All-time: {profitPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Gold Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mt-2 text-gray-800">
              ${goldPrice?.toFixed(2)}/oz
            </p>
            <p className="text-sm text-gray-700 mt-1">
              Last updated: {lastUpdated}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <React.Fragment key={transaction.id}>
                    <tr
                      onClick={() => toggleExpandRow(transaction.id)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.date.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.type === "purchase"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {transaction.type.charAt(0).toUpperCase() +
                            transaction.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.amount.toFixed(3)} {transaction.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${transaction.price.toFixed(2)}/{transaction.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${transaction.total.toFixed(2)}
                        {transaction.type === "sale" && transaction.profit && (
                          <span
                            className={`ml-2 text-xs ${transaction.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            ({transaction.profit >= 0 ? "+" : ""}$
                            {transaction.profit.toFixed(2)})
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedRows[transaction.id] && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="text-sm text-gray-700 space-y-3">
                            {/* Different details based on transaction type */}
                            {transaction.type === "purchase" ? (
                              <>
                                {transaction.productName && (
                                  <div>
                                    <span className="font-medium">
                                      Product:
                                    </span>{" "}
                                    {transaction.productName}
                                  </div>
                                )}
                                {transaction.source && (
                                  <div>
                                    <span className="font-medium">Source:</span>{" "}
                                    {transaction.source}
                                  </div>
                                )}
                                {transaction.paymentMethods && (
                                  <div>
                                    <span className="font-medium">
                                      Payment Methods:
                                    </span>{" "}
                                    {formatPaymentMethods(
                                      transaction.paymentMethods,
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {transaction.source && (
                                  <div>
                                    <span className="font-medium">
                                      Order Number:
                                    </span>{" "}
                                    {transaction.source}
                                  </div>
                                )}
                                {transaction.profit !== undefined && (
                                  <div>
                                    <span className="font-medium">Profit:</span>{" "}
                                    <span
                                      className={
                                        transaction.profit >= 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      ${transaction.profit.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                {transaction.purchaseAllocations &&
                                  transaction.purchaseAllocations.length >
                                    0 && (
                                    <div>
                                      <span className="font-medium">
                                        Source Purchases:
                                      </span>
                                      <ul className="list-disc ml-5 mt-1">
                                        {transaction.purchaseAllocations.map(
                                          (alloc, index) => (
                                            <li key={index}>
                                              {alloc.amount.toFixed(3)} oz @ $
                                              {alloc.costBasisPerUnit.toFixed(
                                                2,
                                              )}
                                              /oz (
                                              {new Date(
                                                alloc.purchaseDate,
                                              ).toLocaleDateString()}
                                              )
                                              {alloc.productName && (
                                                <span className="ml-1 text-gray-600">
                                                  - {alloc.productName}
                                                </span>
                                              )}
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  )}
                              </>
                            )}
                            {transaction.notes && (
                              <div>
                                <span className="font-medium">Notes:</span>
                                {transaction.notes.includes(
                                  "Profit Details:",
                                ) ? (
                                  <div className="mt-2 space-y-1.5 pl-2 text-sm">
                                    {formatTransactionNotes(transaction.notes)}
                                  </div>
                                ) : (
                                  <span className="ml-1">
                                    {transaction.notes}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    colSpan={5}
                  >
                    No transactions yet. Start by adding a purchase.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
