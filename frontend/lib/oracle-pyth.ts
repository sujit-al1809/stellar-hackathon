// ============================================================
// Pyth Network Oracle Integration
// Real-time price feeds for trading verification
// ============================================================

import * as StellarSdk from "@stellar/stellar-sdk";

/**
 * Pyth Price Feed IDs (these are constant across chains)
 * Find more at: https://pyth.network/developers/price-feed-ids
 */
export const PYTH_PRICE_FEEDS = {
  // Crypto
  BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  SOL_USD: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  XLM_USD: "0xb7a8eba68a997cd0210c2e1e4ee811ad2d174b3611c22d9ebf16f4cb7e9ba850",

  // Stablecoins
  USDC_USD: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  USDT_USD: "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",

  // Stocks (if available on Pyth)
  AAPL_USD: "0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
  TSLA_USD: "0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1",
};

/**
 * Pyth API endpoints
 */
const PYTH_API_URL = "https://hermes.pyth.network"; // Pyth price data is cross-chain, always use mainnet Hermes

/**
 * Get current price from Pyth
 */
export async function getPythPrice(
  feedId: string,
  _testnet: boolean = true // kept for backward compat, ignored — Hermes mainnet serves all chains
): Promise<{
  price: number;
  confidence: number;
  timestamp: number;
  expo: number;
}> {
  const baseUrl = PYTH_API_URL;

  try {
    // Try Hermes v2 API first (current)
    const cleanFeedId = feedId.startsWith("0x") ? feedId.slice(2) : feedId;
    let response = await fetch(
      `${baseUrl}/v2/updates/price/latest?ids[]=${cleanFeedId}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      // Fallback to v1 API format
      response = await fetch(
        `${baseUrl}/api/latest_price_feeds?ids[]=${feedId}`,
        { signal: AbortSignal.timeout(5000) }
      );
    }

    if (!response.ok) {
      throw new Error(`Pyth API returned ${response.status}`);
    }

    const data = await response.json();

    // v2 format: { parsed: [{ price: { price, conf, expo, publish_time } }] }
    // v1 format: [ { price: { price, conf, expo, publish_time } } ]
    let priceData;
    if (data.parsed) {
      // v2 response
      priceData = data.parsed[0]?.price;
    } else if (Array.isArray(data)) {
      // v1 response
      priceData = data[0]?.price;
    }

    if (!priceData) {
      throw new Error("No price data in Pyth response");
    }

    // Pyth returns price with exponent (e.g., price=4500000, expo=-2 = $45,000.00)
    const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo);
    const confidence = parseFloat(priceData.conf) * Math.pow(10, priceData.expo);

    return {
      price,
      confidence,
      timestamp: priceData.publish_time,
      expo: priceData.expo,
    };
  } catch (error: any) {
    // Only log a short warning instead of full stack trace
    console.warn(`[Oracle] Pyth fetch failed: ${error.message || error}`);
    throw error;
  }
}

/**
 * Get historical price at specific timestamp
 */
export async function getPythPriceAtTime(
  feedId: string,
  timestamp: number,
  _testnet: boolean = true
): Promise<{
  price: number;
  confidence: number;
  timestamp: number;
}> {
  const baseUrl = PYTH_API_URL;

  try {
    // Use v2 endpoint: /v2/updates/price/{publish_time}
    const cleanFeedId = feedId.startsWith("0x") ? feedId.slice(2) : feedId;
    const response = await fetch(
      `${baseUrl}/v2/updates/price/${timestamp}?ids[]=${cleanFeedId}&parsed=true`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch historical Pyth price");
    }

    const data = await response.json();
    const priceData = data.parsed?.[0]?.price || data[0]?.price;

    if (!priceData) {
      throw new Error("No historical price data in Pyth response");
    }

    const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo);
    const confidence = parseFloat(priceData.conf) * Math.pow(10, priceData.expo);

    return {
      price,
      confidence,
      timestamp: priceData.publish_time,
    };
  } catch (error: any) {
    console.warn(`[Oracle] Pyth historical price failed: ${error.message || error}`);
    throw error;
  }
}

/**
 * Verify trading claim against Pyth oracle
 * Example: "I bought BTC at $45,000 on 2024-02-07 10:30am"
 */
export async function verifyTradingClaim(
  asset: string,
  claimedPrice: number,
  timestamp: number,
  tolerancePercent: number = 2
): Promise<{
  valid: boolean;
  oraclePrice: number;
  claimedPrice: number;
  difference: number;
  differencePercent: number;
  withinTolerance: boolean;
  reason: string;
}> {
  try {
    // Get feed ID for asset
    const feedId = PYTH_PRICE_FEEDS[asset as keyof typeof PYTH_PRICE_FEEDS];

    if (!feedId) {
      throw new Error(`No Pyth feed for ${asset}`);
    }

    // Get oracle price at claimed timestamp
    const oracleData = await getPythPriceAtTime(feedId, timestamp);
    const oraclePrice = oracleData.price;

    // Calculate difference
    const difference = Math.abs(oraclePrice - claimedPrice);
    const differencePercent = (difference / oraclePrice) * 100;
    const withinTolerance = differencePercent <= tolerancePercent;

    return {
      valid: withinTolerance,
      oraclePrice,
      claimedPrice,
      difference,
      differencePercent,
      withinTolerance,
      reason: withinTolerance
        ? `Price verified within ${tolerancePercent}% tolerance`
        : `Price differs by ${differencePercent.toFixed(2)}% - exceeds ${tolerancePercent}% tolerance`,
    };
  } catch (error: any) {
    return {
      valid: false,
      oraclePrice: 0,
      claimedPrice,
      difference: 0,
      differencePercent: 0,
      withinTolerance: false,
      reason: `Verification failed: ${error.message}`,
    };
  }
}

/**
 * Get multiple prices at once
 */
export async function getBatchPrices(
  feedIds: string[],
  _testnet: boolean = true
): Promise<Map<string, number>> {
  const baseUrl = PYTH_API_URL;
  const idsParam = feedIds
    .map((id) => `ids[]=${id.startsWith("0x") ? id.slice(2) : id}`)
    .join("&");

  try {
    const response = await fetch(
      `${baseUrl}/v2/updates/price/latest?${idsParam}&parsed=true`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`Pyth batch API returned ${response.status}`);
    }

    const data = await response.json();
    const prices = new Map<string, number>();

    const feeds = data.parsed || data;
    if (Array.isArray(feeds)) {
      feeds.forEach((feed: any) => {
        const priceObj = feed.price || feed;
        const price =
          parseFloat(priceObj.price) * Math.pow(10, priceObj.expo);
        prices.set(feed.id, price);
      });
    }

    return prices;
  } catch (error: any) {
    console.warn(`[Oracle] Pyth batch fetch failed: ${error.message || error}`);
    return new Map();
  }
}

/**
 * Subscribe to real-time price updates (WebSocket)
 */
export function subscribeToPriceUpdates(
  feedId: string,
  onPriceUpdate: (price: number, timestamp: number) => void
): () => void {
  // Pyth WebSocket streaming
  const ws = new WebSocket("wss://hermes.pyth.network/ws");

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: "subscribe",
        ids: [feedId],
      })
    );
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "price_update") {
      const priceData = data.price_feed.price;
      const price =
        parseFloat(priceData.price) * Math.pow(10, priceData.expo);
      onPriceUpdate(price, priceData.publish_time);
    }
  };

  ws.onerror = (error) => {
    console.error("Pyth WebSocket error:", error);
  };

  // Return cleanup function
  return () => {
    ws.close();
  };
}

/**
 * Helper: Convert asset symbol to Pyth feed ID
 */
export function getAssetFeedId(symbol: string): string | undefined {
  const normalized = symbol.toUpperCase().replace("/", "_");
  return PYTH_PRICE_FEEDS[normalized as keyof typeof PYTH_PRICE_FEEDS];
}

/**
 * Demo function - get current BTC price
 */
export async function getCurrentBTCPrice(): Promise<number> {
  const data = await getPythPrice(PYTH_PRICE_FEEDS.BTC_USD);
  return data.price;
}
