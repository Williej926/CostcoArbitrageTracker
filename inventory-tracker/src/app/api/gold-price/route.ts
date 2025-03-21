// src/app/api/gold-price/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the API key and ensure it's a string
    const apiKey = process.env.PURE_API_KEY || "";

    const response = await fetch(
      "https://public.api.collectpure.com/v1/spot-prices",
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch gold price");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching gold price:", error);
    return NextResponse.json(
      { error: "Failed to fetch gold price" },
      { status: 500 },
    );
  }
}
