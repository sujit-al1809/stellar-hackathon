"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, type UserRole } from "@/lib/auth";
import { useWallet } from "./WalletProvider";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Plus,
  Layers,
  Zap,
  FileText,
  CheckCircle,
  Eye,
  Settings,
  BarChart3,
  Wallet,
  LogOut,
  Store,
  Shield,
  SquareTerminal,
  Activity,
  History,
  Bot,
  Play
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  grid: LayoutGrid,
  "plus": Plus,
  layers: Layers,
  zap: Zap,
  "file-text": FileText,
  "check-circle": CheckCircle,
  eye: Eye,
  settings: Settings,
  dashboard: BarChart3,
  store: Store,
  shield: Shield,
  terminal: SquareTerminal,
  activity: Activity,
  history: History,
  bot: Bot,
  play: Play
};

const NAV_SECTIONS: Record<UserRole | "common", {
  label?: string;
  items: { href: string; label: string; icon: string; highlight?: boolean }[];
}> = {
  common: {
    items: [
      { href: "/app/demo", label: "Demo_Flow", icon: "play", highlight: true },
      { href: "/app", label: "Overview", icon: "activity" },
      { href: "/app/marketplace", label: "Strategy_Mkt", icon: "store" },
      { href: "/app/agents", label: "AI_Agents", icon: "bot" },
    ],
  },
  expert: {
    label: "Expert_Mod",
    items: [
      { href: "/app/create", label: "Init_Strategy", icon: "plus" },
      { href: "/app/strategies", label: "My_Strategies", icon: "layers" },
      { href: "/app/dispute", label: "Active_Disputes", icon: "shield" },
    ],
  },
  trader: {
    label: "Trader_Mod",
    items: [
      { href: "/app/execute", label: "Exec_Strategy", icon: "terminal" },
      { href: "/app/submissions", label: "Proof_Logs", icon: "history" },
    ],
  },
  verifier: {
    label: "Verify_Mod",
    items: [
      { href: "/app/verify", label: "Verify_Queue", icon: "check-circle" },
      { href: "/app/reviews", label: "Audit_Logs", icon: "eye" },
    ],
  },
  admin: {
    label: "Admin_Mod",
    items: [
      { href: "/app/create", label: "Create", icon: "plus" },
      { href: "/app/execute", label: "Execute", icon: "zap" },
      { href: "/app/verify", label: "Verify", icon: "check-circle" },
      { href: "/app/dispute", label: "Disputes", icon: "shield" },
      { href: "/app/admin", label: "Sys_Config", icon: "settings" },
    ],
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { publicKey, connectWallet, disconnectWallet } = useWallet();

  if (!user) return null;

  const sections = [NAV_SECTIONS.common, NAV_SECTIONS[user.role]];
  const truncAddr = (a: string) => `${a.slice(0, 4)}...${a.slice(-4)}`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 z-40 flex flex-col bg-black border-r border-zinc-800">
      
      {/* Logo Area */}
      <div className="flex flex-col px-6 py-6 border-b border-zinc-900">
        <Link href="/" className="flex items-center gap-3 mb-1 group">
          <div className="w-4 h-4 bg-lime-500 clip-corner group-hover:bg-white transition-colors" />
          <span className="font-extrabold text-white tracking-widest uppercase text-base">StratFlow</span>
        </Link>
        <div className="text-[10px] text-zinc-600 font-mono pl-7 flex flex-col">
          <span>VER: 2.4.0-BETA</span>
          <span className="text-[9px] tracking-tight mt-1 text-zinc-500 font-bold">POWERED_BY_STELLAR</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto pt-6 px-4 space-y-8 no-scrollbar">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            {section.label && (
              <div className="px-2 text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-zinc-800" />
                {section.label}
              </div>
            )}
            
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = ICON_MAP[item.icon] || BarChart3;
                const isActive = pathname === item.href;
                const isHighlight = (item as any).highlight;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 clip-corner border",
                      isHighlight && !isActive
                        ? "bg-gradient-to-r from-lime-500/20 to-emerald-500/10 text-lime-400 border-lime-500/40 hover:border-lime-400 animate-pulse"
                        : isActive
                          ? "bg-lime-500/10 text-lime-400 border-lime-500/30"
                          : "text-zinc-500 hover:text-white hover:bg-zinc-900/50 border-transparent hover:border-zinc-800"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive || isHighlight ? "text-lime-500" : "text-zinc-600")} />
                    <span>{item.label}</span>
                    {isActive && <div className="ml-auto w-1 h-1 bg-lime-500 animate-pulse rounded-full" />}
                    {isHighlight && !isActive && <div className="ml-auto text-[8px] bg-lime-500 text-black px-1 rounded font-black">NEW</div>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User / Wallet Section */}
      <div className="p-4 border-t border-zinc-900 bg-[#050505]">
        
        {/* Wallet Connector */}
        <button
          onClick={publicKey ? disconnectWallet : connectWallet}
          className={cn(
            "w-full mb-4 px-3 py-2 text-[10px] font-mono font-bold uppercase border overflow-hidden relative group transition-all clip-corner",
            publicKey 
              ? "border-zinc-800 text-lime-500 bg-zinc-900" 
              : "border-zinc-700 text-zinc-300 hover:border-lime-500 hover:text-white"
          )}
        >
          <div className="flex items-center justify-between relative z-10">
            <span className="flex items-center gap-2">
               <Wallet className="w-3 h-3" />
               {publicKey ? "Wallet_Connected" : "Connect_Wallet"}
            </span>
            {publicKey && <span>{truncAddr(publicKey)}</span>}
          </div>
          {/* Hover Fill Effect */}
          {!publicKey && (
            <div className="absolute inset-0 bg-lime-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0" />
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center font-bold text-xs text-white clip-corner border border-zinc-700">
               {user.name.charAt(0)}
             </div>
             <div className="flex flex-col">
               <span className="text-xs font-bold text-white uppercase">{user.name.split(" ")[0]}</span>
               <span className="text-[9px] font-mono text-zinc-500 uppercase">{user.role}_ACCESS</span>
             </div>
          </div>
          
          <button 
             onClick={logout}
             className="text-zinc-600 hover:text-red-500 transition-colors"
          >
             <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="h-4 w-full bg-black border-t border-zinc-900 flex items-center px-2 overflow-hidden shrink-0">
         <div className="w-full h-1.5 bg-hazard opacity-30" />
      </div>
    </aside>
  );
}
