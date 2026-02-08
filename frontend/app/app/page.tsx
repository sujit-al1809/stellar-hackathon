"use client";

import React from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { ArrowUpRight, Activity, Database, Server, Terminal, AlertTriangle, TrendingUp, Bot, Zap, Plus, Shield, Play } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { label: "Total_Value_Locked", value: "$42,093.00", trend: "+12.5%", icon: Database },
    { label: "Active_Running_Bots", value: "8", trend: "+2", icon: Server },
    { label: "Net_Profit_Share", value: "3,204 XLM", trend: "+4.2%", icon: Activity },
  ];

  return (
    <div className="space-y-8">
      
      {/* HACKATHON DEMO: Prominent CTA */}
      <div className="bg-gradient-to-r from-lime-500/20 via-emerald-500/10 to-blue-500/10 border-2 border-lime-500/50 p-6 clip-corner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-lg bg-lime-500/20 border-2 border-lime-500/40 flex items-center justify-center animate-pulse">
              <Play className="w-8 h-8 text-lime-400 fill-lime-400" />
            </div>
            <div>
              <div className="text-xs text-lime-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-lime-500 rounded-full animate-ping" />
                Stellar Build-A-Thon Chennai 2026
              </div>
              <h2 className="text-2xl font-black text-white uppercase">Start the Demo Flow</h2>
              <p className="text-sm text-zinc-400 mt-1">
                See the complete journey: Create Strategy → AI Execution → Verification → Payout
              </p>
            </div>
          </div>
          <Link 
            href="/app/demo" 
            className="px-8 py-4 bg-lime-500 text-black font-black uppercase text-lg hover:bg-lime-400 transition-all clip-corner flex items-center gap-3 shrink-0"
          >
            <Play className="w-5 h-5 fill-black" />
            View Demo Flow
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">
            Mission Control
          </h1>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Overview / Metrics / System_Vitals
          </p>
        </div>
        
        <div className="flex gap-3">
           {/* Trader: Browse marketplace */}
           {(user?.role === "trader" || user?.role === "admin") && (
             <Link href="/app/marketplace" className="px-5 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase text-zinc-400 hover:text-white hover:border-lime-500 transition-all clip-corner flex items-center gap-2">
                <Terminal className="w-3 h-3" /> Find_Strategies
             </Link>
           )}

           {/* Expert: Create strategy */}
           {(user?.role === "expert" || user?.role === "admin") && (
             <Link href="/app/create" className="px-5 py-2 bg-lime-500 text-black text-xs font-bold uppercase hover:bg-lime-400 transition-all clip-corner flex items-center gap-2">
                Deploy_New +
             </Link>
           )}

           {/* Verifier: Go to verify queue */}
           {(user?.role === "verifier" || user?.role === "admin") && (
             <Link href="/app/verify" className="px-5 py-2 bg-blue-500 text-white text-xs font-bold uppercase hover:bg-blue-400 transition-all clip-corner flex items-center gap-2">
                Verify_Queue
             </Link>
           )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-black border border-zinc-800 p-6 relative group overflow-hidden">
            {/* Hover Indicator */}
            <div className="absolute top-0 left-0 w-1 h-full bg-lime-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-500 group-hover:text-lime-500 transition-colors clip-corner transform group-hover:rotate-6">
                  <stat.icon className="w-5 h-5" />
               </div>
               <span className="text-xs font-mono text-lime-500 flex items-center gap-1 bg-lime-500/10 px-2 py-0.5 rounded-sm">
                  {stat.trend} <ArrowUpRight className="w-3 h-3" />
               </span>
            </div>
            
            <div className="text-2xl font-black text-white font-mono tracking-tight mb-1">
               {stat.value}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
               {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Feature Highlights - Role-based */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* For Traders & Admins */}
        {(user?.role === "trader" || user?.role === "admin") && (
          <>
            <Link href="/app/marketplace" className="group bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 p-5 hover:border-blue-500/50 transition-all clip-corner">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 group-hover:translate-y-[-4px] transition-transform" />
              </div>
              <h3 className="text-sm font-bold text-blue-400 mb-1 uppercase">StellarX Trading</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Execute strategies directly on Stellar's DEX. One-click, pre-configured trading pairs.
              </p>
            </Link>

            <Link href="/app/agents" className="group bg-gradient-to-br from-lime-500/5 to-lime-500/10 border border-lime-500/20 p-5 hover:border-lime-500/50 transition-all clip-corner">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-lime-400" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-lime-400 group-hover:translate-x-1 group-hover:translate-y-[-4px] transition-transform" />
              </div>
              <h3 className="text-sm font-bold text-lime-400 mb-1 uppercase">AI Agents 24/7</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Deploy autonomous agents to execute strategies automatically while you sleep.
              </p>
            </Link>

            <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 clip-corner">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">80%</span>
              </div>
              <h3 className="text-sm font-bold text-emerald-400 mb-1 uppercase">Keep 80% Profits</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                You keep 80% of all profits. Experts get 20%. Only pay on success.
              </p>
            </div>
          </>
        )}

        {/* For Experts */}
        {user?.role === "expert" && (
          <>
            <Link href="/app/create" className="group bg-gradient-to-br from-lime-500/5 to-lime-500/10 border border-lime-500/20 p-5 hover:border-lime-500/50 transition-all clip-corner">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-lime-400" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-lime-400 group-hover:translate-x-1 group-hover:translate-y-[-4px] transition-transform" />
              </div>
              <h3 className="text-sm font-bold text-lime-400 mb-1 uppercase">Create Strategies</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Publish your trading strategies and earn 20% of trader profits.
              </p>
            </Link>

            <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 p-5 clip-corner">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">20%</span>
              </div>
              <h3 className="text-sm font-bold text-blue-400 mb-1 uppercase">Earn Profit Share</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Get 20% of trader profits. Only earn when traders succeed.
              </p>
            </div>

            <Link href="/app/marketplace" className="group bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 hover:border-emerald-500/50 transition-all clip-corner">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 group-hover:translate-y-[-4px] transition-transform" />
              </div>
              <h3 className="text-sm font-bold text-emerald-400 mb-1 uppercase">View Marketplace</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                See how your strategies perform in the marketplace.
              </p>
            </Link>
          </>
        )}

        {/* For Verifiers */}
        {user?.role === "verifier" && (
          <>
            <Link href="/app/verify" className="group bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 p-5 hover:border-blue-500/50 transition-all clip-corner">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 group-hover:translate-y-[-4px] transition-transform" />
              </div>
              <h3 className="text-sm font-bold text-blue-400 mb-1 uppercase">Verify Submissions</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Review trader proof submissions and AI verification results.
              </p>
            </Link>

            <div className="bg-gradient-to-br from-lime-500/5 to-lime-500/10 border border-lime-500/20 p-5 clip-corner">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-lime-400" />
                </div>
                <span className="text-xs font-mono text-lime-400 bg-lime-500/10 px-2 py-0.5 rounded">AI</span>
              </div>
              <h3 className="text-sm font-bold text-lime-400 mb-1 uppercase">AI-Powered</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Gemini AI + Pyth oracles verify all submissions automatically.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 clip-corner">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-emerald-400 mb-1 uppercase">Queue System</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Process submissions in order with full audit trails.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Main Panel Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Chart / Main Area (Placeholder for now) */}
         <div className="lg:col-span-2 bg-[#080808] border border-zinc-800 min-h-[400px] relative">
            <div className="absolute top-0 left-0 px-4 py-2 bg-zinc-900 border-b border-r border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-2">
               <Activity className="w-3 h-3" /> PnL_Visualizer
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center opacity-30">
                  <div className="text-6xl font-black text-zinc-800 tracking-tighter mb-4">NO_DATA_STREAM</div>
                  <p className="text-xs font-mono text-zinc-600 uppercase">Connect a strategy to visualize performance</p>
               </div>
            </div>
            
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
         </div>

         {/* Side Activity Log */}
         <div className="bg-black border border-zinc-800 flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
               <span className="text-[10px] font-bold uppercase text-zinc-400">System_Logs</span>
               <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
            </div>
            
            <div className="p-4 font-mono text-[10px] space-y-3 text-zinc-500 flex-1">
               <div className="flex gap-2">
                  <span className="text-zinc-600">[10:42:01]</span>
                  <span className="text-blue-400">AUTH_SUCCESS</span>
                  <span className="text-zinc-400">User {user?.name.split(" ")[0]} logged in</span>
               </div>
               <div className="flex gap-2">
                  <span className="text-zinc-600">[10:42:05]</span>
                  <span className="text-lime-500">SYNC_COMPLETE</span>
                  <span className="text-zinc-400">Wallet balance updated</span>
               </div>
               <div className="flex gap-2">
                  <span className="text-zinc-600">[10:45:12]</span>
                  <span className="text-zinc-500">PING</span>
                  <span className="text-zinc-600">Oracle latency check: 42ms</span>
               </div>
               <div className="flex gap-2 opacity-50">
                  <span className="text-zinc-600">[10:40:00]</span>
                  <span className="text-yellow-500">WARN</span>
                  <span className="text-zinc-400">High gas fees detected on network</span>
               </div>
            </div>
            
            <div className="p-3 border-t border-zinc-800 bg-hazard h-2 opacity-50" />
            <div className="p-3 bg-zinc-950 text-center">
               <Link href="/app/execute" className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white transition-colors">
                  View_Full_Logs &rarr;
               </Link>
            </div>
         </div>
      </div>

    </div>
  );
}
