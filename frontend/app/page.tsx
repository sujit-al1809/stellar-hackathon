"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Check } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navbar */}
      <nav className="border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime-500 flex items-center justify-center text-black font-bold text-sm">
              S
            </div>
            <span className="text-lg font-semibold text-zinc-100">
              StratFlow
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/app" className="btn-primary !py-2 !px-5">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-4 py-2">
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary !py-2 !px-5">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
          <span className="text-zinc-400">Live on Stellar Testnet</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-zinc-100 mb-6 tracking-tight">
          Trade strategies.
          <br />
          Pay when you profit.
        </h1>

        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stake refundable XLM to unlock expert strategies. Execute trades. Submit proof.
          Experts earn 20% of your profits — verified by AI on Stellar.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary !py-3 !px-8 flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary !py-3 !px-8">
            Sign In
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-zinc-100 mb-3">How it works</h2>
          <p className="text-zinc-400">Four simple steps</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              num: "01",
              title: "Stake",
              desc: "Stake 50 XLM to unlock strategy (100% refundable)"
            },
            {
              num: "02",
              title: "Execute",
              desc: "Follow rules, make trades with your capital"
            },
            {
              num: "03",
              title: "Verify",
              desc: "Submit proof, AI + Oracle verify accuracy"
            },
            {
              num: "04",
              title: "Profit",
              desc: "Get stake back + 80% profit. Expert gets 20%"
            },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="text-xs text-lime-500 font-mono font-bold mb-3">{step.num}</div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="border border-zinc-800 rounded-xl p-8 bg-zinc-900/30">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-zinc-100 mb-2">Real example</h3>
            <p className="text-zinc-400">See how the profit share works</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Scenario */}
            <div className="space-y-3">
              <div className="text-xs text-lime-500 font-semibold uppercase tracking-wider mb-4">Scenario</div>
              {[
                "Stake 50 XLM to unlock strategy",
                "Trade with $10,000 capital",
                "End with $12,000 (+$2,000 profit)",
                "Submit proof, AI verifies",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-lime-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Payout */}
            <div className="space-y-4">
              <div className="text-xs text-lime-500 font-semibold uppercase tracking-wider mb-4">Payout</div>

              <div className="p-4 rounded-lg border border-emerald-900/50 bg-emerald-950/30">
                <div className="text-xs text-emerald-400 mb-2">You receive</div>
                <div className="text-2xl font-bold text-emerald-400">+$1,600</div>
                <div className="text-xs text-zinc-500 mt-1">Stake back + 80% of profit</div>
              </div>

              <div className="p-4 rounded-lg border border-blue-900/50 bg-blue-950/30">
                <div className="text-xs text-blue-400 mb-2">Expert receives</div>
                <div className="text-2xl font-bold text-blue-400">+$400</div>
                <div className="text-xs text-zinc-500 mt-1">20% of your profit</div>
              </div>
            </div>
          </div>

          {/* Outcomes */}
          <div className="pt-6 border-t border-zinc-800">
            <div className="text-xs text-zinc-600 uppercase tracking-wider mb-4">Other outcomes</div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <div className="text-xs font-semibold text-zinc-300 mb-1">You lose money</div>
                <div className="text-xs text-zinc-500">Get stake back. Expert gets $0.</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <div className="text-xs font-semibold text-zinc-300 mb-1">You ghost</div>
                <div className="text-xs text-zinc-500">Lose stake. Expert gets it.</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <div className="text-xs font-semibold text-zinc-300 mb-1">Fake proof</div>
                <div className="text-xs text-zinc-500">Lose stake. Get banned.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-100 mb-3">Built on trust</h2>
          <p className="text-zinc-400">Enforced by Soroban smart contracts</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {[
            "Stake is 100% refundable",
            "Experts only earn when you profit",
            "Oracle verifies all P&L",
            "Ghost? Lose stake automatically",
            "Profitable? Keep 80% of gains",
            "Perfect aligned incentives",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
              <Check className="w-4 h-4 text-lime-500 shrink-0" />
              <span className="text-sm text-zinc-300">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Strategies */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-100 mb-3">Popular strategies</h2>
          <p className="text-zinc-400">From crypto to DeFi</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Crypto Day Trading", stake: "50", profit: "20%" },
            { title: "DeFi Yield Farming", stake: "75", profit: "25%" },
            { title: "Swing Trading", stake: "40", profit: "15%" },
            { title: "Arbitrage", stake: "100", profit: "30%" },
            { title: "Risk Management", stake: "30", profit: "10%" },
            { title: "Trend Following", stake: "60", profit: "20%" },
          ].map((strategy, i) => (
            <div key={i} className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-100">{strategy.title}</h3>
                <div className="text-right">
                  <div className="text-xs font-mono text-lime-400">{strategy.stake} XLM</div>
                  <div className="text-xs font-mono text-blue-400">{strategy.profit}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center p-12 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">Ready to start?</h2>
          <p className="text-zinc-400 mb-8">Join traders on Stellar</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary !py-3 !px-8 flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-secondary !py-3 !px-8">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-lime-500 flex items-center justify-center text-black font-bold text-sm">
              S
            </div>
            <span className="text-lg font-semibold text-zinc-100">StratFlow</span>
          </div>
          <p className="text-center text-sm text-zinc-500 mb-6">
            Decentralized trading strategy marketplace on Stellar
          </p>
          <div className="flex items-center justify-center flex-wrap gap-2 text-xs text-zinc-600">
            {["Stellar", "Soroban", "Next.js", "TypeScript", "AI Verified"].map((tech) => (
              <span key={tech} className="px-3 py-1 rounded border border-zinc-900 bg-zinc-950">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
