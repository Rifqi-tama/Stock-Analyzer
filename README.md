# AI Stock Analysis App

A web-based stock analysis dashboard built with Next.js, API routes, Tailwind CSS, and optional OpenAI/Supabase integrations. It analyzes a ticker with near real-time market data, technical indicators, fundamentals, valuation, news sentiment, recommendations, strategy, a screener, and a watchlist.

## Features

- Search any supported stock symbol, including Yahoo-style suffixes such as `BBCA.JK`.
- Candlestick chart with multiple timeframes: `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `5Y`.
- Technical analysis: SMA, EMA, RSI, MACD, Bollinger Bands, Fibonacci level, support/resistance, volume, breakout/breakdown, and candlestick pattern signals.
- Fundamental analysis: revenue, net profit, EPS, PER, PBV, ROE, debt, debt/equity, cash flow, growth, and dividends when available.
- Fair value estimate using PER, PBV, simplified cash-flow proxy, and historical momentum value.
- News sentiment with Finnhub when `FINNHUB_API_KEY` is configured.
- Recommendation engine: Buy, Hold, Sell, Watchlist, or Avoid.
- Strategy panel with entry area, stop loss, take profits, timeframe, risk, sizing, and invalidation.
- Screener presets for uptrend, breakout, undervalued, growth, dividend, oversold rebound, volume accumulation, and risk/reward.
- Watchlist API with Supabase REST support and an in-memory fallback for local demos.
- Beginner-friendly explanation, optionally enhanced by OpenAI.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Add keys as needed:

```bash
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini
FINNHUB_API_KEY=your_finnhub_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Data Sources

- Chart data: Yahoo Finance chart endpoint through the server API route.
- Fundamentals: Yahoo Finance quote summary when available.
- News: Finnhub company news when `FINNHUB_API_KEY` is set.
- AI explanation: OpenAI Responses API when `OPENAI_API_KEY` is set.
- Watchlist database: Supabase REST when Supabase environment variables are set.

The app degrades gracefully when optional keys are missing. For example, news will show a setup note instead of failing the whole analysis.

## Supabase Watchlist

Run `supabase/schema.sql` in your Supabase SQL editor. Keep the service role key only on the server. Do not expose it with `NEXT_PUBLIC_`.

For production, replace the demo-wide watchlist policies with user-based RLS policies tied to authenticated users.

## Important Disclaimer

This application is for educational and analytical purposes only. It is not financial advice. Users must do their own research before buying or selling stocks.

## Notes

The recommendation engine combines technical score, fundamental score, valuation score, news sentiment, risk/reward, and market trend. It is designed to explain reasoning and invalidation points rather than produce blind buy/sell calls.
