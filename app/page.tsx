"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AnalysisResult, Candle, Timeframe } from "@/lib/types";

const timeframes: Timeframe[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"];
const presets = [["riskReward", "Best Risk/Reward"], ["uptrend", "Strong Uptrend"], ["breakout", "Breakout"], ["undervalued", "Undervalued"], ["growth", "Growth"], ["dividend", "Dividend"], ["oversold", "Oversold"], ["volume", "Volume"]];
type Row = { symbol: string; companyName: string; recommendation: string; score: number; upside: number; risk: string; trend: string };

export default function Home() {
  const [view, setView] = useState<"dashboard" | "screener" | "watchlist">("dashboard");
  const [symbol, setSymbol] = useState("BBCA");
  const [query, setQuery] = useState("BBCA");
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState("riskReward");
  const [rows, setRows] = useState<Row[]>([]);
  const [watch, setWatch] = useState<Array<{ symbol: string; note?: string }>>([]);

  useEffect(() => { void loadAnalysis(symbol, timeframe); }, [symbol, timeframe]);
  useEffect(() => { void loadWatch(); }, []);
  useEffect(() => { if (view === "screener") void loadScreener(preset); }, [view, preset]);
  useEffect(() => {
    const ms = timeframe === "1D" ? 60000 : 300000;
    const timer = window.setInterval(() => { if (view === "dashboard") void loadAnalysis(symbol, timeframe); }, ms);
    return () => window.clearInterval(timer);
  }, [symbol, timeframe, view]);

  async function loadAnalysis(s: string, t: Timeframe) {
    setLoading(true); setError("");
    try { const r = await fetch(`/api/analyze?symbol=${encodeURIComponent(s)}&timeframe=${t}`); const j = await r.json(); if (!r.ok) throw new Error(j.error || "Analysis failed"); setAnalysis(j); }
    catch (e) { setError(e instanceof Error ? e.message : "Analysis failed"); }
    finally { setLoading(false); }
  }
  async function loadScreener(p: string) { const r = await fetch(`/api/screener?preset=${p}`); const j = await r.json(); setRows(j.rows || []); }
  async function loadWatch() { const r = await fetch("/api/watchlist"); const j = await r.json(); setWatch(j.items || []); }
  async function addWatch() { if (!analysis) return; await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol: analysis.symbol, note: analysis.recommendation }) }); await loadWatch(); }
  function submit(e: FormEvent) { e.preventDefault(); setSymbol(query.trim().toUpperCase() || "BBCA"); }
  const pick = (s: string) => { setQuery(s); setSymbol(s); setView("dashboard"); };

  return <div className="app"><aside className="side"><div className="brand">AI Stock Analyzer IDX</div><button className={`nav ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>Dashboard</button><button className={`nav ${view === "screener" ? "active" : ""}`} onClick={() => setView("screener")}>Screener</button><button className={`nav ${view === "watchlist" ? "active" : ""}`} onClick={() => setView("watchlist")}>Watchlist</button><div className="disc">This application is for educational and analytical purposes only. It is not financial advice. Users must do their own research before buying or selling stocks.</div></aside><main><form className="top" onSubmit={submit}><div className="search"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Type IDX stock: BBCA, BBRI, TLKM" /><button className="btn primary" disabled={loading}>Analyze</button></div><div className="chips">{timeframes.map(t => <button key={t} type="button" className={`chip ${timeframe === t ? "active" : ""}`} onClick={() => setTimeframe(t)}>{t}</button>)}</div><button type="button" className="btn" onClick={addWatch} disabled={!analysis}>Add Watch</button></form>{view === "dashboard" && <Dashboard analysis={analysis} loading={loading} error={error} />}{view === "screener" && <Screener rows={rows} preset={preset} setPreset={setPreset} onPick={pick} />}{view === "watchlist" && <Watchlist items={watch} onPick={pick} />}</main></div>;
}

function Dashboard({ analysis, loading, error }: { analysis: AnalysisResult | null; loading: boolean; error: string }) {
  if (loading) return <div className="panel loading">Loading public market data from the internet...</div>;
  if (error) return <div className="panel negative">{error}</div>;
  if (!analysis) return null;
  return <div className="grid"><section className="panel"><h2>{analysis.companyName} <span className="muted">({analysis.symbol})</span></h2><CandleChart candles={analysis.candles} currency={analysis.currency} /><p className="muted">Auto-refresh: 60 seconds on 1D, 5 minutes on longer timeframes.</p></section><section className="panel rec"><span className="muted">Recommendation</span><br /><strong className={tone(analysis.recommendation)}>{analysis.recommendation}</strong><div className="row"><span>Total score</span><span className="score">{analysis.totalScore}/100</span></div><div className="row"><span>Trend</span><span>{analysis.marketTrend}</span></div><p className="muted">{analysis.aiSummary}</p></section><div className="cards"><Panel title="Technical" score={analysis.technicalScore}>{analysis.technicalSignals.map(x => <div className="row" key={x.label}><span>{x.label}<br /><small className="muted">{x.explanation}</small></span><strong className={x.tone}>{x.value}</strong></div>)}</Panel><Panel title="Fundamental" score={analysis.fundamentalScore}>{Object.entries(analysis.fundamentals).map(([k, v]) => <div className="row" key={k}><span>{label(k)}</span><strong>{metric(v as number | null, k)}</strong></div>)}</Panel><Panel title="Fair Value" score={analysis.valuationScore}><div className="row"><span>Current</span><strong>{money(analysis.valuation.currentPrice, analysis.currency)}</strong></div><div className="row"><span>Fair value</span><strong>{money(analysis.valuation.fairValue, analysis.currency)}</strong></div><div className="row"><span>Upside/downside</span><strong className={analysis.valuation.upsideDownside >= 0 ? "positive" : "negative"}>{analysis.valuation.upsideDownside.toFixed(1)}%</strong></div><div className="row"><span>Risk</span><strong>{analysis.valuation.riskLevel}</strong></div></Panel><section className="panel"><h3>News Sentiment</h3>{analysis.news.map(n => <a className="news" href={n.url} key={n.title} target="_blank"><span>{n.title}<br /><small className="muted">{n.source}</small></span><strong className={n.sentiment === "positive" ? "positive" : n.sentiment === "negative" ? "negative" : "muted"}>{n.sentiment}</strong></a>)}</section><section className="panel"><h3>Strategy</h3>{Object.entries(analysis.strategy).map(([k, v]) => <div className="row" key={k}><span>{label(k)}</span><strong>{v}</strong></div>)}</section><section className="panel"><h3>Valuation Methods</h3>{analysis.valuation.methods.map(m => <div className="row" key={m.name}><span>{m.name}<br /><small className="muted">{m.explanation}</small></span><strong>{money(m.value, analysis.currency)}</strong></div>)}</section></div></div>;
}
function Panel({ title, score, children }: { title: string; score: number; children: React.ReactNode }) { return <section className="panel"><h3>{title} <span className="score">{score}/100</span></h3>{children}</section>; }
function Screener({ rows, preset, setPreset, onPick }: { rows: Row[]; preset: string; setPreset: (x: string) => void; onPick: (x: string) => void }) { return <section className="panel"><h2>IDX Stock Screener</h2><div className="chips">{presets.map(([v, t]) => <button key={v} className={`chip ${preset === v ? "active" : ""}`} onClick={() => setPreset(v)}>{t}</button>)}</div>{rows.length === 0 && <div className="loading">Loading screener...</div>}{rows.map(r => <button className="row nav" key={r.symbol} onClick={() => onPick(r.symbol)}><span><strong>{r.symbol}</strong> <span className="muted">{r.companyName}</span><br /><small>{r.trend} - {r.risk} risk</small></span><span><strong className={tone(r.recommendation)}>{r.recommendation}</strong><br /><small>{r.score}/100 - {r.upside.toFixed(1)}%</small></span></button>)}</section>; }
function Watchlist({ items, onPick }: { items: Array<{ symbol: string; note?: string }>; onPick: (x: string) => void }) { return <section className="panel"><h2>Watchlist</h2>{items.map(i => <button className="row nav" key={i.symbol} onClick={() => onPick(i.symbol)}><strong>{i.symbol}</strong><span className="muted">{i.note || "No note"}</span></button>)}</section>; }
function CandleChart({ candles, currency }: { candles: Candle[]; currency: string }) { const pts = useMemo(() => candles.slice(-120), [candles]); const w = 900, h = 380, p = 30, vh = 62; const max = Math.max(...pts.map(c => c.high)), min = Math.min(...pts.map(c => c.low)), maxV = Math.max(...pts.map(c => c.volume)); const y = (v: number) => p + ((max - v) / Math.max(max - min, .01)) * (h - p * 2 - vh); const cw = Math.max(3, (w - p * 2) / pts.length - 2); const last = pts.at(-1)?.close ?? 0; const ma = movingAverage(pts.map(x => x.close), 20); const first = ma.findIndex(x => x !== null); const path = ma.map((v, i) => v === null ? "" : `${i === first ? "M" : "L"} ${p + i * ((w - p * 2) / pts.length) + cw} ${y(v)}`).join(" "); return <div className="chart"><svg viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#0f161e" rx="8" />{[0, 1, 2, 3, 4].map(i => <line key={i} x1={p} x2={w - p} y1={p + i * ((h - p * 2) / 4)} y2={p + i * ((h - p * 2) / 4)} stroke="#22303d" />)}<path d={path} fill="none" stroke="#f0c45c" strokeWidth="2" />{pts.map((c, i) => { const x = p + i * ((w - p * 2) / pts.length) + cw / 2; const up = c.close >= c.open; const color = up ? "#38d996" : "#ff6575"; const by = y(Math.max(c.open, c.close)); const bh = Math.max(2, Math.abs(y(c.open) - y(c.close))); const bv = c.volume / Math.max(maxV, 1) * (vh - 10); return <g key={c.time}><line x1={x + cw / 2} x2={x + cw / 2} y1={y(c.high)} y2={y(c.low)} stroke={color} /><rect x={x} y={by} width={cw} height={bh} fill={color} /><rect x={x} y={h - p - bv} width={cw} height={bv} fill={color} opacity=".28" /></g>; })}<text x={p} y="24" fill="#92a3b5" fontSize="13">Last: {money(last, currency)}</text><text x={w - p - 220} y="24" fill="#92a3b5" fontSize="13">MA20, volume, candles</text></svg></div>; }
function tone(v: string) { return ["Buy", "Watchlist"].includes(v) ? "positive" : ["Sell", "Avoid"].includes(v) ? "negative" : "warning"; }
function money(v: number, c: string) { return `${c} ${Number.isFinite(v) ? v.toFixed(2) : "-"}`; }
function label(k: string) { return k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()); }
function metric(v: number | null, k: string) { if (v === null || !Number.isFinite(v)) return "N/A"; if (k.toLowerCase().includes("growth") || k === "roe" || k === "dividendYield") return `${v.toFixed(1)}%`; if (Math.abs(v) > 1e9) return `${(v / 1e9).toFixed(2)}B`; if (Math.abs(v) > 1e6) return `${(v / 1e6).toFixed(2)}M`; return v.toFixed(2); }
function movingAverage(values: number[], period: number) { return values.map((_, i) => i + 1 < period ? null : values.slice(i + 1 - period, i + 1).reduce((s, v) => s + v, 0) / period); }
