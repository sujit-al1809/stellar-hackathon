// ============================================================
// Custom Oracle - Simple price feed aggregator
// Fetches from multiple sources and aggregates
// ============================================================

/**
 * Fetch price from CoinGecko API (free, no auth)
 */
export async function getCoinGeckoPrice(
  coinId: string,
  vsCurrency: string = "usd"
): Promise<number> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API returned ${response.status}`);
    }

    const data = await response.json();
    if (!data[coinId] || data[coinId][vsCurrency] === undefined) {
      throw new Error(`CoinGecko: no price for ${coinId}`);
    }
    return data[coinId][vsCurrency];
  } catch (error: any) {
    console.warn(`[Oracle] CoinGecko failed: ${error.message || error}`);
    throw error;
  }
}

/**
 * Fetch price from Binance API (free, real-time)
 */
export async function getBinancePrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`Binance API returned ${response.status}`);
    }

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error: any) {
    console.warn(`[Oracle] Binance failed: ${error.message || error}`);
    throw error;
  }
}

/**
 * Fetch historical price from CoinGecko
 */
export async function getHistoricalPrice(
  coinId: string,
  timestamp: number
): Promise<number> {
  try {
    // Convert timestamp to date string
    const date = new Date(timestamp * 1000);
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${dateStr}`
    );

    if (!response.ok) {
      throw new Error("Historical price fetch failed");
    }

    const data = await response.json();
    return data.market_data.current_price.usd;
  } catch (error) {
    console.error("Historical price error:", error);
    throw error;
  }
}

/**
 * Aggregate price from multiple sources (more reliable)
 */
export async function getAggregatedPrice(
  asset: string
): Promise<{
  price: number;
  sources: { name: string; price: number }[];
  variance: number;
}> {
  const prices: { name: string; price: number }[] = [];

  // Map asset symbol to correct API identifiers
  const mapping = getSymbolMapping(asset.toUpperCase()) || {
    coingecko: asset.toLowerCase(),
    binance: `${asset.toUpperCase()}USDT`,
  };

  // Try multiple sources
  try {
    const coinGeckoPrice = await getCoinGeckoPrice(mapping.coingecko);
    prices.push({ name: "CoinGecko", price: coinGeckoPrice });
  } catch (e) {
    // already logged in getCoinGeckoPrice
  }

  try {
    const binanceSymbol = mapping.binance;
    const binancePrice = await getBinancePrice(binanceSymbol);
    prices.push({ name: "Binance", price: binancePrice });
  } catch (e) {
    console.warn("Binance failed");
  }

  if (prices.length === 0) {
    throw new Error("No price sources available");
  }

  // Calculate average
  const sum = prices.reduce((acc, p) => acc + p.price, 0);
  const avgPrice = sum / prices.length;

  // Calculate variance (how much sources disagree)
  const variance =
    prices.reduce((acc, p) => acc + Math.abs(p.price - avgPrice), 0) /
    prices.length;

  return {
    price: avgPrice,
    sources: prices,
    variance,
  };
}

/**
 * Verify trade price against oracle with tolerance
 */
export async function verifyTradePrice(
  asset: string,
  claimedPrice: number,
  tolerancePercent: number = 5
): Promise<{
  valid: boolean;
  oraclePrice: number;
  difference: number;
  differencePercent: number;
  sources: { name: string; price: number }[];
}> {
  try {
    const oracleData = await getAggregatedPrice(asset);
    const oraclePrice = oracleData.price;

    const difference = Math.abs(oraclePrice - claimedPrice);
    const differencePercent = (difference / oraclePrice) * 100;

    return {
      valid: differencePercent <= tolerancePercent,
      oraclePrice,
      difference,
      differencePercent,
      sources: oracleData.sources,
    };
  } catch (error) {
    console.error("Price verification error:", error);
    return {
      valid: false,
      oraclePrice: 0,
      difference: 0,
      differencePercent: 0,
      sources: [],
    };
  }
}

/**
 * Symbol mapping (common formats to API formats)
 */
const SYMBOL_MAP: Record<string, { coingecko: string; binance: string }> = {
  BTC: { coingecko: "bitcoin", binance: "BTCUSDT" },
  ETH: { coingecko: "ethereum", binance: "ETHUSDT" },
  SOL: { coingecko: "solana", binance: "SOLUSDT" },
  XLM: { coingecko: "stellar", binance: "XLMUSDT" },
  USDC: { coingecko: "usd-coin", binance: "USDCUSDT" },
  USDT: { coingecko: "tether", binance: "USDTUSDT" },
};

export function getSymbolMapping(symbol: string) {
  return SYMBOL_MAP[symbol.toUpperCase()];
}
