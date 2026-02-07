"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, Spinner, StatusBadge, EmptyState } from "@/components/ui";
import { useWallet } from "@/components/WalletProvider";
import {
  getStrategy,
  getExecution,
  getAllStrategyMetas,
  getAllExecutionMetas,
  submitExecution,
  type StrategyMeta,
  type OnChainStrategy,
} from "@/lib/contract";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  ArrowUpRight,
  Coins,
  User,
  FileText,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  Eye,
  Flame,
  Users,
  Activity,
} from "lucide-react";

// ── Types ────────────────────────────────────────────
interface MarketplaceStrategy {
  id: number;
  meta: StrategyMeta | null;
  chain: OnChainStrategy | null;
  executionCount: number;
  hasMyExecution: boolean;
}

type SortOption = "newest" | "reward-high" | "reward-low" | "most-executed";
type FilterStatus = "all" | "active" | "completed";

export default function MarketplacePage() {
  const { publicKey, signTx } = useWallet();
  const router = useRouter();

  const [strategies, setStrategies] = useState<MarketplaceStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [stakingStrategyId, setStakingStrategyId] = useState<number | null>(null);

  // ── Load strategies from local meta + on-chain ──
  const loadStrategies = useCallback(async () => {
    const metas = getAllStrategyMetas();
    const execMetas = getAllExecutionMetas();
    const metaIds = Object.keys(metas).map(Number).sort((a, b) => b - a);

    if (metaIds.length === 0) {
      // Try probing on-chain IDs 1-30 to discover strategies
      const probeIds: number[] = [];
      for (let i = 1; i <= 30; i++) probeIds.push(i);
      const probed = await Promise.allSettled(
        probeIds.map(async (id) => {
          const chain = await getStrategy(id);
          if (chain) return { id, chain };
          return null;
        })
      );
      for (const r of probed) {
        if (r.status === "fulfilled" && r.value) {
          metaIds.push(r.value.id);
          // We don't have meta for these, they'll show with chain data only
        }
      }
    }

    // Deduplicate and also probe some extras beyond known metas
    const allIds = new Set(metaIds);
    const maxKnown = metaIds.length > 0 ? Math.max(...metaIds) : 0;
    for (let i = 1; i <= Math.max(maxKnown + 5, 10); i++) allIds.add(i);

    const results: MarketplaceStrategy[] = [];

    await Promise.allSettled(
      Array.from(allIds).map(async (id) => {
        const chain = await getStrategy(id);
        if (!chain) return; // doesn't exist on-chain

        const meta = metas[id] || null;

        // Count executions for this strategy
        let executionCount = 0;
        let hasMyExecution = false;
        for (const exec of Object.values(execMetas)) {
          if (exec.strategyId === id) {
            executionCount++;
            if (publicKey && exec.executorAddress === publicKey) {
              hasMyExecution = true;
            }
          }
        }

        results.push({ id, meta, chain, executionCount, hasMyExecution });
      })
    );

    // Sort by ID descending (newest first) as default
    results.sort((a, b) => b.id - a.id);

    setStrategies(results);
  }, [publicKey]);

  useEffect(() => {
    setLoading(true);
    loadStrategies().finally(() => setLoading(false));
  }, [loadStrategies]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStrategies();
    setRefreshing(false);
  };

  // ── Filter & Sort ──
  const filtered = strategies
    .filter((s) => {
      // Status filter
      if (filterStatus === "active" && !s.chain?.active) return false;
      if (filterStatus === "completed" && s.chain?.active) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = s.meta?.title?.toLowerCase() || "";
        const desc = s.meta?.description?.toLowerCase() || "";
        const idStr = `#${s.id}`;
        if (!title.includes(q) && !desc.includes(q) && !idStr.includes(q)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.id - a.id;
        case "reward-high":
          return (b.chain?.reward_amount || 0) - (a.chain?.reward_amount || 0);
        case "reward-low":
          return (a.chain?.reward_amount || 0) - (b.chain?.reward_amount || 0);
        case "most-executed":
          return b.executionCount - a.executionCount;
        default:
          return 0;
      }
    });

  const activeCount = strategies.filter((s) => s.chain?.active).length;
  const totalReward = strategies.reduce((sum, s) => sum + (s.chain?.reward_amount || 0), 0);

  // ── Handle direct staking from marketplace ──
  const handleStake = async (strategyId: number) => {
    console.log("[StratFlow] handleStake called for strategy:", strategyId);

    if (!publicKey) {
      alert("Please connect your wallet first (click the Connect button in the sidebar).");
      return;
    }
    if (!signTx) {
      alert("Wallet signing not available. Make sure Freighter extension is installed and enabled.");
      return;
    }

    try {
      setStakingStrategyId(strategyId);
      console.log("[StratFlow] Calling submitExecution with publicKey:", publicKey, "strategyId:", strategyId);
      const executionId = await submitExecution(publicKey, strategyId, signTx);
      console.log("[StratFlow] submitExecution returned executionId:", executionId);

      // Redirect to execute page with executionId to show unlocked strategy
      router.push(`/app/execute?strategyId=${strategyId}&executionId=${executionId}`);
    } catch (err: any) {
      console.error("[StratFlow] Stake failed:", err);
      const msg = err?.message || "Unknown error";
      if (msg.includes("User declined")) {
        // User cancelled in Freighter — don't show error
        console.log("[StratFlow] User cancelled Freighter signing");
      } else if (msg.includes("Account not found") || msg.includes("getAccount")) {
        alert("Your wallet account is not funded on Stellar Testnet. Visit friendbot.stellar.org to get test XLM.");
      } else if (msg.includes("simulate") || msg.includes("prepare")) {
        alert(`Transaction simulation failed: ${msg}\n\nThis may mean the contract is not deployed or the strategy is no longer active.`);
      } else {
        alert(`Staking failed: ${msg}`);
      }
    } finally {
      setStakingStrategyId(null);
    }
  };

  // ── Render ──
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">
            Strategy Marketplace
          </h1>
          <p className="text-zinc-500 text-sm">
            Browse, discover, and execute strategies published on Stellar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary text-xs !py-2 !px-3 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link href="/app/create" className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5">
            + Create Strategy
          </Link>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="!p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-lime-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-100 font-mono">{strategies.length}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Strategies</div>
          </div>
        </Card>
        <Card className="!p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-100 font-mono">{activeCount}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Active Now</div>
          </div>
        </Card>
        <Card className="!p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-100 font-mono">{totalReward.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Stake Required</div>
          </div>
        </Card>
      </div>

      {/* Search + Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            placeholder="Search strategies by title, description, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
          {(["all", "active", "completed"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === f
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {sortBy === "newest" && "Newest"}
              {sortBy === "reward-high" && "Highest Reward"}
              {sortBy === "reward-low" && "Lowest Reward"}
              {sortBy === "most-executed" && "Most Executed"}
            </span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showSortDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
                {(
                  [
                    { key: "newest", label: "Newest First" },
                    { key: "reward-high", label: "Highest Reward" },
                    { key: "reward-low", label: "Lowest Reward" },
                    { key: "most-executed", label: "Most Executed" },
                  ] as { key: SortOption; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSortBy(opt.key);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                      sortBy === opt.key
                        ? "text-lime-400 bg-zinc-800/50"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <Spinner size="lg" />
          <p className="mt-3 text-zinc-500 text-sm">Scanning on-chain strategies...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon="◆"
          title={searchQuery ? "No strategies found" : "No strategies yet"}
          description={
            searchQuery
              ? "Try adjusting your search or filter criteria"
              : "Be the first to publish a strategy on the marketplace"
          }
          action={{ label: "Create Strategy", href: "/app/create" }}
        />
      )}

      {/* Strategy Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((strat) => (
            <StrategyCard
              key={strat.id}
              strategy={strat}
              myAddress={publicKey}
              onStake={handleStake}
              isStaking={stakingStrategyId === strat.id}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <div className="text-center pb-4">
          <p className="text-xs text-zinc-600">
            Showing {filtered.length} of {strategies.length} strategies
          </p>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Strategy Card
// ────────────────────────────────────────────────────────────
function StrategyCard({
  strategy,
  myAddress,
  onStake,
  isStaking,
}: {
  strategy: MarketplaceStrategy;
  myAddress: string | null;
  onStake: (strategyId: number) => void;
  isStaking: boolean;
}) {
  const { id, meta, chain, executionCount, hasMyExecution } = strategy;
  const isActive = chain?.active ?? false;
  const isCreator = myAddress && chain?.creator === myAddress;

  const title = meta?.title || `Strategy #${id}`;
  const description = meta?.description || "On-chain strategy (no metadata available)";
  const rules = meta?.rules || [];
  const reward = chain?.reward_amount || meta?.rewardAmount || 0;
  const creatorAddr = chain?.creator || meta?.creatorAddress || "unknown";
  const truncAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <Card className="flex flex-col group relative overflow-hidden">
      {/* Status indicator glow */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500/50 to-transparent" />
      )}

      {/* Top row: ID + Status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-zinc-600">#{id}</span>
        <div className="flex items-center gap-1.5">
          {isCreator && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700/50 uppercase">
              You
            </span>
          )}
          <StatusBadge status={isActive ? "verified" : "completed"} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-zinc-100 mb-1 line-clamp-1 group-hover:text-lime-400 transition-colors">
        {title}
      </h3>

      {/* Description */}
      <p className="text-xs text-zinc-500 mb-3 line-clamp-2 leading-relaxed">
        {description}
      </p>

      {/* Strategy Locked - Teaser */}
      <div className="mb-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs font-semibold text-zinc-400">Strategy Locked</div>
            <div className="text-[10px] text-zinc-600">Stake to unlock full details</div>
          </div>
        </div>
        <div className="blur-sm select-none pointer-events-none opacity-50">
          <div className="flex items-start gap-2 text-[11px] text-zinc-500 mb-1">
            <CheckCircle className="w-3 h-3 text-zinc-700 mt-0.5 shrink-0" />
            <span>Entry: Buy when ████ ██</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-zinc-500 mb-1">
            <CheckCircle className="w-3 h-3 text-zinc-700 mt-0.5 shrink-0" />
            <span>Exit: Sell when ███ ████</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-zinc-500">
            <CheckCircle className="w-3 h-3 text-zinc-700 mt-0.5 shrink-0" />
            <span>Position: Max █% per █████</span>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stake + Profit Info */}
      <div className="py-2.5 border-t border-zinc-800/50 mt-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-lime-400" />
            <span className="text-[11px] text-zinc-500">Stake</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-lime-400 font-mono">
              {reward.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-600">XLM</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-zinc-500">Profit Share</span>
          </div>
          <span className="text-sm font-bold text-blue-400 font-mono">
            {meta?.profitSharePercent || 20}%
          </span>
        </div>
        <div className="pt-1.5 border-t border-zinc-800/50 flex items-center gap-1">
          <Zap className="w-3 h-3 text-zinc-600" />
          <span className="text-[11px] text-zinc-500">
            {executionCount} trader{executionCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Creator */}
      <div className="flex items-center gap-1.5 pt-2.5 border-t border-zinc-800/50">
        <User className="w-3 h-3 text-zinc-600" />
        <span className="text-[10px] font-mono text-zinc-600">
          {truncAddr(creatorAddr)}
        </span>
      </div>

      {/* CTA Buttons */}
      {isActive ? (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStake(id)}
              disabled={isStaking}
              className="flex-1 btn-primary !text-[11px] !py-2 !px-3 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStaking ? (
                <>
                  <Spinner size="sm" />
                  Staking...
                </>
              ) : (
                <>
                  <Coins className="w-3.5 h-3.5" />
                  Stake {reward} XLM
                </>
              )}
            </button>
            <Link
              href={`/app/execute?strategyId=${id}`}
              className="btn-secondary !text-[11px] !py-2 !px-3 flex items-center gap-1"
              title="View details"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {isCreator && (
            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Your strategy
            </span>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Completed
          </span>
        </div>
      )}
    </Card>
  );
}
