import type { Candle, Fundamentals, NewsItem, Timeframe } from "./types";

const ranges: Record<Timeframe, { range: string; interval: string }> = { "1D": { range: "1d", interval: "5m" }, "1W": { range: "5d", interval: "15m" }, "1M": { range: "1mo", interval: "1d" }, "3M": { range: "3mo", interval: "1d" }, "6M": { range: "6mo", interval: "1d" }, "1Y": { range: "1y", interval: "1d" }, "5Y": { range: "5y", interval: "1wk" } };

export async function fetchCandles(symbol: string, timeframe: Timeframe): Promise<{ candles: Candle[]; currency: string }> {
  const cfg = ranges[timeframe];
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${cfg.range}&interval=${cfg.interval}`, { next: { revalidate: timeframe === "1D" ? 60 : 900 } });
  if (!response.ok) throw new Error("Unable to fetch chart data.");
  const json = await response.json(); const result = json.chart?.result?.[0]; const q = result?.indicators?.quote?.[0]; const ts: number[] = result?.timestamp ?? [];
  const candles = ts.map((t, i) => ({ time: new Date(t * 1000).toISOString(), open: Number(q.open?.[i]), high: Number(q.high?.[i]), low: Number(q.low?.[i]), close: Number(q.close?.[i]), volume: Number(q.volume?.[i] ?? 0) })).filter(c => Number.isFinite(c.open + c.high + c.low + c.close));
  if (candles.length < 5) throw new Error("Not enough chart data for this symbol.");
  return { candles, currency: result?.meta?.currency ?? "USD" };
}

export async function fetchFundamentals(symbol: string): Promise<{ companyName: string; currency: string; fundamentals: Fundamentals }> {
  const empty: Fundamentals = { revenue: null, netProfit: null, eps: null, per: null, pbv: null, roe: null, der: null, cashFlow: null, debt: null, revenueGrowth: null, profitGrowth: null, dividendYield: null };
  try {
    const modules = "price,summaryDetail,defaultKeyStatistics,financialData";
    const response = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("No fundamentals");
    const d = (await response.json()).quoteSummary?.result?.[0]; if (!d) throw new Error("No fundamentals");
    const raw = (v: { raw?: number } | undefined) => typeof v?.raw === "number" ? v.raw : null; const pct = (v: { raw?: number } | undefined) => raw(v) === null ? null : (raw(v) as number) * 100;
    return { companyName: d.price?.longName ?? d.price?.shortName ?? symbol.toUpperCase(), currency: d.price?.currency ?? "USD", fundamentals: { revenue: raw(d.financialData?.totalRevenue), netProfit: raw(d.defaultKeyStatistics?.netIncomeToCommon), eps: raw(d.defaultKeyStatistics?.trailingEps), per: raw(d.summaryDetail?.trailingPE), pbv: raw(d.defaultKeyStatistics?.priceToBook), roe: pct(d.financialData?.returnOnEquity), der: raw(d.financialData?.debtToEquity), cashFlow: raw(d.financialData?.freeCashflow), debt: raw(d.financialData?.totalDebt), revenueGrowth: pct(d.financialData?.revenueGrowth), profitGrowth: pct(d.financialData?.earningsGrowth), dividendYield: pct(d.summaryDetail?.dividendYield) } };
  } catch { return { companyName: symbol.toUpperCase(), currency: "USD", fundamentals: empty }; }
}

export async function fetchNews(symbol: string): Promise<NewsItem[]> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return [{ title: `${symbol.toUpperCase()} news API key not configured`, source: "System", url: "#", publishedAt: new Date().toISOString(), sentiment: "neutral", summary: "Add FINNHUB_API_KEY to include recent company news." }];
  const to = new Date(); const from = new Date(Date.now() - 21 * 864e5); const day = (d: Date) => d.toISOString().slice(0, 10);
  const response = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${day(from)}&to=${day(to)}&token=${token}`, { next: { revalidate: 900 } });
  if (!response.ok) return [];
  const data = await response.json();
  return data.slice(0, 8).map((x: Record<string, unknown>) => { const text = `${x.headline ?? ""} ${x.summary ?? ""}`.toLowerCase(); const good = ["beat", "growth", "upgrade", "profit", "strong"].some(w => text.includes(w)); const bad = ["miss", "downgrade", "loss", "weak", "lawsuit"].some(w => text.includes(w)); return { title: String(x.headline ?? "News"), source: String(x.source ?? "News"), url: String(x.url ?? "#"), publishedAt: new Date(Number(x.datetime ?? Date.now() / 1000) * 1000).toISOString(), sentiment: good ? "positive" : bad ? "negative" : "neutral", summary: String(x.summary ?? "No summary available.") }; });
}
