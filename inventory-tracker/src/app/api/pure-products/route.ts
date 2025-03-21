// src/app/api/pure-products/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const queryParams = new URLSearchParams({
      limit: "100",
      attributeIds: "9",
      material: "Gold",
    });
    const url = `https://public.api.collectpure.com/v1/products?${queryParams.toString()}`;
    const apiKey = process.env.PURE_API_KEY || "";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await response.json();
    console.log(data);
    console.log(url);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
