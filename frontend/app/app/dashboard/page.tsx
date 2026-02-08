"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import Link from "next/link";
import { Card, StatusBadge, BigNumber, Spinner, StatCard, EmptyState } from "@/components/ui";
import {
  withdrawReward,
  getStream,
  saveActivity,
  getAllExecutionMetas,
  type OnChainStream,
} from "@/lib/contract";
import { Activity, ArrowRight, CornerDownRight, Download, Terminal } from "lucide-react";

export default function DashboardPage() {
  const { publicKey, connectWallet, signTx } = useWallet();
  const searchParams = useSearchParams();

  // Try to find the latest execution ID from local storage if not provided in URL
  const [inputExecId, setInputExecId] = useState(() => {
    const urlId = searchParams.get("executionId");
    if (urlId) return urlId;
    
    // Auto-detect latest
    if (typeof window !== 'undefined') {
      const all = getAllExecutionMetas();
      const ids = Object.keys(all).map(Number).sort((a, b) => b - a);
      if (ids.length > 0) return ids[0].toString();
    }
    return "";
  });

  const [executionId, setExecutionId] = useState<number | null>(null);
  const [stream, setStream] = useState<OnChainStream | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const [earned, setEarned] = useState(0);
  const [available, setAvailable] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [txHistory, setTxHistory] = useState<{ amount: number; time: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Auto-load from URL param
  useEffect(() => {
    const idStr = searchParams.get("executionId");
    if (idStr) {
      setInputExecId(idStr);
      loadStream(parseInt(idStr, 10));
    }
  }, [searchParams]);

  const loadStream = async (eId: number) => {
    if (isNaN(eId) || eId <= 0) return;

    setStreamLoading(true);
    setStreamError(null);
    setExecutionId(eId);

    try {
      const s = await getStream(eId);
      if (!s) {
        setStreamError("No reward stream found for this execution. It may not be verified yet.");
        setStreamLoading(false);
        return;
      }
      setStream(s);
    } catch (e: any) {
      setStreamError("Failed to load stream data from contract");
    } finally {
      setStreamLoading(false);
    }
  };

  const handleLookup = () => {
    const eId = parseInt(inputExecId, 10);
    if (!isNaN(eId) && eId > 0) loadStream(eId);
  };

  // Real-time update loop based on on-chain stream data
  useEffect(() => {
    if (!stream) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const duration = stream.end_time - stream.start_time;
      if (duration <= 0) return;

      const elapsedSec = Math.max(0, Math.min(now - stream.start_time, duration));
      const pct = (elapsedSec / duration) * 100;
      const earnedAmt = (stream.total_amount * elapsedSec) / duration;
      const avail = earnedAmt - stream.withdrawn;

      setElapsed(elapsedSec);
      setProgress(Math.min(pct, 100));
      setEarned(parseFloat(earnedAmt.toFixed(2)));
      setAvailable(parseFloat(Math.max(0, avail).toFixed(2)));
    }, 100);
    return () => clearInterval(interval);
  }, [stream]);

  const handleWithdraw = useCallback(async () => {
    if (!publicKey || !stream || !executionId) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > available) {
      setError("Invalid withdrawal amount");
      return;
    }

    setWithdrawing(true);
    setError(null);

    try {
      await withdrawReward(publicKey, executionId, Math.floor(amount), signTx);

      // Refresh stream from chain
      const refreshed = await getStream(executionId);
      if (refreshed) setStream(refreshed);

      setTxHistory((prev) => [{ amount, time: new Date().toLocaleTimeString() }, ...prev]);
      setWithdrawAmount("");

      // Log activity
      saveActivity({
        icon: "◈",
        action: `${amount.toFixed(2)} XLM withdrawn from Execution #${executionId}`,
        time: new Date().toLocaleString(),
      });
    } catch (err: any) {
      console.error("Withdraw error:", err);
      setError(err.message || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  }, [publicKey, stream, executionId, withdrawAmount, available, signTx]);

  // No stream loaded — show lookup form
  if (!stream) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Earnings_Dashboard</h1>
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
             <span className="text-lime-500">System:</span> Track profit-share payments • Real-time Stream
          </p>
        </div>

        <Card className="mb-5">
          <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-bold ml-1">
            Enter_Execution_ID
          </label>
          <div className="flex gap-0">
            <div className="relative flex-1">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-lime-500" />
                <input
                type="number"
                value={inputExecId}
                onChange={(e) => setInputExecId(e.target.value)}
                className="w-full bg-black border border-zinc-800 p-4 pl-6 text-xl font-mono text-white focus:outline-none focus:border-lime-500 placeholder:text-zinc-800"
                placeholder="0001"
                min="1"
                />
            </div>
            <button
              onClick={handleLookup}
              disabled={streamLoading || !inputExecId}
              className="bg-lime-400 text-black px-8 font-black uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 clip-corner-right"
            >
              {streamLoading ? <Spinner size="sm" /> : "Load_Data"}
            </button>
          </div>
          {streamError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3 text-red-500 text-[10px] font-mono uppercase flex items-center gap-2">
               <Activity className="w-3 h-3" />
               Error: {streamError}
            </div>
          )}
        </Card>

        {!streamError && (
          <EmptyState
            label="No Active Data Stream"
            action={
              <div className="flex flex-col gap-3 mt-2 text-center">
                 <div className="text-xs text-zinc-600 font-mono">
                    Awaiting Input... Correct Format: Integer ID
                 </div>
                 <div className="flex flex-col gap-1 text-[10px] uppercase text-zinc-500">
                    <span>Don't have an execution ID?</span>
                    <Link href="/app/execute" className="text-lime-500 hover:text-lime-400 underline underline-offset-4">
                       &gt; Execute Strategy First
                    </Link>
                 </div>
              </div>
            }
          />
        )}
      </div>
    );
  }

  const isComplete = progress >= 100;
  const remainingSeconds = Math.max(0, stream.end_time - Math.floor(Date.now() / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="flex items-end justify-between mb-8 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Profit Share Status</h1>
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
            <CornerDownRight className="w-3 h-3" />
            Execution <span className="text-white">#{executionId}</span>
          </p>
        </div>
        <StatusBadge status={isComplete ? "completed" : "streaming"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Main Balance Card */}
        <div className="lg:col-span-2">
            <Card className={!isComplete ? "border-lime-500/30" : ""}>
                <BigNumber
                value={earned.toFixed(2)}
                label="Expert Earnings (Profit Share)"
                color={isComplete ? "text-zinc-400" : "text-lime-400"}
                />

                <div className="mt-6 p-4 bg-zinc-900/50 border border-zinc-800/50">
                <div className="text-[10px] text-zinc-400 font-bold uppercase mb-3 flex items-center gap-2">
                    <Terminal className="w-3 h-3" />
                    Protocol Logic
                </div>
                <div className="text-xs text-zinc-500 font-mono space-y-2 uppercase">
                    <div className="flex justify-between border-b border-zinc-800 pb-1">
                        <span>Trader Stake</span>
                        <span className="text-zinc-300">{stream.total_amount} XLM</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800 pb-1">
                        <span>Allocation</span>
                        <span className="text-zinc-300">Profit % Split</span>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span>Status</span>
                        <span className={isComplete ? "text-zinc-500" : "text-lime-500 animate-pulse"}>
                            {isComplete ? "Settled" : "Active_Stream"}
                        </span>
                    </div>
                </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 mb-2">
                <div className="flex justify-between text-[10px] text-zinc-600 mb-2 font-mono uppercase tracking-wider">
                    <span>Initiated</span>
                    <span>Target ({stream.total_amount} XLM)</span>
                </div>
                
                {/* Custom Progress Bar */}
                <div className="w-full h-4 bg-black border border-zinc-800 relative p-0.5">
                    {/* Tick Marks */}
                    <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                        {[...Array(10)].map((_, i) => <div key={i} className="w-[1px] h-full bg-zinc-900" />)}
                    </div>
                    
                    <div
                    className="h-full bg-lime-500 relative transition-all duration-100"
                    style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>
                </div>
                </div>

                {/* Time Info */}
                <div className="flex justify-between items-center mt-4 border-t border-zinc-900 pt-3">
                <div className="text-xs text-zinc-500 font-mono uppercase">
                    {isComplete ? (
                    <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                        [End_Of_Stream]
                    </span>
                    ) : (
                    <>
                        TTL: <span className="text-white ml-2">{minutes}:{seconds.toString().padStart(2, "0")}</span>
                    </>
                    )}
                </div>
                <div className="text-xs text-zinc-500 font-mono uppercase">
                    Elapsed: <span className="text-white ml-2">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}</span>
                </div>
                </div>
            </Card>
        </div>

        {/* Stats Column */}
        <div className="flex flex-col gap-4">
            <StatCard label="Available Funds" value={available.toFixed(2)} icon={Activity} trend="READY_TO_CLAIM" />
            <StatCard label="Withdrawn" value={stream.withdrawn.toFixed(2)} icon={Download} />
            <StatCard label="Initial Stake" value={stream.total_amount.toString()} icon={Terminal} />
        </div>
      </div>

      {/* Withdraw Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-lime-500 animate-pulse clip-corner" />
                Claim_Rewards
                </h3>
            </div>
            
            {!publicKey ? (
            <div className="h-32 flex items-center justify-center border border-dashed border-zinc-800 bg-zinc-900/20">
                <button onClick={connectWallet} className="bg-lime-400 text-black px-6 py-2 font-bold uppercase text-xs clip-corner hover:bg-white transition-colors">
                    Connect_Wallet
                </button>
            </div>
            ) : (
            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-black border border-zinc-800 p-4 font-mono text-zinc-300 focus:border-lime-500 focus:outline-none placeholder:text-zinc-800"
                        placeholder="0.00"
                        max={available}
                        min="0"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold uppercase pointer-events-none">XLM</div>
                </div>
                
                <div className="flex gap-4">
                     <button
                        onClick={() => setWithdrawAmount(available.toFixed(2))}
                        className="border border-zinc-800 px-4 py-3 text-[10px] font-bold uppercase text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors clip-corner"
                    >
                        Max_Funds
                    </button>
                    <button
                        onClick={handleWithdraw}
                        disabled={
                            withdrawing ||
                            !withdrawAmount ||
                            parseFloat(withdrawAmount) <= 0 ||
                            parseFloat(withdrawAmount) > available
                        }
                        className="flex-1 bg-lime-400 text-black font-black uppercase tracking-wider text-sm clip-corner hover:bg-white hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {withdrawing ? <Spinner size="sm" /> : <><Download className="w-4 h-4" /> Withdraw</>}
                    </button>
                </div>
            </div>
            )}
        </Card>

        {/* Transaction History */}
        <Card className="h-full">
            <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Transfer_Log
            </h3>
            
            {txHistory.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-zinc-600">
                    <span className="text-[10px] uppercase font-mono mb-2">Log_Empty</span>
                    <div className="w-12 h-1 bg-zinc-800" />
                </div>
            ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                    {txHistory.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border-l-2 border-zinc-800 bg-zinc-900/30 hover:border-lime-500 transition-colors group">
                        <div className="flex items-center gap-3">
                         <span className="text-[10px] text-zinc-600 group-hover:text-lime-500 font-mono">TX_{i.toString().padStart(3, '0')}</span>
                        <span className="text-zinc-300 text-sm font-mono font-bold">
                            {tx.amount.toFixed(2)} XLM
                        </span>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-mono uppercase">{tx.time}</span>
                    </div>
                    ))}
                </div>
            )}
        </Card>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono uppercase flex items-center gap-3">
           <Activity className="w-4 h-4 animate-pulse" />
           {error}
        </div>
      )}
    </div>
  );
}
