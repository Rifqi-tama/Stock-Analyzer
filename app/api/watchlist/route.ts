import { NextRequest, NextResponse } from "next/server";

type WatchItem = { symbol: string; note?: string };
let memoryWatchlist: WatchItem[] = [{ symbol: "AAPL", note: "Quality benchmark" }, { symbol: "MSFT", note: "Watch pullbacks" }];

export async function GET() { const remote = await supabaseRequest("GET"); return NextResponse.json({ items: remote || memoryWatchlist, mode: remote ? "supabase" : "memory" }); }
export async function POST(request: NextRequest) { const body = await request.json() as WatchItem; const item = { symbol: String(body.symbol || "").toUpperCase(), note: body.note || "" }; if (!item.symbol) return NextResponse.json({ error: "Symbol is required." }, { status: 400 }); const remote = await supabaseRequest("POST", item); if (!remote) memoryWatchlist = [item, ...memoryWatchlist.filter(x => x.symbol !== item.symbol)].slice(0, 30); return NextResponse.json({ item, mode: remote ? "supabase" : "memory" }); }

async function supabaseRequest(method: "GET" | "POST", item?: WatchItem) { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!url || !key) return null; const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/watchlist`, { method, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: method === "POST" ? JSON.stringify(item) : undefined, cache: "no-store" }); return response.ok ? response.json() : null; }
