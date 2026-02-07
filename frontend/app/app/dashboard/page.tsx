"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { Card, StatusBadge, BigNumber, Spinner, StatCard, EmptyState } from "@/components/ui";
import {
  withdrawReward,
  getStream,
  saveActivity,
  type OnChainStream,
} from "@/lib/contract";

export default function DashboardPage() {
  const { publicKey, connectWallet, signTx } = useWallet();
  const searchParams = useSearchParams();

  const [inputExecId, setInputExecId] = useState(searchParams.get("executionId") || "");
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Expert Earnings Dashboard</h1>
          <p className="text-zinc-500 text-sm">Track profit-share payments • Earn as traders profit</p>
        </div>

        <Card className="mb-5">
          <label className="block text-sm text-zinc-400 mb-2 font-medium">
            Execution ID
          </label>
          <div className="flex gap-2.5">
            <input
              type="number"
              value={inputExecId}
              onChange={(e) => setInputExecId(e.target.value)}
              className="surface-input text-xl font-mono flex-1"
              placeholder="1"
              min="1"
            />
            <button
              onClick={handleLookup}
              disabled={streamLoading || !inputExecId}
              className="btn-primary !px-6 flex items-center gap-2 disabled:opacity-50"
            >
              {streamLoading ? <Spinner size="sm" /> : "Load Stream"}
            </button>
          </div>
          {streamError && (
            <div className="mt-3 text-xs text-red-400">{streamError}</div>
          )}
        </Card>

        {!streamError && (
          <EmptyState
            icon="◈"
            title="No Active Payments"
            description="Enter an execution ID to track profit-share payments, or publish a trading strategy first."
            action={{ label: "Publish Strategy", href: "/app/create" }}
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
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Profit-Share Earnings</h1>
          <p className="text-zinc-500 text-sm">
            Execution #{executionId} — Earn percentage of trader's profits
          </p>
        </div>
        <StatusBadge status={isComplete ? "completed" : "streaming"} />
      </div>

      {/* Main Balance */}
      <Card className={`mb-6 ${!isComplete ? "!border-lime-500/20" : ""}`}>
        <BigNumber
          value={earned.toFixed(2)}
          label="Expert Earnings (Profit Share)"
          color={isComplete ? "text-zinc-200" : "text-lime-400"}
        />

        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="text-xs text-blue-400 font-medium mb-2">How Profit-Share Works:</div>
          <div className="text-xs text-zinc-500 space-y-1">
            <div>• Trader stakes {stream.total_amount} XLM (refundable regardless of outcome)</div>
            <div>• If profitable: You earn % of their profit, they keep rest + stake</div>
            <div>• If loss: Trader gets stake back, you earn $0</div>
            <div>• Aligned incentives — you both win when they profit!</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 mb-2">
          <div className="flex justify-between text-xs text-zinc-600 mb-1.5 font-mono">
            <span>0 XLM</span>
            <span>{stream.total_amount} XLM</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-lime-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Time Info */}
        <div className="flex justify-between items-center mt-3">
          <div className="text-sm text-zinc-500">
            {isComplete ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                ✓ Stream Complete
              </span>
            ) : (
              <>
                Time remaining:{" "}
                <span className="text-zinc-200 font-mono font-bold">
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
              </>
            )}
          </div>
          <div className="text-sm text-zinc-500">
            Elapsed:{" "}
            <span className="text-zinc-200 font-mono font-bold">
              {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Available Now" value={available.toFixed(2)} icon="◆" color="lime" />
        <StatCard label="Already Withdrawn" value={stream.withdrawn.toFixed(2)} icon="↓" color="default" />
        <StatCard label="Trader's Stake" value={stream.total_amount.toString()} icon="◈" color="amber" />
      </div>

      {/* Withdraw */}
      <Card className="mb-6">
        <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="dot-live" />
          Withdraw Profit-Share Earnings
        </h3>
        <p className="text-xs text-zinc-500 mb-4">
          These earnings come from your percentage of the trader's profits. Available anytime.
        </p>

        {!publicKey ? (
          <button onClick={connectWallet} className="btn-primary w-full !py-3">
            Connect Wallet to Withdraw
          </button>
        ) : (
          <div className="flex gap-2.5">
            <div className="flex-1 relative">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="surface-input text-lg font-mono"
                placeholder="Amount"
                max={available}
                min="0"
              />
              <button
                onClick={() => setWithdrawAmount(available.toFixed(2))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-lime-400 hover:text-lime-300 font-bold"
              >
                MAX
              </button>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={
                withdrawing ||
                !withdrawAmount ||
                parseFloat(withdrawAmount) <= 0 ||
                parseFloat(withdrawAmount) > available
              }
              className="btn-success !px-8 flex items-center gap-2 disabled:opacity-50"
            >
              {withdrawing ? <Spinner size="sm" /> : <span>Withdraw</span>}
            </button>
          </div>
        )}
      </Card>

      {/* Transaction History */}
      {txHistory.length > 0 && (
        <Card>
          <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Transaction History
          </h3>
          <div className="space-y-1.5">
            {txHistory.map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-emerald-400 text-xs">↓</span>
                  </div>
                  <span className="text-zinc-200 text-sm font-mono font-bold">
                    {tx.amount.toFixed(2)} XLM
                  </span>
                </div>
                <span className="text-xs text-zinc-600 font-mono">{tx.time}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
