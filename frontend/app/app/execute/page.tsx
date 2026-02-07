"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { Card, StepIndicator, Spinner } from "@/components/ui";
import { ProofUploader } from "@/components/ProofUploader";
import {
  submitExecution,
  getStrategy,
  getStrategyMeta,
  saveExecutionMeta,
  saveActivity,
  type StrategyMeta,
  type OnChainStrategy,
} from "@/lib/contract";

export default function ExecutePage() {
  const { publicKey, connectWallet, signTx } = useWallet();
  const searchParams = useSearchParams();

  // Initialize from URL params if available
  const urlStrategyId = searchParams.get("strategyId");
  const urlExecutionId = searchParams.get("executionId");

  const [strategyId, setStrategyId] = useState(urlStrategyId || "1");
  const [strategyMeta, setStrategyMeta] = useState<StrategyMeta | null>(null);
  const [onChainStrategy, setOnChainStrategy] = useState<OnChainStrategy | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [steps, setSteps] = useState<string[]>(["", "", ""]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [executionId, setExecutionId] = useState<number | null>(
    urlExecutionId ? parseInt(urlExecutionId, 10) : null
  );
  const [error, setError] = useState<string | null>(null);

  // Fetch strategy when ID changes (debounced)
  useEffect(() => {
    const sId = parseInt(strategyId, 10);
    if (isNaN(sId) || sId <= 0) {
      setStrategyMeta(null);
      setOnChainStrategy(null);
      setStrategyError(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setStrategyLoading(true);
      setStrategyError(null);

      try {
        // First check local metadata
        const meta = getStrategyMeta(sId);
        setStrategyMeta(meta);

        // Then verify on-chain
        const onChain = await getStrategy(sId);
        if (onChain) {
          setOnChainStrategy(onChain);
          if (!onChain.active) {
            setStrategyError("This strategy is no longer active");
          }
        } else {
          setOnChainStrategy(null);
          setStrategyError("Strategy not found on-chain");
        }
      } catch (e: any) {
        setStrategyError("Failed to fetch strategy");
      } finally {
        setStrategyLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [strategyId]);

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const executionProof = {
    title,
    summary,
    steps: steps.filter(Boolean),
  };

  const filledSteps = steps.filter((s) => s.trim());
  const isValid = title.trim() && summary.trim() && filledSteps.length >= 1;
  const canSubmit = isValid && onChainStrategy?.active && !strategyError;

  const handleSubmit = async () => {
    if (!publicKey) {
      await connectWallet();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sId = parseInt(strategyId, 10);
      if (isNaN(sId) || sId <= 0) {
        throw new Error("Invalid strategy ID");
      }

      const id = await submitExecution(publicKey, sId, signTx);
      setExecutionId(id);

      // Save execution metadata locally
      saveExecutionMeta({
        id,
        strategyId: sId,
        proof: executionProof,
        executorAddress: publicKey,
        createdAt: new Date().toISOString(),
      });

      // Log activity
      saveActivity({
        icon: "⚡",
        action: `Execution #${id} submitted for Strategy #${sId}`,
        time: new Date().toLocaleString(),
      });
    } catch (err: any) {
      console.error("Submit execution error:", err);
      setError(err.message || "Failed to submit execution");
    } finally {
      setLoading(false);
    }
  };

  // Rules to display — from local meta or generic prompt
  const displayRules = strategyMeta?.rules || [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Stake & Execute Trading Strategy</h1>
        <p className="text-zinc-500 text-sm">
          Stake refundable XLM • Access strategy • Execute trades • Submit P&L proof
        </p>
      </div>

      <StepIndicator
        steps={["Connect", "Stake & Trade", "Submit P&L Proof"]}
        currentStep={publicKey ? (executionId ? 2 : 1) : 0}
      />

      {/* Strategy ID + Lookup */}
      <Card className="mb-5">
        <label className="block text-sm text-zinc-400 mb-2 font-medium">
          Strategy ID
        </label>
        <input
          type="number"
          value={strategyId}
          onChange={(e) => setStrategyId(e.target.value)}
          className="surface-input text-xl font-mono"
          placeholder="1"
          min="1"
          disabled={!!executionId}
        />

        {/* Strategy status indicator */}
        {strategyLoading && (
          <div className="mt-3 flex items-center gap-2 text-zinc-500 text-xs">
            <Spinner size="sm" /> Looking up strategy on-chain...
          </div>
        )}
        {strategyError && (
          <div className="mt-3 text-xs text-red-400 flex items-center gap-2">
            ✕ {strategyError}
          </div>
        )}
        {onChainStrategy && !strategyError && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-2">
              ✓ Strategy Found
            </div>
            <div className="space-y-1 text-xs text-zinc-400">
              {strategyMeta && <div className="text-zinc-200 font-medium">{strategyMeta.title}</div>}
              <div>Stake Required: <span className="text-lime-400 font-bold">{onChainStrategy.reward_amount} XLM</span> (100% refundable)</div>
              {strategyMeta?.profitSharePercent && (
                <>
                  <div>Expert earns: <span className="text-blue-400 font-bold">{strategyMeta.profitSharePercent}%</span> of your profits</div>
                  <div>You keep: <span className="text-emerald-400 font-bold">{100 - strategyMeta.profitSharePercent}%</span> of profits + stake back</div>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Strategy Rules Reference - ONLY AFTER STAKING */}
      {displayRules.length > 0 && executionId && (
        <Card className="mb-5 !border-lime-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
              <span className="text-lime-400 text-lg">🔓</span>
            </div>
            <div>
              <h3 className="text-xs text-lime-400 font-medium uppercase tracking-widest">
                Strategy Unlocked!
              </h3>
              <p className="text-xs text-zinc-500">You've staked and can now see the full strategy</p>
            </div>
          </div>
          {strategyMeta && (
            <div className="mb-3">
              <div className="text-zinc-200 font-medium text-sm">{strategyMeta.title}</div>
              <div className="text-zinc-500 text-xs mt-0.5">{strategyMeta.description}</div>
            </div>
          )}
          <div className="space-y-1.5">
            {displayRules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <span className="text-lime-400 text-xs font-mono font-bold mt-0.5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-zinc-400 text-sm">{rule}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strategy Locked Message - BEFORE STAKING */}
      {displayRules.length > 0 && !executionId && (
        <Card className="mb-5 !border-amber-500/20">
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1">Strategy Details Locked</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Stake {onChainStrategy?.reward_amount || 50} XLM to unlock the full strategy rules and start trading
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-xs text-zinc-600">
              <span>✓</span>
              <span>Stake is 100% refundable</span>
            </div>
          </div>
        </Card>
      )}

      {onChainStrategy && !displayRules.length && !strategyError && (
        <Card className="mb-5">
          <div className="text-xs text-zinc-500">
            Strategy exists on-chain but no rule metadata found locally.
            Submit proof directly — the AI verifier will check against the strategy rules.
          </div>
        </Card>
      )}

      {/* Info Card - Changes based on stake status */}
      <Card className="mb-5 !border-lime-500/20">
        {!executionId ? (
          <>
            <h3 className="text-xs text-lime-400 font-medium uppercase tracking-widest mb-4">
              Next Step: Stake {onChainStrategy?.reward_amount || 50} XLM to Unlock
            </h3>
            <div className="p-3 rounded-lg bg-lime-500/5 border border-lime-500/20">
              <div className="text-xs text-lime-400 font-medium mb-2">What happens when you stake:</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>1. Your {onChainStrategy?.reward_amount || 50} XLM is locked in smart contract</div>
                <div>2. ✅ <strong className="text-lime-400">Full strategy rules are revealed to you</strong></div>
                <div>3. You execute trades following the strategy</div>
                <div>4. Come back here to submit P&L proof</div>
                <div>5. Get stake back + profit share (or just stake if loss)</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">
              ✓ Staked! Now Submit Your P&L Proof
            </h3>
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="text-xs text-amber-400 font-medium mb-1">Important:</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>• Submit your final profit/loss with proof (screenshots, TX hashes, P&L reports)</div>
                <div>• Oracle will verify claimed prices against real market data</div>
                <div>• If profitable: You keep {strategyMeta?.profitSharePercent ? 100 - strategyMeta.profitSharePercent : 80}% + stake back, expert gets {strategyMeta?.profitSharePercent || 20}%</div>
                <div>• If loss: You get stake back, expert gets $0</div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Proof Submission Form */}
      <Card className="mb-5">
        <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-4">
          {!executionId ? "Stake to Unlock Strategy" : "P&L Proof Submission"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5 font-medium">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="surface-input"
              placeholder="e.g., Week 1 Trading Results - Bitcoin Scalping"
              disabled={!!executionId}
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5 font-medium">
              P&L Summary <span className="text-red-400">*</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="surface-input resize-none"
              placeholder="Starting capital: $10,000. Completed 15 trades following RSI<30 entry, RSI>70 exit. Final balance: $11,200. Total P&L: +$1,200 (+12%). Average trade: 5 BTC at $65,432. Includes screenshots, TX hashes, and broker statements..."
              disabled={!!executionId}
            />
            <p className="text-xs text-zinc-600 mt-1.5">
              Be specific: Starting capital, ending balance, total profit/loss, number of trades, prices paid
            </p>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2 font-medium">
              Upload Proof Files <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-zinc-600 mb-3">
              Upload screenshots, P&L reports, trade confirmations, or any proof of execution
            </p>
            <ProofUploader
              onFilesUploaded={(files) => {
                setUploadedFiles(files);
                // Also add to steps for backwards compatibility
                const newSteps = files.map(f => f.url);
                setSteps(prev => [...prev.filter(s => s.trim()), ...newSteps]);
              }}
              disabled={!!executionId}
            />
          </div>

          {/* Additional Evidence (URLs, TX Hashes) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-zinc-400 font-medium">
                Additional Evidence (URLs, TX Hashes)
              </label>
              {!executionId && steps.length < 10 && (
                <button
                  onClick={() => setSteps([...steps, ""])}
                  className="text-xs text-lime-400 hover:text-lime-300 font-medium"
                >
                  + Add Link
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-600 mb-2">
              Add Stellar transaction hashes, trading platform URLs, or external links
            </p>
            {steps.filter((_, i) => i < steps.length - uploadedFiles.length || uploadedFiles.length === 0).slice(0, 3).map((val, i) => (
              <div key={i} className="flex items-center gap-3 mb-2.5">
                <span className="text-zinc-500 text-xs font-mono font-bold w-12 shrink-0">
                  #{i + 1}
                </span>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => updateStep(i, e.target.value)}
                  className="surface-input flex-1"
                  placeholder={i === 0 ? "Stellar TX: GD7X...ABC or https://stellar.expert/tx/..." : i === 1 ? "Trade platform link: https://example.com/trade/..." : `URL or TX hash...`}
                  disabled={!!executionId}
                />
                {!executionId && i > 0 && (
                  <button
                    onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                    className="text-zinc-600 hover:text-red-400 text-xs shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Preview */}
      {isValid && !executionId && (
        <Card className="mb-5">
          <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-3">
            Proof Preview (JSON)
          </h3>
          <pre className="text-xs text-lime-400/80 bg-zinc-900/80 rounded-lg p-4 overflow-x-auto font-mono border border-zinc-800/50">
            {JSON.stringify(executionProof, null, 2)}
          </pre>
        </Card>
      )}

      {/* Action */}
      {!publicKey ? (
        <button onClick={connectWallet} className="btn-primary w-full !py-3.5 text-base">
          Connect Freighter Wallet
        </button>
      ) : executionId ? (
        <Card className="text-center !border-emerald-500/20">
          <div className="text-emerald-400 mb-4">
            <svg className="w-14 h-14 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-zinc-100 mb-1">P&L Proof Submitted!</h3>
          <div className="inline-block px-8 py-4 rounded-lg bg-zinc-900/80 border border-zinc-800 mb-4">
            <span className="text-xs text-zinc-600">Execution ID</span>
            <div className="text-3xl font-bold text-lime-400 font-mono">#{executionId}</div>
          </div>
          <div className="text-xs text-zinc-500 mb-4">
            For Strategy #{strategyId}{strategyMeta ? ` — ${strategyMeta.title}` : ""}
          </div>
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-xs text-blue-400 font-medium mb-1">Next Steps:</div>
            <div className="text-xs text-zinc-500 space-y-1">
              <div>1. AI + Oracle will verify your P&L proof</div>
              <div>2. If profitable: Expert gets {strategyMeta?.profitSharePercent || 20}% of profit, you keep {strategyMeta?.profitSharePercent ? 100 - strategyMeta.profitSharePercent : 80}% + stake</div>
              <div>3. If loss: You get your stake back, expert gets $0</div>
            </div>
          </div>
          <div>
            <a href={`/app/verify?executionId=${executionId}`} className="btn-primary inline-flex items-center gap-2">
              Proceed to Verification →
            </a>
          </div>
        </Card>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              <span>Submitting On-Chain...</span>
            </>
          ) : (
            <span>Submit P&L Proof for Verification</span>
          )}
        </button>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
