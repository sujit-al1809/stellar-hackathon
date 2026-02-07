"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Spinner } from "@/components/ui";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-zinc-500 text-sm">Loading StratFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen">
        {/* Top bar */}
        <header className="surface-topbar sticky top-0 z-30 h-14 flex items-center justify-between px-8">
          <div>
            <h2 className="text-sm font-medium text-zinc-100">Welcome back, {user.name.split(" ")[0]}</h2>
            <p className="text-xs text-zinc-600">Stellar Testnet</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="surface-card !p-2 !rounded-lg flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-zinc-500 font-mono">Testnet</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
