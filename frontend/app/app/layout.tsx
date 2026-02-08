"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Activity } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-lime-400 font-mono text-xs uppercase animate-pulse">
        System_Initializing...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-lime-500/30 selection:text-lime-400 flex">
      
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-10 pointer-events-none" />

      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen transition-all">
        {/* Technical Top Bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-8 bg-black/80 backdrop-blur border-b border-zinc-900/80">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
               <span className="w-2 h-2 bg-lime-500 clip-corner" />
               CMD: {user.name.split(" ")[0]}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-500 border border-zinc-800 px-3 py-1 bg-zinc-950">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               NET: STELLAR_TESTNET
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-500">
               <Activity className="w-3 h-3" />
               LATENCY: 42ms
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
