"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ============================================================
// User Roles
// ============================================================
export type UserRole = "expert" | "trader" | "verifier" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Role metadata
export const ROLE_CONFIG: Record<UserRole, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  permissions: string[];
}> = {
  expert: {
    label: "Expert",
    icon: "◆",
    color: "text-lime-400",
    bgColor: "bg-lime-500/10",
    borderColor: "border-lime-500/20",
    description: "Publish trading strategies and earn profit-share from successful traders",
    permissions: ["create_strategy", "view_dashboard", "manage_strategies"],
  },
  trader: {
    label: "Trader",
    icon: "⚡",
    color: "text-zinc-200",
    bgColor: "bg-zinc-500/10",
    borderColor: "border-zinc-500/20",
    description: "Stake to unlock strategies, execute trades, submit P&L proof",
    permissions: ["execute_strategy", "submit_proof", "withdraw_rewards", "view_dashboard"],
  },
  verifier: {
    label: "Verifier",
    icon: "✓",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    description: "Review executions, run AI verification, and confirm on-chain",
    permissions: ["verify_execution", "view_dashboard", "ai_verification"],
  },
  admin: {
    label: "Admin",
    icon: "★",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    description: "Full system access, manage users, view analytics, and oversee operations",
    permissions: ["all"],
  },
};

// Demo users for quick-login buttons (auto-seeded into SQLite on first use)
export const DEMO_USERS: Record<UserRole, { email: string; password: string; name: string }> = {
  expert: { email: "expert@stratflow.io", password: "demo123", name: "Alice Chen" },
  trader: { email: "trader@stratflow.io", password: "demo123", name: "Bob Martinez" },
  verifier: { email: "verifier@stratflow.io", password: "demo123", name: "Carol Wang" },
  admin: { email: "admin@stratflow.io", password: "demo123", name: "Dave Kumar" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── On mount: check session via /api/auth/me ──
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user as User);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // ── Login via /api/auth/login ──
  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    setUser(data.user as User);
  }, []);

  // ── Signup via /api/auth/signup ──
  const signup = useCallback(async (name: string, email: string, password: string, role: UserRole) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Signup failed");
    }

    setUser(data.user as User);
  }, []);

  // ── Logout via /api/auth/logout ──
  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
  }, []);

  // ── Update user (client-side only) ──
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
