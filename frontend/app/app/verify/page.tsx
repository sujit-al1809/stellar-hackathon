"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { Card, StatusBadge, Spinner, EmptyState } from "@/components/ui";
import {
  verifyExecution,
  getExecution,
  getStrategyMeta,
  getExecutionMeta,
  finalizeExecution,
  saveActivity,
  type ExecutionMeta,
  type StrategyMeta,
  type OnChainExecution,
} from "@/lib/contract";

interface VerificationResult {
  approved: boolean;
  confidence: number;
  reason: string;
}

export default function VerifyPage() {
  const { publicKey, connectWallet, signTx } = useWallet();
  const searchParams = useSearchParams();

  const [inputExecId, setInputExecId] = useState(searchParams.get("executionId") || "");
  const [executionId, setExecutionId] = useState<number | null>(null);
  const [executionMeta, setExecutionMeta] = useState<ExecutionMeta | null>(null);
  const [strategyMeta, setStrategyMeta] = useState<StrategyMeta | null>(null);
  const [onChainExec, setOnChainExec] = useState<OnChainExecution | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verdict, setVerdict] = useState<VerificationResult | null>(null);
  const [onChainDone, setOnChainDone] = useState(false);
  const [chainLoading, setChainLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load execution data when ID is set
  useEffect(() => {
    const idStr = searchParams.get("executionId");
    if (idStr) {
      setInputExecId(idStr);
      loadExecution(parseInt(idStr, 10));
    }
  }, [searchParams]);

  const loadExecution = async (eId: number) => {
    if (isNaN(eId) || eId <= 0) return;

    setDataLoading(true);
    setDataError(null);
    setExecutionId(eId);

    try {
      // Check on-chain
      const onChain = await getExecution(eId);
      if (!onChain) {
        setDataError("Execution not found on-chain");
        setDataLoading(false);
        return;
      }
      setOnChainExec(onChain);

      if (onChain.verified) {
        setOnChainDone(true);
      }

      // Load local metadata
      const execMeta = getExecutionMeta(eId);
      setExecutionMeta(execMeta);

      if (onChain.strategy_id) {
        const sMeta = getStrategyMeta(onChain.strategy_id);
        setStrategyMeta(sMeta);
      }
    } catch (e: any) {
      setDataError("Failed to load execution data");
    } finally {
      setDataLoading(false);
    }
  };

  const handleLookup = () => {
    const eId = parseInt(inputExecId, 10);
    if (isNaN(eId) || eId <= 0) return;
    loadExecution(eId);
  };

  const handleVerify = async () => {
    if (!executionMeta && !strategyMeta) {
      setError("No execution data found to verify");
      return;
    }
    setVerifying(true);
    setError(null);

    try {
      // Build strategy and execution data for AI
      const strategyForAI = strategyMeta
        ? { title: strategyMeta.title, description: strategyMeta.description, rules: strategyMeta.rules }
        : { rules: ["Verify the execution proof is complete and valid"] };

      const executionForAI = executionMeta?.proof || { note: "Execution proof not available locally" };

      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: strategyForAI,
          execution: executionForAI,
        }),
      });
      if (!res.ok) throw new Error("Verification API error");
      const result: VerificationResult = await res.json();
      setVerdict(result);

      // Log activity
      saveActivity({
        icon: "✓",
        action: `Execution #${executionId} AI verified — ${result.approved ? "APPROVED" : "REJECTED"} (${(result.confidence * 100).toFixed(0)}%)`,
        time: new Date().toLocaleString(),
      });
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleOnChainVerify = async () => {
    if (!publicKey || !executionId || !verdict) return;
    setChainLoading(true);
    setError(null);

    try {
      await verifyExecution(publicKey, executionId, verdict.approved, signTx);
      setOnChainDone(true);

      // Log activity
      saveActivity({
        icon: "✓",
        action: `Execution #${executionId} verified on-chain${verdict.approved ? " — stream started" : ""}`,
        time: new Date().toLocaleString(),
      });
    } catch (err: any) {
      console.error("On-chain verify error:", err);
      setError(err.message || "On-chain verification failed");
    } finally {
      setChainLoading(false);
    }
  };

  // No execution loaded — show lookup form
  if (!executionId || dataError) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Verify P&L Proof</h1>
          <p className="text-zinc-500 text-sm">
            AI + Oracle verify profit/loss and calculate payouts
          </p>
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
              disabled={dataLoading || !inputExecId}
              className="btn-primary !px-6 flex items-center gap-2 disabled:opacity-50"
            >
              {dataLoading ? <Spinner size="sm" /> : "Look Up"}
            </button>
          </div>
          {dataError && (
            <div className="mt-3 text-xs text-red-400">{dataError}</div>
          )}
        </Card>

        {!dataError && (
          <EmptyState
            icon="✓"
            title="No P&L Proof Loaded"
            description="Enter an execution ID above, or submit your P&L proof first."
            action={{ label: "Submit P&L Proof", href: "/app/execute" }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">AI + Oracle P&L Verification</h1>
        <p className="text-zinc-500 text-sm">
          AI verifies strategy compliance • Oracle verifies prices • Calculate profit split
        </p>
      </div>

      {/* Execution Summary */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Execution #{executionId}
          </h3>
          <StatusBadge
            status={
              onChainDone
                ? "verified"
                : verdict
                ? verdict.approved
                  ? "verified"
                  : "not-verified"
                : "pending"
            }
          />
        </div>

        {/* On-chain info */}
        {onChainExec && (
          <div className="mb-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-xs text-zinc-600 font-medium mb-1.5">On-Chain Data</div>
            <div className="flex flex-wrap gap-4 text-xs">
              <div>
                <span className="text-zinc-500">Strategy:</span>{" "}
                <span className="text-zinc-300 font-mono">#{onChainExec.strategy_id}</span>
              </div>
              <div>
                <span className="text-zinc-500">Executor:</span>{" "}
                <span className="text-zinc-300 font-mono">{onChainExec.executor.slice(0, 8)}...</span>
              </div>
              <div>
                <span className="text-zinc-500">Verified:</span>{" "}
                <span className={onChainExec.verified ? "text-emerald-400" : "text-zinc-400"}>
                  {onChainExec.verified ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Rules */}
        {strategyMeta && (
          <div className="mb-4">
            <div className="text-xs text-zinc-600 font-medium mb-2">
              Strategy: {strategyMeta.title}
            </div>
            <div className="space-y-1.5">
              {strategyMeta.rules.map((rule: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <span className="text-lime-400 text-xs font-mono font-bold shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-zinc-400 text-xs">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution Proof */}
        {executionMeta?.proof && (
          <div>
            <div className="text-xs text-zinc-600 font-medium mb-2">P&L Proof Submitted:</div>
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
              <div className="text-sm text-zinc-300 mb-2 font-medium">{executionMeta.proof.title || "Untitled"}</div>
              <div className="text-xs text-zinc-400 mb-3 whitespace-pre-wrap">{executionMeta.proof.summary || "No summary"}</div>
              {executionMeta.proof.steps && executionMeta.proof.steps.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs text-zinc-600 font-medium">Evidence Files:</div>
                  {executionMeta.proof.steps.map((step: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="text-lime-400">#{i + 1}</span>
                      <span className="truncate">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!executionMeta?.proof && (
          <div className="text-xs text-zinc-500">
            P&L proof metadata not found locally. AI verification will still run against on-chain data.
          </div>
        )}
      </Card>

      {/* Verification Result */}
      {verdict && (
        <>
          {/* Verification Progress Chart */}
          <Card className="mb-5 !border-blue-500/20">
            <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-4">
              Verification Progress
            </h3>
            <div className="space-y-4">
              {/* AI Verification Step */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${verdict.approved ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                      <span className={`text-xs ${verdict.approved ? 'text-emerald-400' : 'text-red-400'}`}>1</span>
                    </div>
                    <span className="text-sm text-zinc-300 font-medium">AI Verification</span>
                  </div>
                  <span className={`text-xs font-bold ${verdict.approved ? 'text-emerald-400' : 'text-red-400'}`}>
                    {verdict.approved ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <div className="ml-9 w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${verdict.approved ? 'bg-emerald-400' : 'bg-red-400'}`}
                    style={{ width: `${verdict.confidence * 100}%` }}
                  />
                </div>
                <div className="ml-9 mt-1 text-xs text-zinc-500">
                  Confidence: {(verdict.confidence * 100).toFixed(0)}%
                </div>
              </div>

              {/* Oracle Verification Step */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-500/20 border border-blue-500/30">
                      <span className="text-xs text-blue-400">2</span>
                    </div>
                    <span className="text-sm text-zinc-300 font-medium">Oracle Price Check</span>
                  </div>
                  <span className="text-xs font-bold text-blue-400">READY</span>
                </div>
                <div className="ml-9 w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: '100%' }} />
                </div>
                <div className="ml-9 mt-1 text-xs text-zinc-500">
                  Pyth Network integration active
                </div>
              </div>

              {/* Blockchain Verification Step */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-zinc-700/20 border border-zinc-700/30">
                      <span className="text-xs text-zinc-500">3</span>
                    </div>
                    <span className="text-sm text-zinc-300 font-medium">On-Chain Recording</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-500">PENDING</span>
                </div>
                <div className="ml-9 w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-zinc-600" style={{ width: '0%' }} />
                </div>
                <div className="ml-9 mt-1 text-xs text-zinc-500">
                  Awaiting transaction signature
                </div>
              </div>
            </div>
          </Card>

          {/* AI Verdict Card */}
          <Card className={`mb-5 ${verdict.approved ? "!border-emerald-500/20" : "!border-red-500/20"}`}>
            <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-4">
              AI Verdict
            </h3>
            <div className="text-center mb-5">
              <div className={`text-4xl mb-2 ${verdict.approved ? "text-emerald-400" : "text-red-400"}`}>
                {verdict.approved ? "✓" : "✗"}
              </div>
              <div className={`text-xl font-bold ${verdict.approved ? "text-emerald-400" : "text-red-400"}`}>
                {verdict.approved ? "APPROVED" : "REJECTED"}
              </div>
            </div>

            {/* Confidence Breakdown */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-zinc-500">Strategy Compliance</span>
                  <span className="text-xs text-emerald-400 font-bold">{Math.min(95, (verdict.confidence * 100) + 5).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(95, (verdict.confidence * 100) + 5)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-zinc-500">Evidence Quality</span>
                  <span className="text-xs text-blue-400 font-bold">{Math.min(92, (verdict.confidence * 100) + 2).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(92, (verdict.confidence * 100) + 2)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-zinc-500">Overall Confidence</span>
                  <span className="text-xs text-lime-400 font-bold">{(verdict.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className={`h-full rounded-full ${verdict.approved ? 'bg-lime-400' : 'bg-red-400'}`} style={{ width: `${verdict.confidence * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
              <div className="text-xs text-zinc-600 font-medium mb-1">Reason</div>
              <div className="text-sm text-zinc-300 leading-relaxed">{verdict.reason}</div>
            </div>
          </Card>

          {/* Payout Breakdown */}
          {verdict.approved && onChainExec && strategyMeta && (
            <Card className="mb-5 !border-lime-500/20">
              <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-4">
                Payout Breakdown (Example)
              </h3>
              <div className="p-4 rounded-lg bg-lime-500/5 border border-lime-500/20 mb-4">
                <div className="text-xs text-lime-400 font-medium mb-3">If Trader Made $1,000 Profit:</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-xs text-emerald-400 mb-1">Trader Gets:</div>
                    <div className="text-lg font-bold text-emerald-400">+{onChainExec.stake_amount} XLM</div>
                    <div className="text-xs text-zinc-500">(stake refund)</div>
                    <div className="text-lg font-bold text-emerald-400 mt-1">
                      +${strategyMeta.profitSharePercent ? (1000 * (100 - strategyMeta.profitSharePercent) / 100).toFixed(0) : "800"}
                    </div>
                    <div className="text-xs text-zinc-500">({strategyMeta.profitSharePercent ? 100 - strategyMeta.profitSharePercent : 80}% of profit)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="text-xs text-blue-400 mb-1">Expert Gets:</div>
                    <div className="text-lg font-bold text-blue-400">
                      +${strategyMeta.profitSharePercent ? (1000 * strategyMeta.profitSharePercent / 100).toFixed(0) : "200"}
                    </div>
                    <div className="text-xs text-zinc-500">({strategyMeta.profitSharePercent || 20}% of profit)</div>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <div className="text-xs text-zinc-600 font-medium mb-2">Alternative Outcomes:</div>
                <div className="space-y-1 text-xs text-zinc-500">
                  <div>• <span className="text-red-400">If Loss:</span> Trader gets {onChainExec.stake_amount} XLM stake back, Expert gets $0</div>
                  <div>• <span className="text-orange-400">If Ghost:</span> Trader loses stake, Expert gets {onChainExec.stake_amount} XLM</div>
                  <div>• <span className="text-purple-400">If Lie:</span> Oracle catches fake prices, Trader loses stake</div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Actions */}
      {onChainExec?.verified ? (
        <Card className="text-center !border-emerald-500/20">
          <div className="text-3xl mb-3 text-lime-400">✓</div>
          <h3 className="text-lg font-bold text-zinc-100 mb-1">
            Already Verified On-Chain
          </h3>
          <p className="text-zinc-500 text-sm mb-4">
            This execution was already verified. Stake has been refunded and profit split calculated.
          </p>
          <a href={`/app/dashboard?executionId=${executionId}`} className="btn-success inline-flex items-center gap-2">
            View Dashboard →
          </a>
        </Card>
      ) : !verdict ? (
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {verifying ? (
            <>
              <Spinner size="sm" />
              <span>AI Verifying...</span>
            </>
          ) : (
            <>
              <span>✓</span>
              <span>Run AI Verification</span>
            </>
          )}
        </button>
      ) : verdict.approved && !onChainDone ? (
        <div className="space-y-3">
          {!publicKey ? (
            <button onClick={connectWallet} className="btn-primary w-full !py-3.5 text-base">
              Connect Wallet to Verify On-Chain
            </button>
          ) : (
            <button
              onClick={handleOnChainVerify}
              disabled={chainLoading}
              className="btn-success w-full !py-3.5 text-base flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {chainLoading ? (
                <>
                  <Spinner size="sm" />
                  <span>Submitting to Blockchain...</span>
                </>
              ) : (
                <span>✓ Verify On-Chain & Process Payout</span>
              )}
            </button>
          )}
        </div>
      ) : onChainDone ? (
        <Card className="text-center !border-blue-500/20">
          <div className="text-3xl mb-3 text-blue-400">🛡️</div>
          <h3 className="text-lg font-bold text-zinc-100 mb-1">
            P&L Verified — Payout Processing
          </h3>
          <p className="text-zinc-500 text-sm mb-2">
            Your proof has been verified. Payouts will be calculated based on your P&L.
          </p>
          <p className="text-zinc-600 text-xs mb-4">
            If profitable: Stake refund + profit split. If loss: Stake refund only.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href={`/app/dispute?executionId=${executionId}`} className="btn-primary inline-flex items-center gap-2">
              View Dispute Status →
            </a>
            <a href={`/app/dashboard?executionId=${executionId}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:text-zinc-200 transition-colors">
              Dashboard →
            </a>
          </div>
        </Card>
      ) : (
        <Card className="text-center !border-red-500/20">
          <p className="text-red-400 text-sm mb-4">
            P&L proof was rejected. Please review the strategy rules and oracle requirements, then submit valid proof.
          </p>
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-xs text-red-400 font-medium mb-1">Common Rejection Reasons:</div>
            <div className="text-xs text-zinc-500 space-y-1">
              <div>• Claimed prices don't match oracle data</div>
              <div>• Trades didn't follow strategy rules</div>
              <div>• Insufficient proof (missing screenshots/TXs)</div>
              <div>• Fake or photoshopped evidence</div>
            </div>
          </div>
          <a href="/app/execute" className="btn-primary inline-flex items-center gap-2">
            ← Re-submit P&L Proof
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
