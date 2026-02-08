"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { useRouter } from "next/navigation";
import { 
  Play, ArrowRight, CheckCircle, Circle, Zap, Bot, 
  Shield, DollarSign, Clock, ExternalLink, Sparkles,
  FileCheck, AlertTriangle, Wallet, Timer, TrendingUp
} from "lucide-react";

// =============================================================
// STRATFLOW HACKATHON DEMO - THE WINNING FLOW
// =============================================================
// This page guides judges through the COMPLETE value proposition:
//
// STEP 1: Expert creates strategy + locks reward (1000 XLM)
// STEP 2: Trader stakes (100 XLM) & gets strategy access
// STEP 3: AI Agent executes trades on StellarX
// STEP 4: AI verifies P&L proof (Claude analysis)
// STEP 5: Dispute window (60s) - Expert can challenge
// STEP 6: Reward streams to trader + Expert gets profit share
// =============================================================

const DEMO_STEPS = [
  {
    id: 1,
    title: "Expert Creates Strategy",
    subtitle: "Lock reward in escrow",
    description: "A trading expert publishes their strategy on-chain with a 1000 XLM reward. The reward is locked in the Soroban smart contract until a trader successfully executes it.",
    action: "Create Strategy",
    href: "/app/create",
    icon: Sparkles,
    color: "lime",
    details: [
      "Title: 'Bitcoin Scalping - RSI Based'",
      "Reward: 1000 XLM (locked in contract)",
      "Rules: Buy when RSI < 30, Sell when RSI > 70",
      "Profit Share: 20% to Expert, 80% to Executor"
    ],
    onChain: true,
  },
  {
    id: 2,
    title: "Trader Stakes & Executes",
    subtitle: "Skin in the game",
    description: "A trader finds the strategy, stakes 10% (100 XLM) as collateral, and gains access to the strategy rules. They then execute trades on StellarX.",
    action: "Browse & Stake",
    href: "/app/marketplace",
    icon: Wallet,
    color: "blue",
    details: [
      "Browse strategy marketplace",
      "Stake 100 XLM (10% of reward) as collateral",
      "Get access to full strategy rules",
      "Execute trades on StellarX DEX"
    ],
    onChain: true,
  },
  {
    id: 3,
    title: "AI Agent Trades Autonomously",
    subtitle: "Real Stellar transactions",
    description: "Our AI agent executes the strategy automatically on Stellar Testnet. Every trade is a real on-chain transaction with verifiable memos.",
    action: "Watch AI Trade",
    href: "/app/agents",
    icon: Bot,
    color: "emerald",
    details: [
      "AI scans market for opportunities",
      "Executes batch transactions on Stellar",
      "Generates verifiable trade history",
      "Auto-submits P&L proof when done"
    ],
    onChain: true,
  },
  {
    id: 4,
    title: "AI Verifies P&L Proof",
    subtitle: "Claude analyzes execution",
    description: "Claude AI analyzes the trading proof, cross-references strategy rules, and assigns a confidence score. High confidence = auto-approve.",
    action: "Verify Proof",
    href: "/app/verify",
    icon: FileCheck,
    color: "purple",
    details: [
      "AI checks proof against strategy rules",
      "Confidence score: 0-100%",
      "≥85% confidence = Auto-approve",
      "Records verdict on-chain"
    ],
    onChain: true,
  },
  {
    id: 5,
    title: "Dispute Window (60s)",
    subtitle: "Expert can challenge",
    description: "After AI approval, the strategy creator has 60 seconds to challenge if they believe the proof is fraudulent. No dispute = auto-finalize.",
    action: "View Disputes",
    href: "/app/dispute",
    icon: AlertTriangle,
    color: "orange",
    details: [
      "60-second window (24h in production)",
      "Only strategy creator can dispute",
      "Secondary AI review resolves disputes",
      "Fraud = Executor loses stake"
    ],
    onChain: true,
  },
  {
    id: 6,
    title: "Reward Streams to Trader",
    subtitle: "Time-locked payout",
    description: "After the dispute window, reward streams to the executor over 5 minutes. The expert gets their profit share automatically.",
    action: "View Payouts",
    href: "/app/submissions",
    icon: DollarSign,
    color: "lime",
    details: [
      "Reward unlocks progressively (5 min stream)",
      "Executor withdraws earned XLM anytime",
      "Expert gets 20% profit share",
      "Stake returns to executor on success"
    ],
    onChain: true,
  },
];

export default function DemoPage() {
  const { publicKey, connectWallet } = useWallet();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showQuickStart, setShowQuickStart] = useState(true);

  // Auto-advance demo based on localStorage flags
  useEffect(() => {
    const checkProgress = () => {
      const createdStrategy = localStorage.getItem("stratflow_demo_strategy");
      const executedTrade = localStorage.getItem("stratflow_executions");
      const verified = localStorage.getItem("stratflow_verified");
      
      if (createdStrategy) setCompletedSteps(prev => prev.includes(1) ? prev : [...prev, 1]);
      if (executedTrade) setCompletedSteps(prev => {
        const newSteps = [2, 3].filter(s => !prev.includes(s));
        return [...prev, ...newSteps];
      });
      if (verified) setCompletedSteps(prev => prev.includes(4) ? prev : [...prev, 4]);
    };
    checkProgress();
    const interval = setInterval(checkProgress, 2000);
    return () => clearInterval(interval);
  }, []);

  const startFullDemo = () => {
    setShowQuickStart(false);
    router.push("/app/agents");
  };

  const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    lime: { bg: "bg-lime-500/10", border: "border-lime-500/30", text: "text-lime-400", glow: "shadow-lime-500/20" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", glow: "shadow-blue-500/20" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", glow: "shadow-purple-500/20" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", glow: "shadow-orange-500/20" },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Hero Header */}
      <div className="text-center py-8 border-b border-zinc-900">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-lime-500/10 border border-lime-500/30 rounded-full mb-4">
          <Zap className="w-4 h-4 text-lime-400" />
          <span className="text-xs font-bold text-lime-400 uppercase tracking-wider">Stellar Build-A-Thon Chennai 2026</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-3">
          STRATFLOW <span className="text-lime-400">DEMO</span>
        </h1>
        <p className="text-zinc-500 max-w-2xl mx-auto mb-6">
          AI-Verified Strategy Marketplace on Stellar. Experts monetize trading strategies, 
          Traders execute and prove results, Smart contracts handle escrow and payouts.
        </p>
        
        {/* Value Props */}
        <div className="flex flex-wrap justify-center gap-4 text-xs uppercase tracking-wider">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800">
            <Shield className="w-3 h-3 text-lime-400" /> Soroban Smart Contracts
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800">
            <Bot className="w-3 h-3 text-blue-400" /> AI Verification (Claude)
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> StellarX DEX Trading
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800">
            <Timer className="w-3 h-3 text-orange-400" /> Dispute Resolution
          </div>
        </div>
      </div>

      {/* Quick Start Panel */}
      {showQuickStart && (
        <div className="bg-gradient-to-r from-lime-500/5 via-emerald-500/5 to-blue-500/5 border border-lime-500/20 p-8 clip-corner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white uppercase mb-2 flex items-center gap-3">
                <Play className="w-6 h-6 text-lime-400" />
                One-Click Demo
              </h2>
              <p className="text-sm text-zinc-400 mb-4">
                Watch our AI agent execute a complete trading cycle on Stellar Testnet. 
                Real transactions, real verification, real payouts.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
                <span className="px-2 py-1 bg-zinc-900 border border-zinc-800">3 Batch Transactions</span>
                <span className="px-2 py-1 bg-zinc-900 border border-zinc-800">AI Proof Generation</span>
                <span className="px-2 py-1 bg-zinc-900 border border-zinc-800">On-Chain Verification</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {!publicKey ? (
                <button 
                  onClick={connectWallet}
                  className="px-8 py-4 bg-lime-500 text-black font-black uppercase text-lg hover:bg-lime-400 transition-all clip-corner flex items-center gap-3"
                >
                  <Wallet className="w-5 h-5" />
                  Connect Freighter
                </button>
              ) : (
                <button 
                  onClick={startFullDemo}
                  className="px-8 py-4 bg-lime-500 text-black font-black uppercase text-lg hover:bg-lime-400 transition-all clip-corner flex items-center gap-3 animate-pulse"
                >
                  <Play className="w-5 h-5 fill-black" />
                  Start Full Demo
                </button>
              )}
              <div className="text-[10px] text-zinc-600 text-center uppercase">
                {publicKey ? `Connected: ${publicKey.slice(0, 8)}...` : "Testnet wallet required"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The Flow Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">The Complete Flow</h2>
          <div className="text-xs text-zinc-600 uppercase tracking-wider">
            {completedSteps.length} / {DEMO_STEPS.length} Steps Completed
          </div>
        </div>

        <div className="space-y-4">
          {DEMO_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === index;
            const colors = colorClasses[step.color] || colorClasses.lime;
            const Icon = step.icon;

            return (
              <div 
                key={step.id}
                className={`group relative border p-6 transition-all hover:border-opacity-70 clip-corner ${
                  isCompleted 
                    ? "bg-zinc-950 border-emerald-500/30" 
                    : isCurrent 
                      ? `${colors.bg} ${colors.border}` 
                      : "bg-black border-zinc-800 hover:border-zinc-700"
                }`}
                onClick={() => setCurrentStep(index)}
              >
                {/* Connection Line */}
                {index < DEMO_STEPS.length - 1 && (
                  <div className={`absolute left-10 top-full w-0.5 h-4 ${
                    isCompleted ? "bg-emerald-500/50" : "bg-zinc-800"
                  }`} />
                )}

                <div className="flex items-start gap-5">
                  {/* Step Number */}
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isCompleted 
                      ? "bg-emerald-500/20 border border-emerald-500/30" 
                      : `${colors.bg} border ${colors.border}`
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-xs font-mono ${colors.text} uppercase tracking-wider`}>
                        Step {step.id}
                      </span>
                      {step.onChain && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wider">
                          On-Chain
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-xs text-zinc-500 mb-3">{step.subtitle}</p>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-4">{step.description}</p>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                      {step.details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                          <Circle className="w-1.5 h-1.5 fill-current shrink-0" />
                          {detail}
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Link 
                      href={step.href}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase transition-all clip-corner ${
                        isCompleted 
                          ? "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                          : `${colors.bg} border ${colors.border} ${colors.text} hover:bg-opacity-30`
                      }`}
                    >
                      {step.action}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Contract Highlight */}
      <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 p-6 clip-corner">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Soroban Smart Contract</h3>
            <p className="text-sm text-zinc-400 mb-4">
              All logic is on-chain: strategy creation, stake escrow, AI verification recording, 
              dispute handling, and time-locked reward streaming. No centralized backend for money flow.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400">create_strategy()</span>
              <span className="text-[10px] px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400">submit_execution()</span>
              <span className="text-[10px] px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400">verify_execution()</span>
              <span className="text-[10px] px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400">raise_dispute()</span>
              <span className="text-[10px] px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400">finalize_execution()</span>
              <span className="text-[10px] px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400">withdraw_reward()</span>
            </div>
          </div>
          <a 
            href="https://stellar.expert/explorer/testnet" 
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-500 text-white text-xs font-bold uppercase hover:bg-blue-400 transition-all clip-corner flex items-center gap-2"
          >
            Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8">
        <div className="bg-black border border-zinc-800 p-5 text-center">
          <div className="text-3xl font-black text-lime-400 font-mono mb-1">$1,200</div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Prize Pool</div>
        </div>
        <div className="bg-black border border-zinc-800 p-5 text-center">
          <div className="text-3xl font-black text-blue-400 font-mono mb-1">24h</div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Build Time</div>
        </div>
        <div className="bg-black border border-zinc-800 p-5 text-center">
          <div className="text-3xl font-black text-purple-400 font-mono mb-1">6</div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider">On-Chain Ops</div>
        </div>
        <div className="bg-black border border-zinc-800 p-5 text-center">
          <div className="text-3xl font-black text-emerald-400 font-mono mb-1">100%</div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Stellar Powered</div>
        </div>
      </div>
    </div>
  );
}
