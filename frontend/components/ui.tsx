"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check, Circle, Loader2, Activity, Square, Terminal } from "lucide-react";

// ============================================================
// Card — Cyber style surface
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
        "relative bg-zinc-950 border border-zinc-800 p-6 clip-corner transition-all duration-300",
        hover && "hover:border-lime-500/50 hover:bg-zinc-900",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
      onClick={onClick}
    >
      {/* Corner Accents */}
      <div className={cn("absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 transition-colors pointer-events-none", hover && "group-hover:border-lime-500")} />
      <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-700 transition-colors pointer-events-none", hover && "group-hover:border-lime-500")} />
      
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
    "not-verified": { label: "UNVERIFIED", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-500", dot: "bg-red-500" },
    pending: { label: "PENDING...", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500", dot: "bg-amber-500 animate-pulse" },
    verified: { label: "VERIFIED_OK", bg: "bg-lime-500/10", border: "border-lime-500/30", text: "text-lime-400", dot: "bg-lime-500" },
    streaming: { label: "STREAMING >>", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", dot: "bg-blue-500 animate-pulse" },
    completed: { label: "EXE_COMPLETE", bg: "bg-zinc-800", border: "border-zinc-700", text: "text-zinc-400", dot: "bg-zinc-500" },
  };
  const c = config[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-2 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border",
      c.bg, c.border, c.text
    )}>
      <span className={cn("w-1.5 h-1.5", c.dot)} />
      {c.label}
    </span>
  );
}

// ============================================================
// RoleBadge
// ============================================================
export function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { icon: string; cls: string }> = {
    strategist: { icon: "◆", cls: "bg-blue-500/10 border-blue-500 text-blue-400" },
    executor: { icon: "⚡", cls: "bg-amber-500/10 border-amber-500 text-amber-400" },
    verifier: { icon: "✓", cls: "bg-lime-500/10 border-lime-500 text-lime-400" },
    admin: { icon: "★", cls: "bg-purple-500/10 border-purple-500 text-purple-400" },
  };
  const c = config[role] || config.executor;
  return (
    <span className={cn(
      "inline-flex items-center gap-2 px-2 py-0.5 text-[10px] font-mono font-bold uppercase border",
      c.cls
    )}>
      <span>{c.icon}</span>
      <span>{role}</span>
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
  color = "text-white",
}: {
  value: string | number;
  label: string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="font-mono">
      <div className="flex items-baseline gap-2">
        <div className={cn("text-4xl font-bold tracking-tighter", color)}>
          {value}
        </div>
        <div className="text-sm text-zinc-500 font-bold">{suffix}</div>
      </div>
      <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1 border-l-2 border-lime-500/50 pl-2">
         {label}
      </div>
    </div>
  );
}

// ============================================================
// StatCard - Dashboard statistic
// ============================================================
export function StatCard({ 
  label, 
  value, 
  icon: Icon,
  trend 
}: { 
  label: string; 
  value: string; 
  icon?: any;
  trend?: string;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-900 p-4 relative group hover:border-lime-500/30 transition-colors">
       <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-mono uppercase text-zinc-500">{label}</span>
          {Icon && <Icon className="w-4 h-4 text-zinc-700 group-hover:text-lime-500 transition-colors" />}
       </div>
       <div className="text-2xl font-bold text-zinc-200 font-mono tracking-tight">{value}</div>
       {trend && <div className="text-[10px] text-lime-500 mt-1">{trend}</div>}
       
       {/* Decor */}
       <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
    </div>
  )
}

// ============================================================
// Spinner
// ============================================================
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-6 w-6" }[size];
  return <Loader2 className={cn("animate-spin text-lime-500", sizeClass)} />;
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
    <div className="flex items-center justify-between mb-8 px-1 relative">
      {/* Connecting Line */}
      <div className="absolute left-0 top-1/2 w-full h-[1px] bg-zinc-800 z-0 -translate-y-1/2" />
      
      {steps.map((step, i) => {
         const isActive = i <= currentStep;
         const isCurrent = i === currentStep;
         
         return (
        <div key={i} className="relative z-10 flex flex-col items-center gap-2 bg-zinc-950 px-2">
          <div
            className={cn(
              "w-8 h-8 flex items-center justify-center text-xs font-mono font-bold border transition-all duration-300",
              isCurrent
                ? "bg-lime-500 text-black border-lime-500" 
                : isActive 
                  ? "bg-zinc-900 text-lime-500 border-lime-500/50"
                  : "bg-black text-zinc-700 border-zinc-800"
            )}
          >
            {isActive && !isCurrent ? <Check className="w-4 h-4" /> : `0${i + 1}`}
          </div>
          <span className={cn(
             "text-[10px] font-mono uppercase tracking-wider",
             isCurrent ? "text-lime-500" : "text-zinc-600"
          )}>
             {step}
          </span>
        </div>
      )})}
    </div>
  );
}

// ============================================================
// EmptyState
// ============================================================
export function EmptyState({
   label,
   action
}: {
   label: string;
   action?: React.ReactNode;
}) {
   return (
      <div className="border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center flex flex-col items-center justify-center gap-4">
         <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center rounded-full mb-2">
            <Terminal className="w-6 h-6 text-zinc-600" />
         </div>
         <p className="text-zinc-500 font-mono text-sm uppercase">{label}</p>
         {action}
      </div>
   )
}
