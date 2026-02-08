"use client";

import React from "react";
import { ExternalLink, TrendingUp, ArrowRight } from "lucide-react";
import { Card } from "./ui";

interface StellarXIntegrationProps {
  strategyRules?: string[];
  baseAsset?: string;
  counterAsset?: string;
}

export function StellarXIntegration({
  strategyRules = [],
  baseAsset = "BTC",
  counterAsset = "USDC"
}: StellarXIntegrationProps) {

  // Map common assets to Stellar native assets for StellarX
  const assetMap: Record<string, string> = {
    "BTC": "BTC",
    "ETH": "ETH",
    "USDC": "USDC",
    "USDT": "USDT",
    "XLM": "XLM",
    "SOL": "SOL",
    "AQUA": "AQUA",
    "yXLM": "yXLM"
  };

  // Use StellarX swap page - more reliable than trying to construct exact market URLs
  // Users can select their trading pair on StellarX
  const stellarXUrl = "https://www.stellarx.com/swap";

  // For demo: Show which pair they should trade
  const tradingPair = `${assetMap[baseAsset] || baseAsset}/${assetMap[counterAsset] || counterAsset}`;

  return (
    <Card className="!border-blue-500/30 !bg-blue-500/5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6 text-blue-400" />
        </div>

        <div className="flex-1">
          <h3 className="text-base font-bold text-blue-400 mb-2 flex items-center gap-2">
            Execute on StellarX DEX
            <ExternalLink className="w-4 h-4" />
          </h3>

          <p className="text-sm text-zinc-400 mb-4">
            Execute this strategy on StellarX - Stellar's premier decentralized exchange.
            Fast, secure, and low-cost trading with deep liquidity.
          </p>

          {/* Trading Pair Info */}
          <div className="mb-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="text-xs text-zinc-500 mb-2">Recommended Trading Pair</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-100">{baseAsset}</span>
              <ArrowRight className="w-4 h-4 text-zinc-600" />
              <span className="text-lg font-bold text-zinc-100">{counterAsset}</span>
            </div>
            <div className="text-xs text-zinc-600 mt-2">
              Select this pair on StellarX to follow the strategy
            </div>
          </div>

          {/* Strategy Rules Preview */}
          {strategyRules.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-zinc-500 mb-2">Strategy Rules to Follow</div>
              <div className="space-y-1">
                {strategyRules.slice(0, 2).map((rule, i) => (
                  <div key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                    <span className="text-lime-400">✓</span>
                    <span>{rule}</span>
                  </div>
                ))}
                {strategyRules.length > 2 && (
                  <div className="text-xs text-zinc-600">
                    +{strategyRules.length - 2} more rules...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <a
              href={stellarXUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center justify-center gap-2 !py-3 !px-5 group"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-bold">Trade on StellarX DEX</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:translate-y-[-2px] transition-transform" />
            </a>

            <div className="text-xs text-center text-zinc-600 bg-zinc-900/30 border border-zinc-800/50 rounded px-3 py-2">
              💡 <span className="text-zinc-500">After opening, select <span className="text-blue-400 font-mono">{tradingPair}</span> pair to trade</span>
            </div>
          </div>

          {/* Features */}
          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <div className="text-xs text-zinc-600 mb-3">Why Trade on StellarX?</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-500 mt-1 shrink-0" />
                <div><span className="text-zinc-300">Lightning fast</span> - Trades settle in 3-5 seconds</div>
              </div>
              <div className="flex items-start gap-2 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-500 mt-1 shrink-0" />
                <div><span className="text-zinc-300">Ultra low fees</span> - ~$0.00001 per trade on Stellar</div>
              </div>
              <div className="flex items-start gap-2 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-500 mt-1 shrink-0" />
                <div><span className="text-zinc-300">Non-custodial</span> - You control your keys</div>
              </div>
              <div className="flex items-start gap-2 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-500 mt-1 shrink-0" />
                <div><span className="text-zinc-300">Built on Stellar</span> - Native DEX integration</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
