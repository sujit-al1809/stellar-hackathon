"use client";

import React from "react";
import { Card } from "@/components/ui";
import Link from "next/link";

export default function ExamplesPage() {
  const stakeAmount = 50; // XLM
  const profitShare = 20; // %
  const traderKeeps = 80; // %

  const scenarios = [
    {
      name: "Scenario 1: Profitable Trader",
      icon: "💰",
      color: "emerald",
      setup: {
        stake: stakeAmount,
        startingCapital: 10000,
        endingBalance: 12000,
        profit: 2000,
      },
      outcome: {
        traderGets: {
          stakeRefund: stakeAmount,
          profitShare: 2000 * (traderKeeps / 100),
          total: stakeAmount + 2000 * (traderKeeps / 100),
        },
        expertGets: {
          profitShare: 2000 * (profitShare / 100),
        },
      },
      result: "Both Win!",
    },
    {
      name: "Scenario 2: Losing Trader",
      icon: "📉",
      color: "red",
      setup: {
        stake: stakeAmount,
        startingCapital: 10000,
        endingBalance: 8500,
        profit: -1500,
      },
      outcome: {
        traderGets: {
          stakeRefund: stakeAmount,
          profitShare: 0,
          total: stakeAmount,
        },
        expertGets: {
          profitShare: 0,
        },
      },
      result: "Trader protected — gets stake back!",
    },
    {
      name: "Scenario 3: Trader Ghosts (No Verification)",
      icon: "👻",
      color: "orange",
      setup: {
        stake: stakeAmount,
        startingCapital: 10000,
        endingBalance: "Unknown",
        profit: "Unknown",
      },
      outcome: {
        traderGets: {
          stakeRefund: 0,
          profitShare: 0,
          total: 0,
          penalty: `-${stakeAmount} XLM`,
        },
        expertGets: {
          profitShare: 0,
          stakePenalty: stakeAmount,
        },
      },
      result: "Expert protected — gets stake!",
    },
    {
      name: "Scenario 4: Trader Lies (Fake Proof)",
      icon: "🚫",
      color: "purple",
      setup: {
        stake: stakeAmount,
        startingCapital: 10000,
        claimedProfit: 5000,
        actualProfit: -2000,
        fakePrices: true,
      },
      outcome: {
        traderGets: {
          stakeRefund: 0,
          profitShare: 0,
          total: 0,
          penalty: `-${stakeAmount} XLM`,
          banned: true,
        },
        expertGets: {
          profitShare: 0,
          stakePenalty: stakeAmount,
        },
      },
      result: "Oracle catches fake prices — trader banned!",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Stake + Profit Share Examples</h1>
        <p className="text-zinc-500 text-sm">
          See how the stake + profit model works in different scenarios
        </p>
      </div>

      {/* Model Overview */}
      <Card className="mb-8 !border-lime-500/20">
        <h3 className="text-xs text-lime-400 font-medium uppercase tracking-widest mb-4">
          How It Works
        </h3>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-xs text-zinc-600 mb-1">Stake Requirement</div>
            <div className="text-2xl font-bold text-lime-400 font-mono">{stakeAmount} XLM</div>
            <div className="text-xs text-zinc-500 mt-1">100% refundable</div>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-xs text-zinc-600 mb-1">Expert Earns</div>
            <div className="text-2xl font-bold text-blue-400 font-mono">{profitShare}%</div>
            <div className="text-xs text-zinc-500 mt-1">of trader profits</div>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-xs text-zinc-600 mb-1">Trader Keeps</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{traderKeeps}%</div>
            <div className="text-xs text-zinc-500 mt-1">+ stake refund</div>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-lime-500/5 border border-lime-500/20">
          <div className="text-xs text-zinc-500 space-y-1">
            <div>• Trader stakes {stakeAmount} XLM to unlock strategy (refundable)</div>
            <div>• Expert earns {profitShare}% only if trader makes profit</div>
            <div>• If trader loses money, they get stake back + expert gets $0</div>
            <div>• If trader ghosts, expert gets the stake</div>
            <div>• Perfect alignment — both win together!</div>
          </div>
        </div>
      </Card>

      {/* Scenarios */}
      <div className="space-y-6">
        {scenarios.map((scenario, i) => (
          <Card
            key={i}
            className={`!border-${scenario.color}-500/20`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">{scenario.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">{scenario.name}</h3>
                <div className={`text-xs text-${scenario.color}-400 font-medium`}>{scenario.result}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Setup */}
              <div>
                <div className="text-xs text-zinc-600 font-medium mb-3 uppercase tracking-wider">
                  Setup
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm p-2 rounded bg-zinc-900/50">
                    <span className="text-zinc-500">Stake Required:</span>
                    <span className="text-lime-400 font-bold">{scenario.setup.stake} XLM</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 rounded bg-zinc-900/50">
                    <span className="text-zinc-500">Starting Capital:</span>
                    <span className="text-zinc-300 font-mono">${scenario.setup.startingCapital.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 rounded bg-zinc-900/50">
                    <span className="text-zinc-500">Ending Balance:</span>
                    <span className="text-zinc-300 font-mono">
                      {typeof scenario.setup.endingBalance === 'number'
                        ? `$${scenario.setup.endingBalance.toLocaleString()}`
                        : scenario.setup.endingBalance}
                    </span>
                  </div>
                  {typeof scenario.setup.profit === 'number' && (
                    <div className="flex justify-between text-sm p-2 rounded bg-zinc-900/50">
                      <span className="text-zinc-500">P&L:</span>
                      <span className={`font-bold ${scenario.setup.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {scenario.setup.profit >= 0 ? '+' : ''}${scenario.setup.profit.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {scenario.setup.fakePrices && (
                    <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                      <div className="text-xs text-purple-400 font-medium">⚠️ Fake Prices Detected</div>
                      <div className="text-xs text-zinc-500 mt-1">Oracle caught price manipulation</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Outcome */}
              <div>
                <div className="text-xs text-zinc-600 font-medium mb-3 uppercase tracking-wider">
                  Payout
                </div>
                <div className="space-y-3">
                  {/* Trader Gets */}
                  <div className={`p-3 rounded-lg bg-${scenario.color === 'emerald' ? 'emerald' : scenario.color === 'red' ? 'zinc' : scenario.color}-500/10 border border-${scenario.color === 'emerald' ? 'emerald' : scenario.color === 'red' ? 'zinc' : scenario.color}-500/20`}>
                    <div className="text-xs text-zinc-400 mb-2">Trader Gets:</div>
                    {scenario.outcome.traderGets.stakeRefund > 0 && (
                      <div className="text-lg font-bold text-lime-400">
                        +{scenario.outcome.traderGets.stakeRefund} XLM (stake back)
                      </div>
                    )}
                    {scenario.outcome.traderGets.profitShare > 0 && (
                      <div className="text-lg font-bold text-emerald-400">
                        +${scenario.outcome.traderGets.profitShare.toLocaleString()} ({traderKeeps}% profit)
                      </div>
                    )}
                    {scenario.outcome.traderGets.total === 0 && (
                      <div className="text-lg font-bold text-red-400">
                        {scenario.outcome.traderGets.penalty || "$0"}
                      </div>
                    )}
                    {scenario.outcome.traderGets.banned && (
                      <div className="text-xs text-red-400 mt-1">⚠️ Banned from platform</div>
                    )}
                  </div>

                  {/* Expert Gets */}
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="text-xs text-zinc-400 mb-2">Expert Gets:</div>
                    {scenario.outcome.expertGets.profitShare > 0 ? (
                      <div className="text-lg font-bold text-blue-400">
                        +${scenario.outcome.expertGets.profitShare.toLocaleString()} ({profitShare}% profit)
                      </div>
                    ) : scenario.outcome.expertGets.stakePenalty ? (
                      <div className="text-lg font-bold text-amber-400">
                        +{scenario.outcome.expertGets.stakePenalty} XLM (stake penalty)
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-zinc-600">
                        $0 (no profit earned)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Insight */}
            {i === 0 && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-xs text-emerald-400 font-medium mb-1">✓ Perfect Alignment</div>
                <div className="text-xs text-zinc-500">
                  Trader profits $2,000. They keep $1,600 + 50 XLM stake. Expert earns $400 because trader succeeded. Both win!
                </div>
              </div>
            )}
            {i === 1 && (
              <div className="mt-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <div className="text-xs text-zinc-400 font-medium mb-1">Trader Protection</div>
                <div className="text-xs text-zinc-500">
                  Trader lost money in the market, but gets their stake back. Expert earns nothing because strategy didn't generate profit.
                </div>
              </div>
            )}
            {i === 2 && (
              <div className="mt-4 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                <div className="text-xs text-orange-400 font-medium mb-1">⚠️ Expert Protection</div>
                <div className="text-xs text-zinc-500">
                  Trader never submitted proof after unlocking strategy. Expert gets the stake as compensation for wasted time.
                </div>
              </div>
            )}
            {i === 3 && (
              <div className="mt-4 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <div className="text-xs text-purple-400 font-medium mb-1">🔮 Oracle Enforcement</div>
                <div className="text-xs text-zinc-500">
                  Trader claimed fake profits with manipulated prices. Oracle detected the fraud. Trader loses stake and gets banned.
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Key Takeaways */}
      <Card className="mt-8 !border-lime-500/20">
        <h3 className="text-xs text-lime-400 font-medium uppercase tracking-widest mb-4">
          Key Takeaways
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <div className="text-sm text-zinc-300 font-medium">Win-Win Model</div>
                <div className="text-xs text-zinc-500">Expert only earns when trader profits. Perfect incentive alignment.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <div className="text-sm text-zinc-300 font-medium">Trader Protection</div>
                <div className="text-xs text-zinc-500">Stake is 100% refundable on any loss. Only market risk, not platform risk.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <div className="text-sm text-zinc-300 font-medium">Expert Protection</div>
                <div className="text-xs text-zinc-500">If trader ghosts, expert gets the stake. No wasted time teaching bad actors.</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">🔮</span>
              <div>
                <div className="text-sm text-zinc-300 font-medium">Oracle Verification</div>
                <div className="text-xs text-zinc-500">Can't fake prices. Pyth oracle cross-checks all claims against real market data.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">🤖</span>
              <div>
                <div className="text-sm text-zinc-300 font-medium">AI Enforcement</div>
                <div className="text-xs text-zinc-500">Gemini AI verifies strategy rules were followed. No manual review needed.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">⛓️</span>
              <div>
                <div className="text-sm text-zinc-300 font-medium">Blockchain Trust</div>
                <div className="text-xs text-zinc-500">Soroban smart contracts enforce all rules. No admin can override.</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* CTA */}
      <div className="mt-8 flex gap-3 justify-center">
        <Link href="/app/create" className="btn-primary">
          Publish Strategy as Expert →
        </Link>
        <Link href="/app/execute" className="btn-ghost">
          Find Strategies as Trader →
        </Link>
      </div>
    </div>
  );
}
