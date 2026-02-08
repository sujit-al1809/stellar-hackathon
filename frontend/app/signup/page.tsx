"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, ROLE_CONFIG, type UserRole } from "@/lib/auth";
import { ArrowLeft, ArrowRight, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("trader");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signup(name, email, password, role);
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Signup failed");
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
                  <span className="text-[10px] text-zinc-500 font-mono tracking-wider">NEW_ENTRANT // POWERED_BY_STELLAR</span>
               </div>
            </div>
         </Link>
      </div>

       {/* Back Button */}
      <div className="absolute top-6 right-6 z-20">
        <Link href="/" className="text-[10px] font-bold uppercase text-zinc-500 hover:text-lime-400 flex items-center gap-2 transition-colors">
           <ArrowLeft className="w-3 h-3" /> Abort_Sequence
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-lg p-6 my-10">
        
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Register</h1>
            <p className="text-zinc-500 text-xs font-mono uppercase">Initialize new protocol identity</p>
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

              <form onSubmit={handleSignup} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <div
                      key={key}
                      onClick={() => setRole(key as UserRole)}
                      className={cn(
                        "cursor-pointer p-3 border text-center transition-all relative clip-corner",
                        role === key
                          ? "bg-lime-500/10 border-lime-500 text-white"
                          : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {role === key && (
                        <div className="absolute top-1 right-1 text-lime-500">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className="text-[10px] font-bold uppercase tracking-widest">{config.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Full_Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-3 text-sm text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 placeholder:text-zinc-700 transition-all font-mono"
                    placeholder="John Doe"
                    required
                  />
                </div>

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

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Key_Phrase (Password)</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black border border-zinc-800 p-3 text-sm text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 placeholder:text-zinc-700 transition-all font-mono"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Confirm_Phrase</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black border border-zinc-800 p-3 text-sm text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 placeholder:text-zinc-700 transition-all font-mono"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                   <button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-lime-400 text-black font-black uppercase tracking-wider py-3 clip-corner hover:bg-white hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {loading ? "Processing..." : "Create_Identity"}
                     {!loading && <Zap className="w-4 h-4 fill-black" />}
                   </button>
                </div>
              </form>
            </div>
        </div>

        <p className="text-center mt-8 text-xs text-zinc-600 uppercase tracking-wide">
          Already Integrated?{" "}
          <Link href="/login" className="text-lime-500 font-bold hover:text-white hover:underline decoration-1 underline-offset-4">
            Access_Terminal
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
