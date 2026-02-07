"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_USERS, ROLE_CONFIG, type UserRole } from "@/lib/auth";

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-surface-0">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-lime-500 flex items-center justify-center text-black font-bold text-base">
              SF
            </div>
            <span className="text-xl font-semibold text-zinc-100 tracking-tight">
              StratFlow
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Welcome back</h1>
          <p className="text-zinc-500 text-sm">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="surface-card !p-7">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="surface-input w-full"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="surface-input w-full"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 text-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-lime-400 hover:text-lime-300 font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </div>

        {/* Quick Demo Access */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Quick Demo</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([role, config]) => (
              <button
                key={role}
                onClick={() => handleDemoLogin(role)}
                disabled={loading}
                className={`surface-card !p-3 flex items-center gap-2.5 text-left hover:!border-zinc-600 transition-all disabled:opacity-50`}
              >
                <span className="text-lg text-lime-400">{config.icon}</span>
                <div>
                  <div className="text-sm font-medium text-zinc-200">{config.label}</div>
                  <div className="text-[10px] text-zinc-600">Demo login</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
