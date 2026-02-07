"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, ROLE_CONFIG } from "@/lib/auth";
import { useWallet } from "@/components/WalletProvider";
import { Card, StatCard, RoleBadge, EmptyState } from "@/components/ui";
import { getAllStrategyMetas, getAllExecutionMetas, getActivities } from "@/lib/contract";

export default function AppOverviewPage() {
  const { user } = useAuth();
  const { publicKey } = useWallet();

  const [stats, setStats] = useState({ strategies: 0, executions: 0, verified: 0, totalReward: 0 });
  const [activities, setActivities] = useState<{ icon: string; action: string; time: string }[]>([]);

  // Load real stats from local storage
  useEffect(() => {
    const strategies = getAllStrategyMetas();
    const executions = getAllExecutionMetas();
    const acts = getActivities();

    const strategyCount = Object.keys(strategies).length;
    const executionCount = Object.keys(executions).length;
    const totalReward = Object.values(strategies).reduce((sum, s) => sum + (s.rewardAmount || 0), 0);

    // Count verified from activity log (heuristic)
    const verifiedCount = acts.filter((a) => a.action.toLowerCase().includes("verified on-chain")).length;

    setStats({
      strategies: strategyCount,
      executions: executionCount,
      verified: verifiedCount,
      totalReward,
    });
    setActivities(acts.slice(0, 10));
  }, []);

  if (!user) return null;

  const role = user.role;
  const roleConfig = ROLE_CONFIG[role];

  const quickActions: { href: string; label: string; icon: string; desc: string }[] = [];

  if (role === "expert" || role === "admin") {
    quickActions.push({
      href: "/app/create",
      label: "Publish Strategy",
      icon: "◆",
      desc: "Set stake requirement and profit share",
    });
  }
  if (role === "trader" || role === "admin") {
    quickActions.push({
      href: "/app/execute",
      label: "Stake & Execute",
      icon: "⚡",
      desc: "Unlock strategy and submit P&L proof",
    });
  }
  if (role === "verifier" || role === "admin") {
    quickActions.push({
      href: "/app/verify",
      label: "Verify Execution",
      icon: "✓",
      desc: "Run AI verification on-chain",
    });
  }
  quickActions.push({
    href: "/app/marketplace",
    label: "Marketplace",
    icon: "🏪",
    desc: "Browse and discover strategies",
  });
  quickActions.push({
    href: "/app/dashboard",
    label: "Profit Dashboard",
    icon: "◈",
    desc: "View profit-share earnings",
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-zinc-500 text-sm">
              Here&apos;s your StratFlow overview
            </p>
            <RoleBadge role={user.role} />
          </div>
        </div>
        {publicKey && (
          <div className="surface-card !p-2.5 !rounded-lg flex items-center gap-2.5">
            <span className="dot-live" />
            <span className="text-sm text-zinc-400 font-mono">
              {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
            </span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Strategies Created" value={stats.strategies.toString()} icon="◆" color="lime" />
        <StatCard label="Executions" value={stats.executions.toString()} icon="⚡" color="default" />
        <StatCard label="Verified" value={stats.verified.toString()} icon="✓" color="lime" />
        <StatCard label="Total Reward" value={stats.totalReward.toLocaleString()} icon="◈" color="amber" trend={{ value: "XLM", up: true }} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="h-full group hover:!border-zinc-700 transition-all">
                <div className="text-xl mb-3 text-lime-400 group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <h3 className="text-zinc-100 font-semibold text-sm mb-1">{action.label}</h3>
                <p className="text-xs text-zinc-600">{action.desc}</p>
                <div className="mt-3 text-lime-400 text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Go →
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Role info + Protocol Status */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-wider mb-4">
            Your Role
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-2xl text-lime-400">{roleConfig.icon}</div>
            <div>
              <div className="text-lg font-semibold text-zinc-100">{roleConfig.label}</div>
              <div className="text-sm text-zinc-500">{roleConfig.description}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {roleConfig.permissions.map((p) => (
              <span key={p} className="px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/50 text-zinc-400 text-xs font-mono">
                {p}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-wider mb-4">
            Protocol Status
          </h3>
          <div className="space-y-2">
            {[
              { label: "Soroban Contract", status: "Active", color: "bg-emerald-400", statusColor: "text-emerald-400" },
              { label: "Stellar Network", status: "Testnet", color: "bg-lime-400", statusColor: "text-lime-400" },
              { label: "Gemini AI", status: "Online", color: "bg-emerald-400", statusColor: "text-emerald-400" },
              { label: "Wallet", status: publicKey ? "Connected" : "Not connected", color: publicKey ? "bg-emerald-400" : "bg-zinc-600", statusColor: publicKey ? "text-emerald-400" : "text-zinc-500" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <div className="flex items-center gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.color} ${item.color.includes("emerald") || item.color.includes("lime") ? "animate-pulse" : ""}`} />
                  <span className="text-sm text-zinc-400">{item.label}</span>
                </div>
                <span className={`text-xs ${item.statusColor} font-mono`}>{item.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-wider mb-4">
          Recent Activity
        </h3>
        {activities.length > 0 ? (
          <div className="space-y-1">
            {activities.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/30 transition-colors">
                <span className="text-sm text-lime-400">{item.icon}</span>
                <div className="flex-1">
                  <span className="text-sm text-zinc-300">{item.action}</span>
                </div>
                <span className="text-xs text-zinc-600">{item.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-2xl mb-2 opacity-30">◈</div>
            <p className="text-zinc-500 text-sm">No activity yet. Create your first strategy to get started.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
