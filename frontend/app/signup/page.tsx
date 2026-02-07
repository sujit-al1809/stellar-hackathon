"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, ROLE_CONFIG, type UserRole } from "@/lib/auth";

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-surface-0">
      <div className="w-full max-w-lg animate-fade-in">
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
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Create your account</h1>
          <p className="text-zinc-500 text-sm">Join the strategy execution protocol</p>
        </div>

        <div className="surface-card !p-7">
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="surface-input w-full"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
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

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2.5">Choose your role</label>
              <div className="grid grid-cols-2 gap-2.5">
                {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([roleKey, config]) => (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setRole(roleKey)}
                    className={`p-3.5 rounded-lg border text-left transition-all duration-200 ${
                      role === roleKey
                        ? "bg-lime-500/10 border-lime-500/30 ring-1 ring-lime-500/20 ring-offset-0"
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lime-400 text-sm">{config.icon}</span>
                      <span className={`text-sm font-semibold ${role === roleKey ? "text-lime-400" : "text-zinc-300"}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">{config.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="surface-input w-full"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Confirm</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="surface-input w-full"
                  placeholder="••••••••"
                  required
                />
              </div>
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
                  Creating account...
                </span>
              ) : (
                `Create ${ROLE_CONFIG[role].label} Account`
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-lime-400 hover:text-lime-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
