"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Activity, CheckCircle, Clock, XCircle, FileText, Search, Filter, DollarSign, Trophy } from "lucide-react";

export default function SubmissionsPage() {
  // Mock Data
  const submissions = [
    {
      id: "Sub-1092",
      strategy: "Momentum Alpha V2",
      strategyId: "S-001",
      timestamp: "2026-02-08 09:42:15",
      status: "verified",
      proofHash: "0x7f3a...9b2c",
      reward: "450 XLM"
    },
    {
      id: "Sub-1091",
      strategy: "Arbitrage OPS",
      strategyId: "S-004",
      timestamp: "2026-02-07 14:20:00",
      status: "pending",
      proofHash: "0x2a1c...8d4e",
      reward: "pending"
    },
    {
      id: "Sub-1088",
      strategy: "Momentum Alpha V2",
      strategyId: "S-001",
      timestamp: "2026-02-06 18:05:30",
      status: "rejected",
      proofHash: "0x9e8d...1f3a",
      reward: "0 XLM"
    },
    {
      id: "Sub-1085",
      strategy: "Liquidity Prov V1",
      strategyId: "S-009",
      timestamp: "2026-02-05 11:15:00",
      status: "verified",
      proofHash: "0x3c4b...2a1d",
      reward: "1,200 XLM"
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* DEMO FLOW: Final Step - Victory Banner */}
      <div className="bg-gradient-to-r from-lime-500/20 via-emerald-500/10 to-blue-500/20 border border-lime-500/40 p-6 clip-corner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-lime-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-lime-500/20 border border-lime-500/30 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-lime-400" />
            </div>
            <div>
              <div className="text-xs text-lime-400 uppercase font-bold tracking-wider mb-1">Demo Flow: Step 6 of 6 — Complete! 🎉</div>
              <div className="text-lg font-bold text-white">Reward Streaming to Trader</div>
              <div className="text-sm text-zinc-400 mt-1">
                Expert gets 20% profit share • Trader gets 80% + stake back • All on Stellar blockchain
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-lime-400 font-mono">+$245</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Demo P&L</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">
            Proof Logs
          </h1>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Submission History // Trader_Logs
          </p>
        </div>
        
        <div className="flex gap-3">
           <div className="relative group">
              <input 
                 type="text" 
                 placeholder="SEARCH_HASH..." 
                 className="bg-black border border-zinc-800 text-zinc-400 text-xs font-mono px-4 py-2 w-64 focus:outline-none focus:border-lime-500 transition-colors uppercase"
              />
              <Search className="absolute right-3 top-2 w-3 h-3 text-zinc-600 group-focus-within:text-lime-500" />
           </div>
           <button className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-lime-500 transition-colors">
              <Filter className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-zinc-950 border border-zinc-800 relative clip-corner">
         {/* Decorative Grid */}
         <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
         
         {/* Corner Accents */}
         <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700" />
         <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-700" />

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                     <th className="p-4">ID</th>
                     <th className="p-4">Strategy</th>
                     <th className="p-4">Proof_Hash</th>
                     <th className="p-4">Timestamp</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Settlement</th>
                     <th className="p-4 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="text-xs font-mono">
                  {submissions.map((item, i) => (
                     <tr key={i} className="border-b border-zinc-900/50 hover:bg-zinc-900/30 transition-colors group">
                        <td className="p-4 text-zinc-400 group-hover:text-white">
                           {item.id}
                        </td>
                        <td className="p-4 text-white font-bold">
                           <span className="text-zinc-600 mr-2">[{item.strategyId}]</span>
                           {item.strategy}
                        </td>
                        <td className="p-4 text-zinc-500">
                           {item.proofHash}
                        </td>
                        <td className="p-4 text-zinc-500">
                           {item.timestamp}
                        </td>
                        <td className="p-4">
                           {item.status === 'verified' && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-lime-500/10 text-lime-500 border border-lime-500/20 rounded-sm">
                                 <CheckCircle className="w-3 h-3" /> VERIFIED
                              </span>
                           )}
                           {item.status === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-sm">
                                 <Clock className="w-3 h-3 animate-pulse" /> VALIDATING
                              </span>
                           )}
                           {item.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-sm">
                                 <XCircle className="w-3 h-3" /> FAILED
                              </span>
                           )}
                        </td>
                        <td className="p-4 text-right font-bold text-white">
                           {item.reward}
                        </td>
                        <td className="p-4 text-right">
                           <Link href="#" className="inline-flex items-center justify-center p-1.5 border border-zinc-800 bg-black text-zinc-500 hover:text-lime-500 hover:border-lime-500 transition-colors">
                              <FileText className="w-3 h-3" />
                           </Link>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Sync Status Footer */}
      <div className="flex items-center justify-between text-[10px] uppercase font-mono text-zinc-600 border-t border-zinc-900 pt-4">
         <span>Total Records: {submissions.length}</span>
         <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Syncing_with_Ledger...
         </span>
      </div>
    </div>
  );
}
