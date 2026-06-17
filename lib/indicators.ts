import type { Candle } from "./types";

export function sma(values: number[], period: number) {
  return values.map((_, i) => i + 1 < period ? null : values.slice(i + 1 - period, i + 1).reduce((s, v) => s + v, 0) / period);
}
export function ema(values: number[], period: number) {
  const k = 2 / (period + 1); let prev: number | null = null;
  return values.map((v, i) => { if (i + 1 < period) return null; if (prev === null) prev = values.slice(0, period).reduce((s, x) => s + x, 0) / period; else prev = v * k + prev * (1 - k); return prev; });
}
export function rsi(values: number[], period = 14) {
  if (values.length <= period) return 50; let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length; i++) { const d = values[i] - values[i - 1]; if (d >= 0) gains += d; else losses += Math.abs(d); }
  if (losses === 0) return 100; const rs = gains / losses; return 100 - 100 / (1 + rs);
}
export function macd(values: number[]) {
  const a = ema(values, 12), b = ema(values, 26); const line = values.map((_, i) => a[i] !== null && b[i] !== null ? (a[i] as number) - (b[i] as number) : null);
  const valid = line.filter((v): v is number => v !== null); const sig = ema(valid, 9).filter((v): v is number => v !== null).at(-1) ?? 0; const m = valid.at(-1) ?? 0; return { macdLine: m, signal: sig, histogram: m - sig };
}
export function bollinger(values: number[], period = 20) {
  const x = values.slice(-period); const mid = x.reduce((s, v) => s + v, 0) / Math.max(x.length, 1); const variance = x.reduce((s, v) => s + Math.pow(v - mid, 2), 0) / Math.max(x.length, 1); const dev = Math.sqrt(variance); return { upper: mid + dev * 2, middle: mid, lower: mid - dev * 2 };
}
export function supportResistance(candles: Candle[]) {
  const recent = candles.slice(-80); const lows = recent.map(c => c.low).sort((a, b) => a - b); const highs = recent.map(c => c.high).sort((a, b) => a - b); return { support: lows[Math.floor(lows.length * .18)] ?? 0, resistance: highs[Math.floor(highs.length * .82)] ?? 0 };
}
export function volumeSignal(candles: Candle[]) {
  const recent = candles.slice(-20); const avg = recent.reduce((s, c) => s + c.volume, 0) / Math.max(recent.length, 1); const latest = candles.at(-1)?.volume ?? 0; return { latest, average: avg, ratio: avg ? latest / avg : 1 };
}
export function detectPattern(candles: Candle[]) {
  const a = candles.at(-1), b = candles.at(-2); if (!a || !b) return "No clear pattern"; const body = Math.abs(a.close - a.open); const range = Math.max(a.high - a.low, .01); if (body / range < .18) return "Doji"; if (a.close > a.open && b.close < b.open && a.close > b.open && a.open < b.close) return "Bullish engulfing"; if (a.close < a.open && b.close > b.open && a.open > b.close && a.close < b.open) return "Bearish engulfing"; return a.close >= a.open ? "Bullish candle" : "Bearish candle";
}
