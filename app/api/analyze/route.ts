import { NextRequest, NextResponse } from "next/server";
import { buildAnalysis } from "@/lib/analyzer";
import { fetchCandles, fetchFundamentals, fetchNews } from "@/lib/market-data";
import type { Timeframe } from "@/lib/types";

const valid = new Set(["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"]);

export async function GET(request: NextRequest) {
  const symbol = (request.nextUrl.searchParams.get("symbol") || "BBCA").trim().toUpperCase();
  const tf = request.nextUrl.searchParams.get("timeframe") || "6M";
  const timeframe = (valid.has(tf) ? tf : "6M") as Timeframe;
  try {
    const [{ candles, currency }, summary, news] = await Promise.all([fetchCandles(symbol, timeframe), fetchFundamentals(symbol), fetchNews(symbol).catch(() => [])]);
    const analysis = await buildAnalysis({ symbol, companyName: summary.companyName, currency: summary.currency || currency, timeframe, candles, fundamentals: summary.fundamentals, news });
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to analyze stock.", symbol, timeframe }, { status: 502 });
  }
}
