"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_USERS, type UserRole } from "@/lib/auth";
import { ArrowRight, Terminal, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const demo = DEMO_USERS[role];
      await login(demo.email, demo.password);
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#050505] text-zinc-300 font-mono selection:bg-lime-500/30 selection:text-lime-400">
      
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      {/* Brand Header */}
      <div className="absolute top-6 left-6 z-20">
         <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-lime-400 flex items-center justify-center clip-corner-top-right group-hover:bg-white transition-colors">
               <span className="font-extrabold text-black text-sm italic tracking-tighter">SF</span>
            </div>
            <div className="flex flex-col">
               <span className="font-bold text-white tracking-widest text-xs uppercase">STRATFLOW</span>
               <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-lime-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-500 font-mono tracking-wider">SECURE_ACCESS // POWERED_BY_STELLAR</span>
               </div>
            </div>
         </Link>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-6 right-6 text-[10px] font-mono text-zinc-600 hidden md:block text-right">
         <div>ENCRYPTION: SHIELD_256</div>
         <div>AUTH_NODE: US_EAST_1</div>
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Identify</h1>
            <p className="text-zinc-500 text-xs font-mono uppercase">Enter your credentials to access the protocol</p>
        </div>

        <div className="group relative p-1">
             {/* Card Border Effect */}
            <div className="absolute inset-0 border border-zinc-800 transition-colors group-hover:border-lime-500/50 clip-corner bg-black" />
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-lime-400 transition-colors z-20" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-lime-400 transition-colors z-20" />

            <div className="relative z-10 p-8 bg-zinc-950/50 backdrop-blur-sm clip-corner">
               
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 p-3 text-red-500 text-xs font-bold uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-sm animate-pulse" />
                  Error: {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Email_Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-3 text-sm text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 placeholder:text-zinc-700 transition-all font-mono"
                    placeholder="user@stratflow.io"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-3 text-sm text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 placeholder:text-zinc-700 transition-all font-mono"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-lime-400 text-black font-black uppercase tracking-wider py-3 mt-2 clip-corner hover:bg-white hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Authenticating..." : "Establish_Link"}
                  {!loading && <ArrowRight className="w-4 h-4 stroke-[3px]" />}
                </button>
              </form>

              <div className="my-8 flex items-center gap-4">
                <div className="h-[1px] bg-zinc-900 flex-1" />
                <span className="text-[10px] uppercase text-zinc-700 font-bold">Or_Use_Test_Key</span>
                <div className="h-[1px] bg-zinc-900 flex-1" />
              </div>

              <div className="space-y-3">
                <div className="text-[10px] text-zinc-600 uppercase font-bold mb-2">Demo Accounts:</div>
                {[
                  { email: "trader@stratflow.io", role: "Trader", icon: Zap },
                  { email: "expert@stratflow.io", role: "Expert", icon: Terminal },
                  { email: "verifier@stratflow.io", role: "Verifier", icon: ShieldCheck },
                ].map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => {
                      setEmail(d.email);
                      setPassword("demo123");
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-3 border border-zinc-800 bg-black/50 hover:bg-zinc-900 hover:border-lime-500/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-lime-500/50 transition-colors clip-corner">
                        <d.icon className="w-4 h-4 text-zinc-500 group-hover:text-lime-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">{d.role}</span>
                        <span className="text-[10px] text-zinc-600 font-mono">{d.email}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-600 group-hover:text-lime-400 uppercase font-mono">
                      demo123
                    </div>
                  </button>
                ))}
                <div className="text-[9px] text-zinc-700 uppercase text-center pt-2">
                  Click to auto-fill credentials
                </div>
              </div>
            </div>
        </div>

        <p className="text-center mt-8 text-xs text-zinc-600 uppercase tracking-wide">
          New Connection?{" "}
          <Link href="/signup" className="text-lime-500 font-bold hover:text-white hover:underline decoration-1 underline-offset-4">
            Initialize_Protocol
          </Link>
        </p>
      </div>

       {/* Hazard Strip Bottom */}
        <div className="absolute bottom-0 w-full h-6 bg-black border-t border-zinc-900 flex items-center justify-between px-6 overflow-hidden z-10">
           <div className="w-full h-2 bg-hazard opacity-30" />
        </div>
    </div>
  );
}
