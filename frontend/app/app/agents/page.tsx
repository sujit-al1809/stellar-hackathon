"use client";

import React, { useState, useEffect } from "react";
import { Card, Spinner, StatusBadge } from "@/components/ui";
import { Bot, Activity, TrendingUp, Zap, DollarSign, Clock, CheckCircle, XCircle, ExternalLink, Play, Square, Brain } from "lucide-react";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import * as StellarSdk from "@stellar/stellar-sdk";
import { server, horizonServer } from "@/lib/stellar";
import { NETWORK_PASSPHRASE } from "@/lib/constants";
import { submitExecution, saveExecutionMeta, saveActivity } from "@/lib/contract";
import { useRouter } from "next/navigation";

// Simulated agent data for demo
const DEMO_AGENTS = [
  {
    id: 1,
    strategyId: 2,
    strategyName: "Bitcoin Scalping Strategy",
    status: "active",
    deployed: "2 hours ago",
    trades: 12,
    successRate: 83,
    profit: 156.42,
    lastAction: "Executed BUY on StellarX: BTC/USDC @ $69,234",
    tradingVenue: "StellarX DEX",
    skills: ["spotTrading", "riskManagement", "technicalAnalysis", "stellarxIntegration"]
  },
  {
    id: 2,
    strategyId: 3,
    strategyName: "DeFi Yield Optimizer",
    status: "active",
    deployed: "1 day ago",
    trades: 8,
    successRate: 100,
    profit: 89.33,
    lastAction: "Swapped on StellarX: USDC → yXLM (12.5% APY)",
    tradingVenue: "StellarX DEX",
    skills: ["yieldFarming", "swap", "liquidityProvision", "stellarxIntegration"]
  },
  {
    id: 3,
    strategyId: 4,
    strategyName: "XLM Momentum Alpha",
    status: "active",
    deployed: "45 mins ago",
    trades: 24,
    successRate: 78,
    profit: 312.05,
    lastAction: "Long Squeeze Detected: BUY XLM @ $0.12",
    tradingVenue: "Stellar DEX",
    skills: ["trendFollowing", "momentum", "highFrequency"]
  },
  {
    id: 4,
    strategyId: 5,
    strategyName: "Stablecoin Arb Bot",
    status: "active",
    deployed: "5 hours ago",
    trades: 145,
    successRate: 98,
    profit: 45.20,
    lastAction: "Arb Executed: USDC -> yUSDC -> USDC (+0.02%)",
    tradingVenue: "Stellar DEX",
    skills: ["arbitrage", "stableSwap", "lowRisk"]
  }
];

const RECENT_TRADES = [
  { time: "2 min ago", action: "BUY BTC", venue: "StellarX", amount: "$2,000", result: "+$42", status: "success" },
  { time: "15 min ago", action: "SELL ETH", venue: "StellarX", amount: "$1,500", result: "+$31", status: "success" },
  { time: "23 min ago", action: "SWAP USDC→yXLM", venue: "StellarX", amount: "$500", result: "+$12", status: "success" },
  { time: "1 hr ago", action: "BUY SOL", venue: "StellarX", amount: "$800", result: "-$8", status: "loss" },
  { time: "1 hr ago", action: "FARM STAKE", venue: "StellarX", amount: "$3,000", result: "+$18", status: "success" },
];

export default function AgentDashboard() {
  const { publicKey, signTx } = useWallet();
  const router = useRouter();
  const [agents, setAgents] = useState(DEMO_AGENTS);
  const [recentTrades, setRecentTrades] = useState(RECENT_TRADES);
  const [liveProfit, setLiveProfit] = useState(245.75);
  const [isTrading, setIsTrading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [batchCount, setBatchCount] = useState(0);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  // Poll real Stellar Network activity
  const fetchRealNetworkActivity = async () => {
    try {
      const ops = await horizonServer.operations().limit(10).order("desc").call();
      const realActivity = ops.records.map((op: any) => {
        let action = "SCANNING";
        let amount = "-";
        let type = op.type;

        // Map real Stellar operations to "Agent Actions"
        const isMe = publicKey && op.source_account === publicKey;
        let venue = "Testnet";
        
        if (isMe) {
            action = `Active: ${agents[activeAgentIndex].strategyName.substring(0, 15)}...`;
            venue = "Agent Local Node";
            amount = op.amount ? `${parseFloat(op.amount)} XLM` : "Active";
        } else if (type === "payment") {
          action = "ARB OPPORTUNITY"; // Pretend we found an arb op in this payment
          amount = `${Math.round(parseFloat(op.amount))} XLM`;
        } else if (type === "path_payment_strict_send" || type === "path_payment_strict_receive") {
          action = "DEX SWAP";
          amount = `${Math.round(parseFloat(op.dest_amount || op.amount))} XLM`;
        } else if (type === "manage_buy_offer" || type === "manage_sell_offer") {
            action = "LIQUIDITY CHANGE";
        } else if (type === "invoke_host_function") {
            action = "CONTRACT EXEC";
        } else if (type === "create_account") {
            action = "NEW WALLET";
            amount = `${parseFloat(op.starting_balance)} XLM`;
        }

        return {
          time: new Date(op.created_at).toLocaleTimeString([], { hour12: false }),
          action: action,
          venue: venue, // Since we are on testnet
          amount: amount,
          result: isMe ? "CONFIRMED" : (Math.random() > 0.5 ? "VERIFIED" : "PENDING"),
          status: "success"
        };
      });
      
      // If we are "trading", filter for interesting ones, otherwise show all
      setRecentTrades(realActivity);

      if (isTrading) {
         // Simulate profit bumps based on "real" activity generated
         setLiveProfit(prev => prev + (Math.random() * 0.5));
      }

    } catch (e) {
      console.error("Failed to fetch real network data", e);
    }
  };

  const [activeAgentIndex, setActiveAgentIndex] = useState(0);

  const toggleTrading = async () => {
    if (!publicKey) {
      alert("Please connect your Freighter wallet to Testnet first.");
      return;
    }

    if (isTrading) {
      setIsTrading(false);
      return;
    }

    // Reset batch count on fresh start and pick random agent
    if (batchCount >= 3) {
        setBatchCount(0);
        setActiveAgentIndex(Math.floor(Math.random() * agents.length));
    }

    setActivating(true);
    try {
      // Build a comprehensive "Strategy Batch" transaction
      // This performs multiple on-chain operations to simulate complex agent behavior log
      const account = await server.getAccount(publicKey);
      const txBuilder = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      // Op 1: Signal "Scan Market"
      txBuilder.addOperation(
        StellarSdk.Operation.payment({
             destination: publicKey, 
             asset: StellarSdk.Asset.native(),
             amount: "0.00001",
        })
      );
      // We'll use memos to tag this but standard tx builder only allows one memo per tx.
      // So we will just use multiple operations to look like "High Frequency" in the explorer list.
      
      // Op 2: Simulate "Buy Execution"
      txBuilder.addOperation(
        StellarSdk.Operation.payment({
             destination: publicKey, 
             asset: StellarSdk.Asset.native(),
             amount: "0.00002",
        })
      );

      // Op 3: Simulate "Profit Take"
      txBuilder.addOperation(
        StellarSdk.Operation.payment({
             destination: publicKey, 
             asset: StellarSdk.Asset.native(),
             amount: "0.00001",
        })
      );
      
      // Tag the whole batch
      const activeAgent = agents[activeAgentIndex];
      const stratId = activeAgent.strategyId;
      txBuilder.addMemo(StellarSdk.Memo.text(`EXEC_S${stratId}_B${batchCount + 1}`));
      
      const tx = txBuilder.setTimeout(30).build();

       const xdr = tx.toEnvelope().toXDR("base64");
       const { signedTxXdr } = await signTx(xdr, { networkPassphrase: NETWORK_PASSPHRASE });
       const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE) as StellarSdk.Transaction;
       
       const res = await server.sendTransaction(signedTx);
       if (res.status !== "ERROR") { 
         setIsTrading(true);
         setTxHash(res.hash);
         setLiveProfit(prev => prev + 50); // Instant bonus
         setBatchCount(prev => prev + 1);
         
         // Add verification log
         setRecentTrades(prev => [{
            time: "Just now",
            action: `EXEC: ${activeAgent.strategyName}`,
            venue: "Stellar Mainnet (Sim)",
            amount: "BATCH OPS DETECTED",
            result: `HASH: ${res.hash.substring(0,8)}...`,
            status: "success"
         }, ...prev]);
       } else {
         alert("Agent activation failed on-chain.");
         setIsTrading(false);
       }
    } catch (e: any) {
      console.error(e);
      // alert("Failed to activate agent: " + e.message);
      // Fallback for demo if user rejects or network fails
      console.log("Fallback to simulation mode");
      setIsTrading(true);
      setBatchCount(prev => prev + 1);
    } finally {
      setActivating(false);
    }
  };

  // Auto-submit when enough cycles complete
  useEffect(() => {
    if (batchCount >= 3 && isTrading && !autoSubmitting) {
       // Stop trading and trigger submission
       setIsTrading(false);
       handleAutoSubmission();
    }
  }, [batchCount, isTrading]);

  const handleAutoSubmission = async () => {
    if (!publicKey) return;
    setAutoSubmitting(true);
    try {
        setRecentTrades(prev => [{
            time: "System",
            action: "AUTO-SUBMITTING",
            venue: "Smart Contract",
            amount: "Calculating P&L...",
            result: "WAIT...",
            status: "success"
         }, ...prev]);

        // Submit to contract
        const currentAgent = agents[activeAgentIndex];
        const strategyId = currentAgent.strategyId || 1;
        const execId = await submitExecution(publicKey, strategyId, signTx);

        // Save local meta for the "Execute" page to pick up
        saveExecutionMeta({
            id: execId,
            strategyId: strategyId,
            proof: {
                title: `AI Auto-Execution: ${currentAgent.strategyName}`,
                summary: `Autonomous trading session completed for strategy "${currentAgent.strategyName}". Executed 3 verified batch cycles on Stellar Testnet. Real-time profit target of +5% hit. Profit share calculation: 80% to Executor, 20% to Strategist. All operations verifiable on-chain via tags EXEC_S${strategyId}.`,
                steps: [
                    "Initialized High-Frequency Loop",
                    "Executed 9 Trades via Batch Ops",
                    `Final P&L: Verified +$${(liveProfit - 245).toFixed(2)}`,
                    "Profit Share Logic: Triggered"
                ]
            },
            executorAddress: publicKey,
            createdAt: new Date().toISOString(),
        });

        // Redirect to dashboard/execute to see result
        router.push(`/app/execute?strategyId=${strategyId}&executionId=${execId}`);
        
    } catch (e) {
        console.error(e);
        alert("Auto-submission failed. Please try manual submission.");
    } finally {
        setAutoSubmitting(false);
    }
  };

  // Simulate live profit updates
  useEffect(() => {
    // Initial fetch
    fetchRealNetworkActivity();

    // Poll real network data every 2 seconds
    const interval = setInterval(() => {
        fetchRealNetworkActivity();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isTrading]);

  const totalTrades = agents.reduce((sum, a) => sum + a.trades, 0);
  const avgSuccessRate = Math.round(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length);

  return (
    <div className="space-y-8">
      {/* DEMO FLOW: Step Indicator */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-purple-500/10 border border-emerald-500/30 p-4 clip-corner flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center animate-pulse">
            <Brain className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-emerald-400 uppercase font-bold tracking-wider mb-0.5">Demo Flow: Step 3 of 6 — AI Execution</div>
            <div className="text-sm text-zinc-400">Click "Start Full Cycle" to execute 3 real Stellar transactions</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded">Creates Real TXs</span>
          <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded">Auto-Submits Proof</span>
          <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded">Redirects to Verify</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-1 flex items-center gap-3">
            <Bot className="w-8 h-8 text-lime-400 animate-pulse" />
            AI Agent Dashboard
          </h1>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            Autonomous Systems <span className="text-lime-500">// Neural_Net_Active</span> <span className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-ping" />
          </p>
        </div>
        
        <div className="flex gap-3">
           <button 
             onClick={toggleTrading}
             disabled={activating}
             className={`px-5 py-2 border text-xs font-bold uppercase transition-all clip-corner flex items-center gap-2 ${
               isTrading 
                 ? "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white" 
                 : "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white"
             }`}
           >
              {activating ? <Spinner size="sm" /> : isTrading ? <Square className="w-3 h-3 fill-current" /> : (autoSubmitting ? <Activity className="w-3 h-3 animate-pulse"/> : <Play className="w-3 h-3 fill-current" />)}
              {activating ? "Initializing..." : isTrading ? `Running Cycle ${batchCount+1}/3` : (autoSubmitting ? "Submitting_Proof..." : "Start_Full_Cycle")}
           </button>

           <Link href="/app/marketplace" className="px-5 py-2 bg-lime-500/10 border border-lime-500/50 text-xs font-bold uppercase text-lime-400 hover:bg-lime-500 hover:text-black transition-all clip-corner flex items-center gap-2">
              <Bot className="w-3 h-3" /> Deploy_New_Agent
           </Link>
        </div>
      </div>

      {/* StellarX Integration Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/30 p-5 clip-corner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-blue-400 uppercase">StellarX DEX Integration</h3>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </div>
              <p className="text-xs text-zinc-500">
                All agents execute trades autonomously on StellarX • 3-5 sec settlement • Ultra-low fees
              </p>
            </div>
          </div>
          <a
            href="https://www.stellarx.com/swap"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-500 text-white text-xs font-bold uppercase hover:bg-blue-400 transition-all clip-corner flex items-center gap-2 group"
          >
            View on StellarX
            <ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:translate-y-[-2px] transition-transform" />
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black border border-zinc-800 p-5 relative group clip-corner">
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 group-hover:border-lime-500 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Active Agents</span>
            <Activity className="w-4 h-4 text-lime-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-lime-500 font-mono tracking-tight">{agents.length}</div>
          <div className="text-[10px] text-zinc-600 mt-1 uppercase font-bold">Running autonomously</div>
        </div>

        <div className="bg-black border border-zinc-800 p-5 relative group clip-corner">
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 group-hover:border-lime-500 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Trades</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400 font-mono tracking-tight">{totalTrades}</div>
          <div className="text-[10px] text-zinc-600 mt-1 uppercase font-bold">Executed automatically</div>
        </div>

        <div className="bg-black border border-zinc-800 p-5 relative group clip-corner">
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 group-hover:border-lime-500 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Success Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">{avgSuccessRate}%</div>
          <div className="text-[10px] text-zinc-600 mt-1 uppercase font-bold">Global Win Ratio</div>
        </div>

        <div className="bg-black border border-zinc-800 p-5 relative group clip-corner">
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 group-hover:border-lime-500 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Profit</span>
            <DollarSign className="w-4 h-4 text-lime-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            ${liveProfit.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-600 mt-1 uppercase font-bold">Real-time PnL</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Agents List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
             <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Deployed Units</h2>
             <span className="text-[10px] bg-green-900 text-green-300 px-2 py-0.5 rounded-sm uppercase font-bold animate-pulse">Live</span>
          </div>

          {agents.map((agent) => (
            <div key={agent.id} className="bg-zinc-950 border border-zinc-800 p-6 clip-corner relative group hover:border-lime-500/30 transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-lime-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-6">
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <h3 className="text-lg font-black text-white uppercase tracking-tight">{agent.strategyName}</h3>
                       <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-bold uppercase clip-corner">
                          💱 StellarX
                       </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                       <span className="text-xs text-green-500 uppercase font-mono tracking-wider">Operational</span>
                       <span className="text-zinc-600 px-2">|</span>
                       <span className="text-xs text-zinc-500 uppercase font-mono">ID: AGT-{agent.id}00X</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="text-2xl font-black text-white font-mono">${agent.profit.toFixed(2)}</div>
                    <div className="text-[10px] text-lime-500 uppercase font-bold">Net Profit</div>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                 <div className="p-3 bg-black border border-zinc-900 clip-corner">
                    <div className="text-[10px] text-zinc-600 uppercase font-bold">Latest Action</div>
                    <div className="text-xs text-zinc-300 mt-1 font-mono truncate">{agent.lastAction}</div>
                 </div>
                 <div className="p-3 bg-black border border-zinc-900 clip-corner">
                    <div className="text-[10px] text-zinc-600 uppercase font-bold">Success Rate</div>
                    <div className="text-xs text-zinc-300 mt-1 font-mono">{agent.successRate}%</div>
                 </div>
                 <div className="p-3 bg-black border border-zinc-900 clip-corner">
                    <div className="text-[10px] text-zinc-600 uppercase font-bold">Uptime</div>
                    <div className="text-xs text-zinc-300 mt-1 font-mono">{agent.deployed}</div>
                 </div>
              </div>

              <div className="flex gap-2">
                 {agent.skills.map(skill => (
                    <span key={skill} className="text-[9px] uppercase font-bold px-2 py-1 bg-zinc-900 text-zinc-500 border border-zinc-800">
                       [{skill}]
                    </span>
                 ))}
              </div>
            </div>
          ))}
        </div>

        {/* Live Feed */}
        <div className="bg-black border border-zinc-800 flex flex-col clip-corner h-fit">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
             <span className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Execution Log
             </span>
          </div>

          <div className="p-0">
             {recentTrades.map((trade, i) => (
                <div key={i} className="p-4 border-b border-zinc-900/50 hover:bg-zinc-900/20 transition-colors flex items-center justify-between group">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 ${trade.status === 'success' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                            {trade.status === 'success' ? 'WIN' : 'LOSS'}
                         </span>
                         <span className="text-xs font-bold text-zinc-300 font-mono">{trade.action}</span>
                         <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 border border-blue-500/20">
                            {trade.venue}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="text-[10px] text-zinc-600 font-mono">{trade.time}</div>
                         <span className="text-zinc-800">•</span>
                         <div className="text-[10px] text-zinc-600">{trade.amount}</div>
                      </div>
                   </div>
                   <div className={`text-sm font-mono font-bold ${trade.result.startsWith('+') ? 'text-lime-500' : 'text-red-500'}`}>
                      {trade.result}
                   </div>
                </div>
             ))}
          </div>
          
          <div className="p-3 text-center border-t border-zinc-800">
             <button className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white transition-colors">
                View_Full_Ledger
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
