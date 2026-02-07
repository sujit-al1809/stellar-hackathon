"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { Card, Spinner, StatusBadge } from "@/components/ui";
import {
  getExecution,
  getStrategy,
  getStrategyMeta,
  getExecutionMeta,
  raiseDispute,
  resolveDispute,
  finalizeExecution,
  saveActivity,
  type OnChainExecution,
  type OnChainStrategy,
  type StrategyMeta,
  type ExecutionMeta,
} from "@/lib/contract";

const DISPUTE_REASONS: Record<number, { label: string; description: string }> = {
  1: { label: "Fake Proof", description: "The execution proof is fabricated or contains false information" },
  2: { label: "Incomplete", description: "The proof does not satisfy all strategy rules" },
  3: { label: "Plagiarized", description: "The proof is copied from another source or submission" },
};

const STATUS_LABELS: Record<string, { label: string; color: string; description: string }> = {
  Pending: { label: "Pending AI Review", color: "text-yellow-400", description: "Waiting for AI verification" },
  Approved: { label: "AI Approved — Dispute Window Open", color: "text-blue-400", description: "You can challenge this execution before rewards are released" },
  Disputed: { label: "Dispute Active", color: "text-orange-400", description: "Under secondary review" },
  Cleared: { label: "Cleared — Stream Active", color: "text-emerald-400", description: "Dispute was dismissed, rewards are streaming" },
  Slashed: { label: "Executor Slashed", color: "text-red-400", description: "Dispute upheld — executor's stake was burned, your reward is safe" },
  Finalized: { label: "Finalized — Stream Active", color: "text-emerald-400", description: "No dispute raised, rewards are streaming" },
  Rejected: { label: "AI Rejected", color: "text-red-400", description: "AI found the proof inadequate — your reward is safe" },
};

export default function DisputePage() {
  const { publicKey, connectWallet, signTx } = useWallet();
  const searchParams = useSearchParams();

  const [inputExecId, setInputExecId] = useState(searchParams.get("executionId") || "");
  const [executionId, setExecutionId] = useState<number | null>(null);

  const [execution, setExecution] = useState<OnChainExecution | null>(null);
  const [strategy, setStrategy] = useState<OnChainStrategy | null>(null);
  const [strategyMeta, setStrategyMeta] = useState<StrategyMeta | null>(null);
  const [executionMeta, setExecutionMeta] = useState<ExecutionMeta | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dispute form
  const [selectedReason, setSelectedReason] = useState<number>(1);
  const [disputeDetails, setDisputeDetails] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [disputeId, setDisputeId] = useState<number | null>(null);

  // Dispute resolution
  const [resolving, setResolving] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<{
    upheld: boolean;
    confidence: number;
    reason: string;
    evidence: string[];
  } | null>(null);

  // Countdown
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Auto-finalize
  const [finalizing, setFinalizing] = useState(false);

  const loadExecution = async (eId: number) => {
    if (isNaN(eId) || eId <= 0) return;
    setLoading(true);
    setError(null);
    setExecutionId(eId);

    try {
      const exec = await getExecution(eId);
      if (!exec) {
        setError("Execution not found on-chain");
        setLoading(false);
        return;
      }
      setExecution(exec);

      const strat = await getStrategy(exec.strategy_id);
      setStrategy(strat);

      setStrategyMeta(getStrategyMeta(exec.strategy_id));
      setExecutionMeta(getExecutionMeta(eId));
    } catch (e: any) {
      setError("Failed to load execution data");
    } finally {
      setLoading(false);
    }
  };

  // Dispute window countdown
  useEffect(() => {
    if (!execution || execution.status !== "Approved" || execution.approved_at === 0) {
      setTimeLeft(null);
      return;
    }

    const disputeWindow = 60; // matches contract
    const expiresAt = execution.approved_at + disputeWindow;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = expiresAt - now;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [execution]);

  const handleLookup = () => {
    const eId = parseInt(inputExecId, 10);
    if (isNaN(eId) || eId <= 0) return;
    loadExecution(eId);
  };

  const handleDispute = async () => {
    if (!publicKey || !executionId) return;
    setDisputing(true);
    setError(null);

    try {
      const dId = await raiseDispute(publicKey, executionId, selectedReason, signTx);
      setDisputeId(dId);

      // Now trigger secondary AI review
      setResolving(true);

      const strategyForAI = strategyMeta
        ? { title: strategyMeta.title, description: strategyMeta.description, rules: strategyMeta.rules }
        : { rules: ["Verify the execution proof is complete and valid"] };
      const executionForAI = executionMeta?.proof || {};

      const res = await fetch("/api/verify/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: strategyForAI,
          execution: executionForAI,
          disputeReason: `${DISPUTE_REASONS[selectedReason]?.label}: ${disputeDetails}`,
        }),
      });

      if (!res.ok) throw new Error("Dispute review API error");
      const result = await res.json();
      setResolutionResult(result);

      // Resolve on-chain based on AI dispute review
      await resolveDispute(publicKey, executionId, result.upheld, signTx);

      // Reload execution state
      const exec = await getExecution(executionId);
      setExecution(exec);

      saveActivity({
        icon: result.upheld ? "🛡️" : "⚖️",
        action: `Dispute for Execution #${executionId} ${result.upheld ? "UPHELD — executor slashed" : "DISMISSED — stream started"}`,
        time: new Date().toLocaleString(),
      });
    } catch (err: any) {
      console.error("Dispute error:", err);
      setError(err.message || "Failed to submit dispute");
    } finally {
      setDisputing(false);
      setResolving(false);
    }
  };

  const handleFinalize = async () => {
    if (!publicKey || !executionId) return;
    setFinalizing(true);
    setError(null);

    try {
      await finalizeExecution(publicKey, executionId, signTx);
      const exec = await getExecution(executionId);
      setExecution(exec);

      saveActivity({
        icon: "✅",
        action: `Execution #${executionId} finalized — stream started`,
        time: new Date().toLocaleString(),
      });
    } catch (err: any) {
      setError(err.message || "Failed to finalize");
    } finally {
      setFinalizing(false);
    }
  };

  const statusInfo = execution ? STATUS_LABELS[execution.status] || STATUS_LABELS.Pending : null;
  const canDispute = execution?.status === "Approved" && (timeLeft === null || timeLeft > 0);
  const canFinalize = execution?.status === "Approved" && timeLeft === 0;
  const isCreator = publicKey && strategy?.creator && strategy.creator === publicKey;

  // Lookup screen
  if (!executionId || error === "Execution not found on-chain") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">🛡️ Dispute Center</h1>
          <p className="text-zinc-500 text-sm">
            Protect your strategy rewards — challenge suspicious executions
          </p>
        </div>

        <Card className="mb-5">
          <label className="block text-sm text-zinc-400 mb-2 font-medium">
            Execution ID to Review
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
              disabled={loading || !inputExecId}
              className="btn-primary !px-6 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Spinner size="sm" /> : "Look Up"}
            </button>
          </div>
          {error && <div className="mt-3 text-xs text-red-400">{error}</div>}
        </Card>

        {/* How it works */}
        <Card>
          <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-4">
            How Dispute Protection Works
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">1</div>
              <div>
                <div className="text-sm text-zinc-200 font-medium">Executor Stakes 10%</div>
                <div className="text-xs text-zinc-500">Executors must lock 10% of the reward as a good-faith deposit</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">2</div>
              <div>
                <div className="text-sm text-zinc-200 font-medium">AI Verifies → Dispute Window Opens</div>
                <div className="text-xs text-zinc-500">After AI approval, you have 60 seconds (demo) to challenge</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">3</div>
              <div>
                <div className="text-sm text-zinc-200 font-medium">Secondary AI Review</div>
                <div className="text-xs text-zinc-500">A stricter fraud-detection AI re-examines the proof</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">4</div>
              <div>
                <div className="text-sm text-zinc-200 font-medium">Resolution</div>
                <div className="text-xs text-zinc-500">If upheld: executor stake slashed, your reward is safe. If dismissed: stream starts normally.</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">🛡️ Dispute Center</h1>
        <p className="text-zinc-500 text-sm">
          Execution #{executionId} — Review and challenge
        </p>
      </div>

      {/* Status Banner */}
      {statusInfo && (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest">Execution Status</h3>
            <StatusBadge status={execution?.verified ? "verified" : execution?.status === "Rejected" || execution?.status === "Slashed" ? "not-verified" : "pending"} />
          </div>
          <div className={`text-lg font-bold ${statusInfo.color} mb-1`}>{statusInfo.label}</div>
          <div className="text-xs text-zinc-500">{statusInfo.description}</div>

          {/* Dispute window countdown */}
          {execution?.status === "Approved" && timeLeft !== null && (
            <div className={`mt-3 p-3 rounded-lg border ${timeLeft > 0 ? "bg-orange-500/5 border-orange-500/20" : "bg-zinc-900/50 border-zinc-800/50"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Dispute Window</span>
                <span className={`text-lg font-mono font-bold ${timeLeft > 0 ? "text-orange-400" : "text-zinc-500"}`}>
                  {timeLeft > 0 ? `${timeLeft}s remaining` : "EXPIRED"}
                </span>
              </div>
              <div className="mt-2 w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-400 transition-all duration-1000"
                  style={{ width: `${Math.max(0, (timeLeft / 60) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Execution Details */}
      <Card className="mb-5">
        <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-3">Execution Details</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-zinc-500 mb-0.5">Strategy</div>
            <div className="text-zinc-200 font-mono">#{execution?.strategy_id}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-zinc-500 mb-0.5">Executor</div>
            <div className="text-zinc-200 font-mono">{execution?.executor?.slice(0, 12)}...</div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-zinc-500 mb-0.5">Reward</div>
            <div className="text-zinc-200 font-mono">{strategy?.reward_amount} XLM</div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-zinc-500 mb-0.5">Executor Stake</div>
            <div className="text-orange-400 font-mono">{execution?.stake_amount} XLM</div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-zinc-500 mb-0.5">AI Confidence</div>
            <div className={`font-mono font-bold ${(execution?.confidence || 0) >= 85 ? "text-emerald-400" : "text-yellow-400"}`}>
              {execution?.confidence || 0}%
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-zinc-500 mb-0.5">Your Role</div>
            <div className={isCreator ? "text-lime-400 font-medium" : "text-zinc-400"}>
              {isCreator ? "Strategy Creator ✓" : "Observer"}
            </div>
          </div>
        </div>
      </Card>

      {/* Execution Proof Preview */}
      {executionMeta?.proof && (
        <Card className="mb-5">
          <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-3">
            Submitted Proof
          </h3>
          {strategyMeta && (
            <div className="mb-3 text-xs text-zinc-500">
              Strategy: <span className="text-zinc-300">{strategyMeta.title}</span>
            </div>
          )}
          <pre className="text-xs text-lime-400/80 bg-zinc-900/80 rounded-lg p-4 overflow-x-auto font-mono border border-zinc-800/50">
            {JSON.stringify(executionMeta.proof, null, 2)}
          </pre>
        </Card>
      )}

      {/* Dispute Form — Only for strategy creator during dispute window */}
      {canDispute && isCreator && !disputeId && (
        <Card className="mb-5 !border-orange-500/20">
          <h3 className="text-xs text-orange-400 font-medium uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>⚠️</span> Raise a Dispute
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">
                Reason for Dispute
              </label>
              <div className="space-y-2">
                {Object.entries(DISPUTE_REASONS).map(([code, info]) => (
                  <label
                    key={code}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReason === Number(code)
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dispute-reason"
                      checked={selectedReason === Number(code)}
                      onChange={() => setSelectedReason(Number(code))}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-sm text-zinc-200 font-medium">{info.label}</div>
                      <div className="text-xs text-zinc-500">{info.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5 font-medium">
                Additional Details (optional)
              </label>
              <textarea
                value={disputeDetails}
                onChange={(e) => setDisputeDetails(e.target.value)}
                rows={3}
                className="surface-input resize-none"
                placeholder="Describe why you believe this execution is invalid..."
              />
            </div>

            <button
              onClick={handleDispute}
              disabled={disputing || resolving}
              className="w-full py-3 px-4 rounded-lg font-medium text-sm bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {disputing ? (
                <>
                  <Spinner size="sm" />
                  <span>{resolving ? "Secondary AI Reviewing..." : "Submitting Dispute On-Chain..."}</span>
                </>
              ) : (
                <span>🛡️ Raise Dispute & Trigger Review</span>
              )}
            </button>
          </div>
        </Card>
      )}

      {/* Can't dispute — not creator */}
      {canDispute && !isCreator && publicKey && (
        <Card className="mb-5 text-center">
          <div className="text-zinc-500 text-sm">
            Only the strategy creator can raise disputes.
          </div>
        </Card>
      )}

      {/* Finalize button — anyone can call after window expires */}
      {canFinalize && (
        <Card className="mb-5">
          <div className="text-center">
            <div className="text-zinc-400 text-sm mb-3">
              Dispute window has expired with no challenges.
            </div>
            {publicKey ? (
              <button
                onClick={handleFinalize}
                disabled={finalizing}
                className="btn-success !py-3 inline-flex items-center gap-2 disabled:opacity-50"
              >
                {finalizing ? (
                  <>
                    <Spinner size="sm" />
                    <span>Finalizing...</span>
                  </>
                ) : (
                  <span>✓ Finalize & Start Reward Stream</span>
                )}
              </button>
            ) : (
              <button onClick={connectWallet} className="btn-primary">
                Connect Wallet to Finalize
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Dispute Resolution Result */}
      {resolutionResult && (
        <Card className={`mb-5 ${resolutionResult.upheld ? "!border-red-500/20" : "!border-emerald-500/20"}`}>
          <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-4">
            Dispute Resolution
          </h3>
          <div className="text-center mb-4">
            <div className={`text-4xl mb-2 ${resolutionResult.upheld ? "text-red-400" : "text-emerald-400"}`}>
              {resolutionResult.upheld ? "🛡️" : "⚖️"}
            </div>
            <div className={`text-xl font-bold ${resolutionResult.upheld ? "text-red-400" : "text-emerald-400"}`}>
              {resolutionResult.upheld ? "DISPUTE UPHELD" : "DISPUTE DISMISSED"}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {resolutionResult.upheld
                ? "Executor's stake has been slashed. Your reward is protected."
                : "The execution was found legitimate. Reward stream has started."}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
              <span className="text-sm text-zinc-500">AI Confidence</span>
              <span className="text-sm text-zinc-200 font-mono font-bold">
                {(resolutionResult.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
              <div className="text-xs text-zinc-600 font-medium mb-1">Reason</div>
              <div className="text-sm text-zinc-300 leading-relaxed">{resolutionResult.reason}</div>
            </div>
            {resolutionResult.evidence.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <div className="text-xs text-zinc-600 font-medium mb-2">Evidence Found</div>
                <ul className="space-y-1">
                  {resolutionResult.evidence.map((e, i) => (
                    <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                      <span className="text-red-400 shrink-0">•</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Already resolved states */}
      {execution?.status === "Slashed" && !resolutionResult && (
        <Card className="text-center !border-red-500/20">
          <div className="text-3xl mb-3">🛡️</div>
          <h3 className="text-lg font-bold text-zinc-100 mb-1">Executor Was Slashed</h3>
          <p className="text-zinc-500 text-sm">
            The dispute was upheld. The executor&apos;s stake was burned and your reward is protected.
          </p>
        </Card>
      )}

      {(execution?.status === "Finalized" || execution?.status === "Cleared") && !resolutionResult && (
        <Card className="text-center !border-emerald-500/20">
          <div className="text-3xl mb-3">✅</div>
          <h3 className="text-lg font-bold text-zinc-100 mb-1">
            {execution.status === "Cleared" ? "Dispute Dismissed — Stream Active" : "Finalized — Stream Active"}
          </h3>
          <p className="text-zinc-500 text-sm mb-4">
            Rewards are streaming to the executor.
          </p>
          <a href={`/app/dashboard?executionId=${executionId}`} className="btn-success inline-flex items-center gap-2">
            View Dashboard →
          </a>
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
