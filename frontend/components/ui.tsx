"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check, Circle, Loader2 } from "lucide-react";

// ============================================================
// Card — Clean surface card
// ============================================================
export function Card({
  children,
  className = "",
  hover = true,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "surface-card",
        hover && "hover:border-zinc-700/80",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Alias for backward compat
export const GlassCard = Card;

// ============================================================
// StatusBadge
// ============================================================
export function StatusBadge({
  status,
}: {
  status: "not-verified" | "verified" | "streaming" | "completed" | "pending";
}) {
  const config = {
    "not-verified": { label: "Not Verified", cls: "badge-red" },
    pending: { label: "Pending", cls: "badge-amber" },
    verified: { label: "Verified", cls: "badge-lime" },
    streaming: { label: "Streaming", cls: "badge-blue" },
    completed: { label: "Completed", cls: "badge-lime" },
  };
  const c = config[status];
  return (
    <span className={cn("badge", c.cls)}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "verified" || status === "completed" ? "bg-lime-500" :
        status === "streaming" || status === "pending" ? "bg-current animate-pulse-dot" :
        "bg-current"
      )} />
      {c.label}
    </span>
  );
}

// ============================================================
// RoleBadge
// ============================================================
export function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { icon: string; cls: string }> = {
    strategist: { icon: "◆", cls: "badge-blue" },
    executor: { icon: "⚡", cls: "badge-amber" },
    verifier: { icon: "✓", cls: "badge-lime" },
    admin: { icon: "★", cls: "badge-zinc" },
  };
  const c = config[role] || config.executor;
  return (
    <span className={cn("badge", c.cls)}>
      <span className="text-[10px]">{c.icon}</span>
      <span className="capitalize">{role}</span>
    </span>
  );
}

// ============================================================
// BigNumber — Large display number
// ============================================================
export function BigNumber({
  value,
  label,
  suffix = "XLM",
  color = "text-gradient",
}: {
  value: string | number;
  label: string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className="relative inline-block">
        <div className={cn(
          "text-5xl md:text-6xl font-bold font-mono tracking-tight",
          color
        )}>
          {value}
          <span className="text-xl text-zinc-500 font-normal ml-3">{suffix}</span>
        </div>
        {color === "text-gradient" && (
          <div className="absolute inset-0 blur-2xl opacity-30 bg-gradient-to-r from-lime-500 via-cyan-500 to-purple-500" />
        )}
      </div>
      <div className="text-sm text-zinc-400 mt-3 uppercase tracking-widest font-medium">{label}</div>
    </div>
  );
}

// ============================================================
// Spinner
// ============================================================
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];
  return <Loader2 className={cn("animate-spin text-zinc-500", sizeClass)} />;
}

// ============================================================
// StepIndicator — Minimal step flow
// ============================================================
export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="flex items-center justify-between mb-8 px-4">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-all duration-300",
                i < currentStep
                  ? "bg-gradient-to-br from-lime-500/20 to-emerald-500/20 text-lime-400 border border-lime-500/40 shadow-lg shadow-lime-500/20"
                  : i === currentStep
                  ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/20 scale-110"
                  : "bg-zinc-900/50 text-zinc-600 border border-zinc-800"
              )}
            >
              {i < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            <span className={cn(
              "text-[11px] font-medium hidden sm:block transition-colors",
              i <= currentStep ? "text-zinc-200" : "text-zinc-600"
            )}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="relative flex-1 h-px mx-3">
              <div className={cn(
                "absolute inset-0 transition-all duration-500",
                i < currentStep
                  ? "bg-gradient-to-r from-lime-500/40 to-emerald-500/40"
                  : "bg-zinc-800"
              )} />
              {i < currentStep && (
                <div className="absolute inset-0 bg-gradient-to-r from-lime-500/60 to-emerald-500/60 animate-pulse" />
              )}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// StatCard — Metric display
// ============================================================
export function StatCard({
  label,
  value,
  icon,
  trend,
  color = "default",
}: {
  label: string;
  value: string | number;
  icon: string;
  trend?: { value: string; up: boolean };
  color?: "default" | "lime" | "blue" | "amber" | "red";
}) {
  const colorClasses = {
    default: "from-zinc-800/50 to-zinc-900/50 border-zinc-700/50",
    lime: "from-lime-500/10 to-emerald-500/10 border-lime-500/30 shadow-lime-500/10",
    blue: "from-blue-500/10 to-cyan-500/10 border-blue-500/30 shadow-blue-500/10",
    amber: "from-amber-500/10 to-orange-500/10 border-amber-500/30 shadow-amber-500/10",
    red: "from-red-500/10 to-rose-500/10 border-red-500/30 shadow-red-500/10",
  };

  return (
    <Card className={cn(
      "!p-5 !bg-gradient-to-br transition-all duration-300 hover:scale-105",
      colorClasses[color]
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl filter drop-shadow-lg">{icon}</span>
        {trend && (
          <span className={cn(
            "text-xs font-mono font-semibold px-2 py-1 rounded-lg",
            trend.up
              ? "bg-lime-500/20 text-lime-400 border border-lime-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          )}>
            {trend.up ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-zinc-100 font-mono tracking-tight">{value}</div>
      <div className="text-xs text-zinc-400 mt-1.5 font-medium uppercase tracking-wider">{label}</div>
    </Card>
  );
}

// ============================================================
// Avatar
// ============================================================
export function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = { sm: "w-7 h-7 text-[10px]", md: "w-9 h-9 text-xs", lg: "w-12 h-12 text-sm" }[size];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        sizeClass,
        "rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold",
        className
      )}
    >
      {initials}
    </div>
  );
}

// ============================================================
// EmptyState
// ============================================================
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <Card className="text-center py-16 hover:border-zinc-800" hover={false}>
      <div className="text-4xl mb-4 opacity-50">{icon}</div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-1">{title}</h3>
      <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <a href={action.href} className="btn-primary inline-flex items-center gap-2">
          {action.label} →
        </a>
      )}
    </Card>
  );
}