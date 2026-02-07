"use client";

import React, { useState, useEffect } from "react";
import { getCurrentBTCPrice, getPythPrice, PYTH_PRICE_FEEDS } from "@/lib/oracle-pyth";

interface LivePriceOracleProps {
  asset: string; // e.g., "BTC", "ETH", "SOL"
  showConfidence?: boolean;
  updateInterval?: number; // ms
}

export function LivePriceOracle({
  asset,
  showConfidence = false,
  updateInterval = 5000, // 5 seconds
}: LivePriceOracleProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setError(null);

        // Get feed ID for asset
        const feedId = PYTH_PRICE_FEEDS[`${asset.toUpperCase()}_USD` as keyof typeof PYTH_PRICE_FEEDS];

        if (!feedId) {
          // Fallback to API
          const response = await fetch(`/api/oracle/price?asset=${asset}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to fetch price");
          }

          setPrice(data.price);
          setLastUpdate(new Date());
          setLoading(false);
          return;
        }

        // Use Pyth directly
        const pythData = await getPythPrice(feedId, true);
        setPrice(pythData.price);
        setConfidence(pythData.confidence);
        setLastUpdate(new Date(pythData.timestamp * 1000));
        setLoading(false);
      } catch (err: any) {
        console.error("Price fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPrice();

    // Set up polling
    const interval = setInterval(fetchPrice, updateInterval);

    return () => clearInterval(interval);
  }, [asset, updateInterval]);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
        <div className="w-3 h-3 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-zinc-500">Loading price...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
        <span className="text-xs text-red-400">⚠️ {error}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border border-lime-500/20">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
        <span className="text-xs text-zinc-500 font-medium">LIVE</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold text-lime-400 font-mono">
          ${price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-xs text-zinc-600 font-medium">{asset.toUpperCase()}</span>
      </div>

      {showConfidence && confidence && (
        <div className="text-xs text-zinc-600">
          ±${confidence.toFixed(2)}
        </div>
      )}

      {lastUpdate && (
        <div className="text-xs text-zinc-700">
          {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

/**
 * Component to verify a claimed price against oracle
 */
interface PriceVerificationProps {
  asset: string;
  claimedPrice: number;
  timestamp?: number;
  tolerancePercent?: number;
}

export function PriceVerification({
  asset,
  claimedPrice,
  timestamp,
  tolerancePercent = 2,
}: PriceVerificationProps) {
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await fetch("/api/oracle/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asset,
            claimedPrice,
            timestamp,
            tolerancePercent,
          }),
        });

        const data = await response.json();
        setVerification(data);
        setLoading(false);
      } catch (error) {
        console.error("Verification error:", error);
        setLoading(false);
      }
    };

    verify();
  }, [asset, claimedPrice, timestamp, tolerancePercent]);

  if (loading) {
    return (
      <div className="text-xs text-zinc-500">
        Verifying price against oracle...
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  return (
    <div
      className={`p-3 rounded-lg border ${
        verification.valid
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-red-500/10 border-red-500/20"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-lg ${verification.valid ? "text-emerald-400" : "text-red-400"}`}>
          {verification.valid ? "✓" : "✗"}
        </span>
        <span className={`text-sm font-medium ${verification.valid ? "text-emerald-400" : "text-red-400"}`}>
          {verification.valid ? "Price Verified" : "Price Discrepancy"}
        </span>
      </div>

      <div className="space-y-1 text-xs text-zinc-400">
        <div className="flex justify-between">
          <span>Claimed Price:</span>
          <span className="font-mono">${claimedPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Oracle Price:</span>
          <span className="font-mono">${verification.oraclePrice?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Difference:</span>
          <span className="font-mono">
            {verification.differencePercent?.toFixed(2)}%
          </span>
        </div>
      </div>

      {verification.reason && (
        <div className="mt-2 text-xs text-zinc-500">
          {verification.reason}
        </div>
      )}
    </div>
  );
}

/**
 * Multi-asset price ticker
 */
export function PriceTicker({ assets = ["BTC", "ETH", "SOL", "XLM"] }: { assets?: string[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {assets.map((asset) => (
        <LivePriceOracle key={asset} asset={asset} />
      ))}
    </div>
  );
}
