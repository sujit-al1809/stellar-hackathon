"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/components/WalletProvider";
import { Card, StatusBadge } from "@/components/ui";
import { Store, TrendingUp, Lock, Unlock, ArrowRight, Zap, Shield, Bot, Play } from "lucide-react";
import { submitExecution, getAllStrategyMetas, type StrategyMeta } from "@/lib/contract";
import Link from "next/link";

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { publicKey, signTx } = useWallet();
  const [strategies, setStrategies] = useState<StrategyMeta[]>([]);
  const [stakingStrategyId, setStakingStrategyId] = useState<number | null>(null);

  useEffect(() => {
    const allMetas = getAllStrategyMetas();
    setStrategies(Object.values(allMetas));
  }, []);

  const handleStake = async (strategyId: number) => {
    if (!publicKey || !signTx) {
      alert("Please connect your Freighter wallet first");
      return;
    }

    try {
      setStakingStrategyId(strategyId);
      const executionId = await submitExecution(publicKey, strategyId, signTx);
      router.push(`/app/execute?strategyId=${strategyId}&executionId=${executionId}`);
    } catch (err: any) {
      console.error("Stake error:", err);
      alert(err?.message || "Failed to stake on strategy");
    } finally {
      setStakingStrategyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* DEMO FLOW: Quick Action Banner */}
      <div className="bg-gradient-to-r from-lime-500/10 via-emerald-500/5 to-blue-500/10 border border-lime-500/30 p-4 clip-corner flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-lime-500/20 border border-lime-500/30 flex items-center justify-center">
            <Play className="w-5 h-5 text-lime-400 fill-lime-400" />
          </div>
          <div>
            <div className="text-xs text-lime-400 uppercase font-bold tracking-wider mb-0.5">Demo Flow: Step 2 of 6</div>
            <div className="text-sm text-zinc-400">Browse strategies or skip to AI Agent execution</div>
          </div>
        </div>
        <Link 
          href="/app/agents" 
          className="px-5 py-2.5 bg-lime-500 text-black font-bold uppercase text-xs hover:bg-lime-400 transition-all clip-corner flex items-center gap-2"
        >
          <Bot className="w-4 h-4" />
          Skip to AI Agents →
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
            <Store className="w-8 h-8 text-lime-400" />
            Strategy Marketplace
          </h1>
          <p className="text-zinc-500 text-sm max-w-2xl">
            Browse expert trading strategies • Stake 50 XLM (refundable) • Unlock rules • Execute on StellarX • Keep 80% of profits
          </p>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="!p-4 !border-blue-500/20 !bg-blue-500/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold text-blue-400 uppercase">StellarX Ready</h3>
          </div>
          <p className="text-xs text-zinc-500">
            One-click execution on Stellar's native DEX after staking
          </p>
        </Card>

        <Card className="!p-4 !border-lime-500/20 !bg-lime-500/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-lime-400" />
            </div>
            <h3 className="text-sm font-bold text-lime-400 uppercase">AI Agent Support</h3>
          </div>
          <p className="text-xs text-zinc-500">
            Deploy autonomous agents to execute 24/7 automatically
          </p>
        </Card>

        <Card className="!p-4 !border-emerald-500/20 !bg-emerald-500/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-emerald-400 uppercase">100% Refundable</h3>
          </div>
          <p className="text-xs text-zinc-500">
            Get your 50 XLM stake back regardless of profit or loss
          </p>
        </Card>
      </div>

      {/* Strategies Grid */}
      {strategies.length === 0 ? (
        <Card className="!p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Store className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-bold text-zinc-400 mb-2">No Strategies Available</h3>
          <p className="text-sm text-zinc-600 mb-6">
            Be the first expert to publish a trading strategy!
          </p>
          <button
            onClick={() => router.push("/app/create")}
            className="btn-primary inline-flex items-center gap-2"
          >
            Create Strategy <ArrowRight className="w-4 h-4" />
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => {
            // Check if this is user's own strategy
            // For demo: Assume traders can stake on all strategies
            // Experts can only stake on strategies they didn't create
            const isOwnStrategy = user?.role === "expert" && publicKey && publicKey === strategy.creatorAddress;

            return (
              <StrategyCard
                key={strategy.id}
                {...strategy}
                currentUserRole={user?.role}
                onStake={handleStake}
                isStaking={stakingStrategyId === strategy.id}
                isOwnStrategy={!!isOwnStrategy}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface StrategyCardProps extends StrategyMeta {
  currentUserRole?: string;
  onStake: (id: number) => void;
  isStaking: boolean;
  isOwnStrategy: boolean;
}

function StrategyCard({
  id,
  title,
  description,
  rules,
  stakeAmount,
  profitSharePercent,
  baseAsset,
  counterAsset,
  creatorAddress,
  currentUserRole,
  onStake,
  isStaking,
  isOwnStrategy,
}: StrategyCardProps) {
  return (
    <Card className="group hover:!border-lime-500/30 transition-all duration-300 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">
              #{String(id).padStart(3, "0")}
            </span>
            {baseAsset && counterAsset && (
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {baseAsset}/{counterAsset}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-zinc-100 group-hover:text-lime-400 transition-colors">
            {title}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-lime-500/30 transition-colors">
          <Lock className="w-5 h-5 text-zinc-600 group-hover:text-lime-400 transition-colors" />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{description}</p>

      {/* Strategy Preview (Locked) */}
      <div className="mb-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 relative overflow-hidden">
        <div className="text-xs text-zinc-600 mb-2 uppercase font-semibold">Strategy Rules</div>
        <div className="space-y-1 blur-sm select-none pointer-events-none">
          {rules.slice(0, 2).map((rule, i) => (
            <div key={i} className="text-xs text-zinc-500 flex items-start gap-2">
              <span className="text-lime-400 shrink-0">{i + 1}.</span>
              <span className="line-clamp-1">{rule}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
          <div className="text-center">
            <Lock className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <div className="text-xs font-bold text-amber-400 uppercase">Locked</div>
            <div className="text-[10px] text-zinc-500">Stake to unlock</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
        <div>
          <div className="text-xs text-zinc-600 mb-1">Stake Required</div>
          <div className="text-base font-bold text-lime-400">{stakeAmount || 50} XLM</div>
          <div className="text-[10px] text-zinc-600">100% refundable</div>
        </div>
        <div>
          <div className="text-xs text-zinc-600 mb-1">Profit Share</div>
          <div className="text-base font-bold text-blue-400">{profitSharePercent || 20}%</div>
          <div className="text-[10px] text-zinc-600">You keep {100 - (profitSharePercent || 20)}%</div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-auto">
        {isOwnStrategy ? (
          <div className="w-full py-3 text-center text-sm text-zinc-600 bg-zinc-900/50 border border-zinc-800 clip-corner">
            Your Strategy
          </div>
        ) : (
          <button
            onClick={() => onStake(id)}
            disabled={isStaking}
            className="relative group/btn w-full py-3 bg-lime-400 text-black font-bold uppercase tracking-wider text-sm hover:bg-lime-300 transition-all clip-corner flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            {/* Corner accents */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-black/20" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-black/20" />

            {isStaking ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Staking...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-black" />
                Stake {stakeAmount || 50} XLM & Unlock
              </>
            )}
          </button>
        )}
      </div>

      {/* StellarX Badge */}
      {baseAsset && counterAsset && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-blue-400">
          <TrendingUp className="w-3 h-3" />
          <span>StellarX {baseAsset}/{counterAsset} ready after stake</span>
        </div>
      )}
    </Card>
  );
}
