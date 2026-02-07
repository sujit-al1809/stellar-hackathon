"use client";

import React, { useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { Card, StepIndicator, Spinner } from "@/components/ui";
import { createStrategy, saveStrategyMeta, saveActivity } from "@/lib/contract";

export default function CreatePage() {
  const { publicKey, connectWallet, signTx } = useWallet();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<string[]>(["", "", ""]);
  const [stakeAmount, setStakeAmount] = useState("50");
  const [profitSharePercent, setProfitSharePercent] = useState("20");
  const [loading, setLoading] = useState(false);
  const [strategyId, setStrategyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateRule = (index: number, value: string) => {
    const updated = [...rules];
    updated[index] = value;
    setRules(updated);
  };

  const addRule = () => {
    if (rules.length < 10) setRules([...rules, ""]);
  };

  const removeRule = (index: number) => {
    if (rules.length > 1) setRules(rules.filter((_, i) => i !== index));
  };

  const filledRules = rules.filter((r) => r.trim());
  const stake = parseInt(stakeAmount, 10);
  const profitShare = parseInt(profitSharePercent, 10);
  const isValid = title.trim() && description.trim() && filledRules.length >= 1 && stake > 0 && profitShare > 0 && profitShare <= 100;

  const handleCreate = async () => {
    if (!publicKey) {
      await connectWallet();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!isValid) {
        throw new Error("Please fill in all required fields");
      }

      if (isNaN(stake) || stake <= 0) {
        throw new Error("Invalid stake amount");
      }

      if (isNaN(profitShare) || profitShare <= 0 || profitShare > 100) {
        throw new Error("Profit share must be between 1-100%");
      }

      // For smart contract compatibility, we pass stake amount as the "reward"
      const id = await createStrategy(publicKey, stake, signTx);
      setStrategyId(id);

      // Save off-chain metadata (title, description, rules, stake, profit share)
      saveStrategyMeta({
        id,
        title: title.trim(),
        description: description.trim(),
        rules: filledRules,
        rewardAmount: stake, // For compatibility
        stakeAmount: stake,
        profitSharePercent: profitShare,
        creatorAddress: publicKey,
        createdAt: new Date().toISOString(),
      });

      // Log activity
      saveActivity({
        icon: "◆",
        action: `Strategy #${id} created — ${title.trim()} (${stake} XLM stake, ${profitShare}% profit)`,
        time: new Date().toLocaleString(),
      });
    } catch (err: any) {
      console.error("Create strategy error:", err);
      setError(err.message || "Failed to create strategy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Publish Trading Strategy</h1>
        <p className="text-zinc-500 text-sm">
          Set stake requirement • Define profit share • Earn as traders profit
        </p>
      </div>

      <StepIndicator
        steps={["Connect", "Configure", "Created"]}
        currentStep={publicKey ? (strategyId ? 2 : 1) : 0}
      />

      {/* Strategy Details */}
      <Card className="mb-5">
        <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
          Trading Strategy Details
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
              placeholder="e.g., Bitcoin Scalping Strategy - 1% Daily Returns"
              disabled={!!strategyId}
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5 font-medium">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="surface-input resize-none"
              placeholder="Proven day trading strategy for BTC using RSI and MACD indicators. Works best in volatile markets with 1-5 minute candles..."
              disabled={!!strategyId}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-zinc-400 font-medium">
                Trading Rules & Entry/Exit Criteria <span className="text-red-400">*</span>
              </label>
              {!strategyId && rules.length < 10 && (
                <button
                  onClick={addRule}
                  className="text-xs text-lime-400 hover:text-lime-300 font-medium"
                >
                  + Add Rule
                </button>
              )}
            </div>
            <div className="space-y-2">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-lime-400 text-xs font-mono font-bold w-6 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(i, e.target.value)}
                    className="surface-input flex-1"
                    placeholder={i === 0 ? "Entry: Buy when RSI < 30 on 5min chart" : i === 1 ? "Exit: Sell when RSI > 70 or 2% stop loss" : i === 2 ? "Position size: Max 5% of portfolio per trade" : `Rule ${i + 1}...`}
                    disabled={!!strategyId}
                  />
                  {!strategyId && rules.length > 1 && (
                    <button
                      onClick={() => removeRule(i)}
                      className="text-zinc-600 hover:text-red-400 text-xs shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Stake + Profit Share */}
      <Card className="mb-5">
        <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Stake & Profit Model
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2 font-medium">
              Stake Requirement <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="surface-input text-2xl font-bold font-mono"
                placeholder="50"
                min="1"
                disabled={!!strategyId}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-medium">
                XLM
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              Traders stake this amount (100% refundable) to unlock your strategy. They get it back regardless of profit/loss.
            </p>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2 font-medium">
              Your Profit Share <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={profitSharePercent}
                onChange={(e) => setProfitSharePercent(e.target.value)}
                className="surface-input text-2xl font-bold font-mono"
                placeholder="20"
                min="1"
                max="100"
                disabled={!!strategyId}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-medium">
                %
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              You earn this percentage of trader's profits. If they lose money, you earn $0. Aligned incentives!
            </p>
          </div>

          {/* Example Calculation */}
          <div className="p-3 rounded-lg bg-lime-500/5 border border-lime-500/20">
            <div className="text-xs text-lime-400 font-medium mb-2">Example Payout:</div>
            <div className="text-xs text-zinc-500 space-y-1">
              <div>• Trader stakes <span className="text-lime-400 font-bold">{stakeAmount} XLM</span> (refundable)</div>
              <div>• They make $1,000 profit trading</div>
              <div>• You earn: <span className="text-lime-400 font-bold">${(1000 * parseInt(profitSharePercent || "20", 10) / 100).toFixed(0)}</span> ({profitSharePercent}% of profit)</div>
              <div>• They keep: <span className="text-blue-400 font-bold">${(1000 * (100 - parseInt(profitSharePercent || "20", 10)) / 100).toFixed(0)}</span> + stake back</div>
              <div className="text-emerald-400 mt-2">✓ If they lose money, they get stake back + you earn $0</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview */}
      {isValid && !strategyId && (
        <Card className="mb-5">
          <h3 className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-3">
            Preview (what traders will see)
          </h3>
          <pre className="text-xs text-lime-400/80 bg-zinc-900/80 rounded-lg p-4 overflow-x-auto font-mono border border-zinc-800/50">
            {JSON.stringify(
              {
                title: title.trim(),
                description: description.trim(),
                tradingRules: filledRules,
                stakeRequired: `${stakeAmount} XLM (refundable)`,
                expertProfitShare: `${profitSharePercent}% of profits`,
                traderKeeps: `${100 - parseInt(profitSharePercent, 10)}% of profits + stake back`
              },
              null,
              2
            )}
          </pre>
        </Card>
      )}

      {/* Action */}
      {!publicKey ? (
        <button onClick={connectWallet} className="btn-primary w-full !py-3.5 text-base">
          Connect Freighter Wallet
        </button>
      ) : strategyId ? (
        <Card className="text-center !border-emerald-500/20">
          <div className="text-emerald-400 mb-4">
            <svg className="w-14 h-14 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-zinc-100 mb-1">Trading Strategy Published!</h3>
          <div className="text-sm text-zinc-500 mb-4">Traders can now stake and execute your strategy</div>
          <div className="inline-block px-8 py-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-600">Strategy ID</span>
            <div className="text-3xl font-bold text-lime-400 font-mono">#{strategyId}</div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xs text-zinc-600">
              Stake: {stakeAmount} XLM (refundable) • Profit share: {profitSharePercent}%
            </div>
            <div className="text-xs text-zinc-600">
              {filledRules.length} trading rules • Ready for traders
            </div>
          </div>
        </Card>
      ) : (
        <button
          onClick={handleCreate}
          disabled={loading || !isValid}
          className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              <span>Publishing On-Chain...</span>
            </>
          ) : (
            <span>Publish Strategy ({stakeAmount} XLM stake, {profitSharePercent}% profit)</span>
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
