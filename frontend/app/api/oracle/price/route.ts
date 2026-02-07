// ============================================================
// Oracle Price API
// Fetch current and historical prices for verification
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getPythPrice, verifyTradingClaim, PYTH_PRICE_FEEDS } from "@/lib/oracle-pyth";
import { getAggregatedPrice, verifyTradePrice } from "@/lib/oracle-custom";

/**
 * GET /api/oracle/price?asset=BTC&timestamp=1234567890
 * Returns current or historical price
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const asset = searchParams.get("asset")?.toUpperCase();
    const timestamp = searchParams.get("timestamp");

    if (!asset) {
      return NextResponse.json(
        { error: "Asset parameter required" },
        { status: 400 }
      );
    }

    // Try Pyth first (faster, more reliable)
    try {
      const pythFeedId = PYTH_PRICE_FEEDS[`${asset}_USD` as keyof typeof PYTH_PRICE_FEEDS];

      if (pythFeedId) {
        const pythData = await getPythPrice(pythFeedId, true); // testnet
        return NextResponse.json({
          source: "pyth",
          asset,
          price: pythData.price,
          confidence: pythData.confidence,
          timestamp: pythData.timestamp,
        });
      }
    } catch (error) {
      console.warn("Pyth failed, falling back to custom oracle");
    }

    // Fallback to custom oracle (CoinGecko + Binance)
    const customData = await getAggregatedPrice(asset.toLowerCase());

    return NextResponse.json({
      source: "aggregated",
      asset,
      price: customData.price,
      sources: customData.sources,
      variance: customData.variance,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    console.error("Oracle price error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch price" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/oracle/verify
 * Verify a trading claim against oracle
 * Body: { asset, claimedPrice, timestamp, tolerancePercent }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset, claimedPrice, timestamp, tolerancePercent = 2 } = body;

    if (!asset || !claimedPrice) {
      return NextResponse.json(
        { error: "Asset and claimedPrice required" },
        { status: 400 }
      );
    }

    // Try Pyth verification (best for timestamp accuracy)
    if (timestamp) {
      try {
        const pythFeedId = PYTH_PRICE_FEEDS[`${asset.toUpperCase()}_USD` as keyof typeof PYTH_PRICE_FEEDS];

        if (pythFeedId) {
          const verification = await verifyTradingClaim(
            asset.toUpperCase(),
            claimedPrice,
            timestamp,
            tolerancePercent
          );

          return NextResponse.json({
            source: "pyth",
            ...verification,
          });
        }
      } catch (error) {
        console.warn("Pyth verification failed, using current price");
      }
    }

    // Fallback to current price verification
    const verification = await verifyTradePrice(
      asset.toLowerCase(),
      claimedPrice,
      tolerancePercent
    );

    return NextResponse.json({
      source: "aggregated",
      ...verification,
    });
  } catch (error: any) {
    console.error("Oracle verification error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
