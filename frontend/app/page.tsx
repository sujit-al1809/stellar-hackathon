"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { ArrowRight, Terminal, Cpu, ShieldCheck, Activity, Zap, Bot } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-lime-400 selection:text-black overflow-x-hidden">
      
      {/* Decorative Background Grid */}
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-20 pointer-events-none" />
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-lime-400 flex items-center justify-center clip-corner-top-right group-hover:bg-white transition-colors">
              <span className="font-extrabold text-black text-xl italic tracking-tighter">SF</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-widest text-sm uppercase">STRATFLOW</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-lime-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider">POWERED_BY_STELLAR</span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-12 text-xs font-bold tracking-widest uppercase text-zinc-500">
            {["Protocol", "Network", "Oracles", "Governance", "Docs"].map((item) => (
              <Link key={item} href={`#${item.toLowerCase()}`} className="hover:text-lime-400 transition-colors relative group">
                [{item}]
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-lime-400 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            {user ? (
               <Link href="/app" className="group relative px-6 py-2.5 bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold uppercase text-white hover:border-lime-400 hover:text-lime-400 transition-all clip-corner">
                Open_Dashboard
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500 group-hover:border-lime-400 transition-colors" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-500 group-hover:border-lime-400 transition-colors" />
              </Link>
            ) : (
              <div className="flex items-center gap-6">
                 <Link href="/login" className="text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Sign_In</Link> 
                 <Link href="/signup" className="bg-lime-400 text-black px-8 py-3 font-extrabold uppercase text-sm tracking-wide clip-corner hover:bg-white transition-colors flex items-center gap-2">
                    Initialize <Zap className="w-4 h-4 fill-black" />
                 </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 flex flex-col items-center justify-center min-h-screen text-center">
        
        <div className="max-w-[1400px] mx-auto px-6 w-full relative mb-16">
          
          {/* Decorations */}
          <div className="absolute top-0 left-6 text-[10px] font-mono text-zinc-700 flex flex-col gap-1 hidden md:flex text-left">
             <span>CAM: VIRTUAL_01</span>
             <span>LENS: 24MM_PRIME</span>
             <span>ISO: NATIVE</span>
          </div>
          
          <div className="absolute top-0 right-6 flex flex-col items-end hidden md:flex">
             <div className="flex items-center gap-2 text-lime-500 font-mono text-xs">
                SYS_ONLINE <Activity className="w-3 h-3" />
             </div>
             <div className="text-[10px] text-zinc-700 font-mono mt-1">
                MEM: 64GB_OK
             </div>
          </div>

          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5 }}
             className="relative z-20"
          >
            <div className="inline-flex items-center gap-3 px-4 py-1 border border-zinc-800 bg-zinc-900/50 mb-8 rounded-none">
              <span className="w-2 h-2 bg-lime-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">POWERED BY STELLAR</span>
            </div>

            <h1 className="text-7xl md:text-[8rem] font-black leading-[0.85] tracking-tighter text-white mb-6 uppercase">
              Trade. Prove.<br />
              <span className="text-stroke-lime text-transparent">Get Paid.</span>
            </h1>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 md:opacity-100">
               <h1 className="text-[10rem] font-black leading-none tracking-tighter text-white opacity-[0.03] select-none text-stroke blur-sm">
                  STRATFLOW
               </h1>
            </div>

            <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-mono uppercase tracking-wide">
              The Protocol for <span className="text-white bg-zinc-900 px-1">Verifiable</span> Strategy Execution.
              <br />Execute on <span className="text-blue-400">StellarX DEX</span> • Prove with AI • Get Paid.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Link href="/signup" className="group relative w-full md:w-auto">
                <div className="absolute inset-0 bg-lime-500 blur-lg opacity-40 group-hover:opacity-75 transition-opacity duration-300" />
                <button className="relative bg-lime-400 text-black px-12 py-5 font-black uppercase tracking-wider text-lg clip-corner hover:translate-y-[-2px] hover:shadow-xl transition-all w-full md:w-auto flex items-center justify-center gap-3">
                  Start_Protocol <ArrowRight className="w-5 h-5 stroke-[3px]" />
                </button>
              </Link>
              
              <Link href="#demo" className="w-full md:w-auto border border-zinc-800 bg-black text-zinc-400 px-12 py-5 font-bold uppercase tracking-wider text-lg clip-corner hover:bg-zinc-900 hover:text-white hover:border-zinc-600 transition-all flex items-center justify-center">
                System_Data
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Marquee Banner Moved to Bottom of Hero */}
        <div className="w-full border-y border-lime-500/20 bg-black/50 backdrop-blur-sm overflow-hidden py-12 relative z-10 mt-auto">
          <div className="absolute inset-0 bg-hazard opacity-5 pointer-events-none" />
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="whitespace-nowrap flex gap-16 text-5xl md:text-8xl font-black font-sans text-transparent text-stroke-lime uppercase tracking-tighter opacity-80"
          >
            {Array(10).fill("UNLEASH THE ALGORITHM • PROVE PROFIT • GET PAID • ").map((text, i) => (
              <span key={i}>{text}</span>
            ))}
          </motion.div>
        </div>

        {/* Hazard Strip Bottom */}
        <div className="w-full h-8 bg-black border-t border-zinc-900 flex items-center justify-between px-6 overflow-hidden">
           <div className="w-full h-2 bg-hazard opacity-30" />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 border-t border-zinc-900 bg-black relative">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Inspo",
                sub: "Strategy Discovery",
                desc: "Find algorithmic strategies verified by ZK-proofs.",
                icon: ShieldCheck
              },
              {
                title: "Pricing",
                sub: "Performance Based",
                desc: "0% Management Fee. 20% Success Fee on profits only.",
                icon: Activity
              },
              {
                title: "Status",
                sub: "Live Execution",
                desc: "Real-time on-chain verification via Stellar Oracles.",
                icon: Terminal
              },
              {
                title: "Stack",
                sub: "Soroban Native",
                desc: "Built with Rust smart contracts for max speed.",
                icon: Cpu
              },
              {
                title: "DEX",
                sub: "StellarX Trading",
                desc: "One-click execution on Stellar's native DEX. Fast, cheap, non-custodial.",
                icon: Zap
              },
              {
                title: "Net",
                sub: "Global Access",
                desc: "Deploy capital from anywhere. Trade 24/7 worldwide.",
                icon: Terminal
              },
              {
                title: "AI",
                sub: "Agent Execution",
                desc: "AI agents auto-execute strategies with DeFi integrations & Polymarket.",
                icon: Bot
              }
            ].map((card, i) => (
              <div key={i} className="group relative p-1">
                 {/* Card Border Effect */}
                <div className="absolute inset-0 border border-zinc-800 transition-colors group-hover:border-lime-500/50 clip-corner" />
                
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-600 group-hover:border-lime-400 transition-colors" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-600 group-hover:border-lime-400 transition-colors" />

                <div className="bg-zinc-950 p-8 h-full clip-corner relative z-10 hover:bg-zinc-900/50 transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase border border-zinc-800 px-2 py-1 rounded-sm group-hover:text-lime-500 group-hover:border-lime-500/30 transition-colors">
                      [{card.title}]
                    </span>
                    <card.icon className="w-5 h-5 text-zinc-700 group-hover:text-lime-400 transition-colors" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-white uppercase mb-3 tracking-tight">{card.sub}</h3>
                  <p className="text-zinc-500 font-mono text-xs leading-relaxed uppercase">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black pt-20 pb-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div>
              <h2 className="text-[4rem] font-black text-white leading-none tracking-tighter mb-4 text-stroke">
                STRATFLOW
              </h2>
              <div className="flex gap-2">
                 <div className="px-3 py-1 bg-lime-400 text-black font-bold text-xs uppercase clip-corner-top-right">
                    Windows
                 </div>
                 <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-xs uppercase clip-corner-top-right">
                    MacOS_Universal
                 </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-xs font-mono text-zinc-500 uppercase">
               <a href="#" className="hover:text-lime-400 transition-colors">&gt; Documentation</a>
               <a href="#" className="hover:text-lime-400 transition-colors">&gt; GitHub_Repo</a>
               <a href="#" className="hover:text-lime-400 transition-colors">&gt; Governance</a>
               <a href="#" className="hover:text-lime-400 transition-colors">&gt; Audit_Log</a>
            </div>
          </div>
          
          <div className="mt-20 pt-6 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-600 uppercase">
             <span>© 2026 StratFlow Protocol. All Systems Operational.</span>
             <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-900 rounded-full" />
                Network_Stable
             </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
