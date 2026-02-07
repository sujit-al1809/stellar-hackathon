"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, ROLE_CONFIG, type UserRole } from "@/lib/auth";
import { useWallet } from "./WalletProvider";
import { Avatar, RoleBadge } from "./ui";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  PlusCircle,
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
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  grid: LayoutGrid,
  "plus-circle": PlusCircle,
  layers: Layers,
  zap: Zap,
  "file-text": FileText,
  "check-circle": CheckCircle,
  eye: Eye,
  settings: Settings,
  dashboard: BarChart3,
  store: Store,
  shield: Shield,
};

const NAV_SECTIONS: Record<UserRole | "common", {
  label?: string;
  items: { href: string; label: string; icon: string }[];
}> = {
  common: {
    items: [
      { href: "/app", label: "Overview", icon: "grid" },
      { href: "/app/marketplace", label: "Marketplace", icon: "store" },
    ],
  },
  expert: {
    label: "Expert",
    items: [
      { href: "/app/create", label: "Publish Strategy", icon: "plus-circle" },
      { href: "/app/strategies", label: "My Strategies", icon: "layers" },
      { href: "/app/dispute", label: "Disputes", icon: "shield" },
    ],
  },
  trader: {
    label: "Trader",
    items: [
      { href: "/app/execute", label: "Execute & Submit", icon: "zap" },
      { href: "/app/submissions", label: "My Submissions", icon: "file-text" },
    ],
  },
  verifier: {
    label: "Verification",
    items: [
      { href: "/app/verify", label: "Verify", icon: "check-circle" },
      { href: "/app/reviews", label: "My Reviews", icon: "eye" },
    ],
  },
  admin: {
    label: "Admin",
    items: [
      { href: "/app/create", label: "Create", icon: "plus-circle" },
      { href: "/app/execute", label: "Execute", icon: "zap" },
      { href: "/app/verify", label: "Verify", icon: "check-circle" },
      { href: "/app/dispute", label: "Disputes", icon: "shield" },
      { href: "/app/admin", label: "Settings", icon: "settings" },
    ],
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { publicKey, connectWallet, disconnectWallet } = useWallet();

  if (!user) return null;

  const sections = [NAV_SECTIONS.common, NAV_SECTIONS[user.role]];
  const truncAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <aside className="surface-sidebar fixed left-0 top-0 h-screen w-56 z-40 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-zinc-800/80">
        <Link href="/app" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-lime-500 flex items-center justify-center text-black font-black text-[11px]">
            SF
          </div>
          <span className="text-sm font-bold text-zinc-100 tracking-tight">
            StratFlow
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className="px-2 mb-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = ICON_MAP[item.icon] || LayoutGrid;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-lime-500" : "text-zinc-600")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Dashboard */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
            Rewards
          </div>
          <Link
            href="/app/dashboard"
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors",
              pathname === "/app/dashboard"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            )}
          >
            <BarChart3 className={cn("w-4 h-4", pathname === "/app/dashboard" ? "text-lime-500" : "text-zinc-600")} />
            <span>Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* Wallet */}
      <div className="px-3 py-2.5 border-t border-zinc-800/80">
        {publicKey ? (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-zinc-900/50">
            <div className="dot-live shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-lime-500 font-semibold">Connected</div>
              <div className="text-[10px] text-zinc-600 font-mono truncate">{truncAddr(publicKey)}</div>
            </div>
            <button onClick={disconnectWallet} className="text-zinc-600 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={connectWallet} className="w-full btn-secondary text-xs !py-2 flex items-center justify-center gap-2">
            <Wallet className="w-3.5 h-3.5" />
            Connect Wallet
          </button>
        )}
      </div>

      {/* Profile */}
      <div className="px-3 py-3 border-t border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <Avatar name={user.name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-zinc-200 truncate">{user.name}</div>
            <RoleBadge role={user.role} />
          </div>
          <button onClick={logout} className="text-zinc-600 hover:text-red-400 transition-colors p-1" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
