import { NextRequest, NextResponse } from "next/server";
import { buildAnalysis } from "@/lib/analyzer";
import { fetchCandles, fetchFundamentals, fetchNews } from "@/lib/market-data";

const lists: Record<string, string[]> = { uptrend: ["NVDA", "MSFT", "AAPL", "AVGO", "META"], breakout: ["AMD", "TSLA", "SHOP", "PLTR", "COIN"], undervalued: ["GOOGL", "BABA", "PYPL", "DIS", "INTC"], growth: ["NVDA", "AMZN", "CRM", "NOW", "SNOW"], dividend: ["KO", "PEP", "JNJ", "PG", "XOM"], oversold: ["NKE", "SBUX", "PFE", "BA", "WBA"], volume: ["TSLA", "AMD", "NVDA", "AAPL", "SOFI"], riskReward: ["MSFT", "GOOGL", "AMZN", "V", "MA"] };

export async function GET(request: NextRequest) {
  const preset = request.nextUrl.searchParams.get("preset") || "riskReward";
  const rows = await Promise.all((lists[preset] || lists.riskReward).map(async symbol => {
    try { const [{ candles, currency }, summary, news] = await Promise.all([fetchCandles(symbol, "6M"), fetchFundamentals(symbol), fetchNews(symbol).catch(() => [])]); const a = await buildAnalysis({ symbol, companyName: summary.companyName, currency: summary.currency || currency, timeframe: "6M", candles, fundamentals: summary.fundamentals, news }); return { symbol, companyName: a.companyName, recommendation: a.recommendation, score: a.totalScore, upside: a.valuation.upsideDownside, risk: a.valuation.riskLevel, trend: a.marketTrend }; } catch { return null; }
  }));
  return NextResponse.json({ preset, rows: rows.filter(Boolean) });
}
