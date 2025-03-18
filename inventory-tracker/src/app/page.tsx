// src/app/page.tsx
"use client";
import { useState, useEffect } from "react";
import { CardTitle } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/Card";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const apiKey = process.env.PURE_API_KEY;
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("Loading...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
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

    // Optional: Set up an interval to periodically update the price
    const intervalId = setInterval(fetchGoldPrice, 300000); // every 5 minutes

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this runs once when component mounts

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
            <p className="text-3xl font-bold mt-2 text-gray-800">0 oz</p>
            <p className="text-sm text-gray-700 mt-1">Estimated Value: $0.00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mt-2 text-green-600">$0.00</p>
            <p className="text-sm text-gray-700 mt-1">All-time: 0.00%</p>
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
              <tr>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  colSpan={5}
                >
                  No transactions yet. Start by adding a purchase.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
