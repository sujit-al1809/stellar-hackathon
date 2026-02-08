// ============================================================
// Contract interaction functions
// Thin wrappers around invokeContract for each contract method
// ============================================================

import {
  invokeContract,
  extractReturnValue,
  queryContract,
  toScValAddress,
  toScValU64,
  toScValI128,
  toScValBool,
  scValToU64,
  scValToI128,
  scValToBool,
} from "./stellar";
import * as StellarSdk from "@stellar/stellar-sdk";

type SignFn = (
  xdr: string,
  opts: { networkPassphrase: string }
) => Promise<{ signedTxXdr: string }>;

/**
 * Create a new strategy on-chain.
 * Returns the strategy_id.
 */
export async function createStrategy(
  publicKey: string,
  rewardAmount: number,
  signTransaction: SignFn
): Promise<number> {
  const response = await invokeContract(
    publicKey,
    "create_strategy",
    [toScValAddress(publicKey), toScValI128(rewardAmount)],
    signTransaction
  );

  const returnValue = extractReturnValue(response as any);
  if (!returnValue) throw new Error("No return value from create_strategy");
  return scValToU64(returnValue);
}

/**
 * Submit an execution for a strategy.
 * Returns the execution_id.
 */
export async function submitExecution(
  publicKey: string,
  strategyId: number,
  signTransaction: SignFn
): Promise<number> {
  const response = await invokeContract(
    publicKey,
    "submit_execution",
    [toScValAddress(publicKey), toScValU64(strategyId)],
    signTransaction
  );

  const returnValue = extractReturnValue(response as any);
  if (!returnValue) throw new Error("No return value from submit_execution");
  return scValToU64(returnValue);
}

/**
 * Verify an execution on-chain after AI approval.
 * Now enters DISPUTE WINDOW — does NOT immediately start stream.
 * Returns true if AI approved.
 */
export async function verifyExecution(
  publicKey: string,
  executionId: number,
  approved: boolean,
  signTransaction: SignFn
): Promise<boolean> {
  const response = await invokeContract(
    publicKey,
    "verify_execution",
    [toScValU64(executionId), toScValBool(approved)],
    signTransaction
  );

  const returnValue = extractReturnValue(response as any);
  if (!returnValue) throw new Error("No return value from verify_execution");
  return scValToBool(returnValue);
}

/**
 * Set AI confidence score on-chain for an execution.
 */
export async function setConfidence(
  publicKey: string,
  executionId: number,
  confidence: number,
  signTransaction: SignFn
): Promise<void> {
  await invokeContract(
    publicKey,
    "set_confidence",
    [toScValU64(executionId), toScValU64(confidence)], // u32 uses same encoding
    signTransaction
  );
}

/**
 * Raise a dispute as the strategy creator.
 * Can only be called during the dispute window after AI approval.
 * reason_code: 1=fake_proof, 2=incomplete, 3=plagiarized
 * Returns dispute_id.
 */
export async function raiseDispute(
  publicKey: string,
  executionId: number,
  reasonCode: number,
  signTransaction: SignFn
): Promise<number> {
  const response = await invokeContract(
    publicKey,
    "raise_dispute",
    [toScValAddress(publicKey), toScValU64(executionId), toScValU64(reasonCode)],
    signTransaction
  );

  const returnValue = extractReturnValue(response as any);
  if (!returnValue) throw new Error("No return value from raise_dispute");
  return scValToU64(returnValue);
}

/**
 * Resolve a dispute. Called after secondary AI review.
 * upheld=true → trader slashed, expert refunded
 * upheld=false → execution cleared, stream starts
 */
export async function resolveDispute(
  publicKey: string,
  executionId: number,
  upheld: boolean,
  signTransaction: SignFn
): Promise<boolean> {
  const response = await invokeContract(
    publicKey,
    "resolve_dispute",
    [toScValU64(executionId), toScValBool(upheld)],
    signTransaction
  );

  const returnValue = extractReturnValue(response as any);
  if (!returnValue) throw new Error("No return value from resolve_dispute");
  return scValToBool(returnValue);
}

/**
 * Finalize an execution after the dispute window expires
 * without any dispute. Starts the reward stream.
 */
export async function finalizeExecution(
  publicKey: string,
  executionId: number,
  signTransaction: SignFn
): Promise<boolean> {
  const response = await invokeContract(
    publicKey,
    "finalize_execution",
    [toScValU64(executionId)],
    signTransaction
  );

  const returnValue = extractReturnValue(response as any);
  if (!returnValue) throw new Error("No return value from finalize_execution");
  return scValToBool(returnValue);
}

/**
 * Withdraw earned rewards from a stream.
 * Returns the withdrawn amount.
 */
export async function withdrawReward(
  publicKey: string,
  executionId: number,
  amount: number,
  signTransaction: SignFn
): Promise<number> {
  const response = await invokeContract(
    publicKey,
    "withdraw_reward",
    [
      toScValAddress(publicKey),
      toScValU64(executionId),
      toScValI128(amount),
    ],
    signTransaction
  );

  const returnValue = extractReturnValue(response as any);
  if (!returnValue) throw new Error("No return value from withdraw_reward");
  return scValToU64(returnValue);
}

// ============================================================
// READ-ONLY CONTRACT QUERIES (no wallet signature needed)
// ============================================================

// Note: These interfaces map to on-chain contract data
// creator = Expert (user-facing)
// executor = Trader (user-facing)
export interface OnChainStrategy {
  creator: string; // Expert's address
  reward_amount: number; // Stake amount in XLM
  active: boolean;
}

export interface OnChainExecution {
  executor: string; // Trader's address
  strategy_id: number;
  verified: boolean;
  status: string;
  stake_amount: number;
  approved_at: number;
  confidence: number;
}

export interface OnChainStream {
  total_amount: number;
  start_time: number;
  end_time: number;
  withdrawn: number;
}

/**
 * Parse a Soroban struct ScVal into a plain JS object.
 */
function parseScValStruct(scVal: StellarSdk.xdr.ScVal): Record<string, any> {
  const native = StellarSdk.scValToNative(scVal);
  // scValToNative returns a Map or object for structs
  if (native instanceof Map) {
    const obj: Record<string, any> = {};
    native.forEach((v: any, k: string) => {
      obj[k] = typeof v === "bigint" ? Number(v) : v;
    });
    return obj;
  }
  // Already a plain object - convert bigints
  if (typeof native === "object" && native !== null) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(native)) {
      obj[k] = typeof v === "bigint" ? Number(v) : v;
    }
    return obj;
  }
  return native;
}

/**
 * Get strategy by ID from the contract.
 */
export async function getStrategy(strategyId: number): Promise<OnChainStrategy | null> {
  try {
    const result = await queryContract("get_strategy", [toScValU64(strategyId)]);
    if (!result) return null;
    const parsed = parseScValStruct(result);
    return {
      creator: parsed.creator?.toString?.() || parsed.creator || "",
      reward_amount: Number(parsed.reward_amount || 0),
      active: Boolean(parsed.active),
    };
  } catch (e) {
    console.error("[StratFlow] getStrategy error:", e);
    return null;
  }
}

/**
 * Get execution by ID from the contract.
 */
export async function getExecution(executionId: number): Promise<OnChainExecution | null> {
  try {
    const result = await queryContract("get_execution", [toScValU64(executionId)]);
    if (!result) return null;
    const parsed = parseScValStruct(result);
    return {
      executor: parsed.executor?.toString?.() || parsed.executor || "",
      strategy_id: Number(parsed.strategy_id || 0),
      verified: Boolean(parsed.verified),
      status: parseExecStatus(parsed.status),
      stake_amount: Number(parsed.stake_amount || 0),
      approved_at: Number(parsed.approved_at || 0),
      confidence: Number(parsed.confidence || 0),
    };
  } catch (e) {
    console.error("[StratFlow] getExecution error:", e);
    return null;
  }
}

/**
 * Parse ExecStatus enum from Soroban ScVal
 */
function parseExecStatus(status: any): string {
  if (typeof status === 'string') return status;
  // Soroban enums come as objects or strings
  if (status && typeof status === 'object') {
    // Could be { Pending: undefined } or similar
    const keys = Object.keys(status);
    if (keys.length > 0) return keys[0];
  }
  return 'Pending';
}

export interface OnChainDispute {
  challenger: string;
  execution_id: number;
  reason_code: number;
  created_at: number;
  resolved: boolean;
  upheld: boolean;
}

/**
 * Get dispute by ID from the contract.
 */
export async function getDispute(disputeId: number): Promise<OnChainDispute | null> {
  try {
    const result = await queryContract("get_dispute", [toScValU64(disputeId)]);
    if (!result) return null;
    const parsed = parseScValStruct(result);
    return {
      challenger: parsed.challenger?.toString?.() || parsed.challenger || "",
      execution_id: Number(parsed.execution_id || 0),
      reason_code: Number(parsed.reason_code || 0),
      created_at: Number(parsed.created_at || 0),
      resolved: Boolean(parsed.resolved),
      upheld: Boolean(parsed.upheld),
    };
  } catch (e) {
    console.error("[StratFlow] getDispute error:", e);
    return null;
  }
}

/**
 * Get dispute window constant from contract.
 */
export async function getDisputeWindow(): Promise<number> {
  try {
    const result = await queryContract("get_dispute_window", []);
    if (!result) return 60; // default
    return Number(StellarSdk.scValToNative(result));
  } catch {
    return 60;
  }
}

/**
 * Get reward stream by execution ID from the contract.
 */
export async function getStream(executionId: number): Promise<OnChainStream | null> {
  try {
    const result = await queryContract("get_stream", [toScValU64(executionId)]);
    if (!result) return null;
    const parsed = parseScValStruct(result);
    return {
      total_amount: Number(parsed.total_amount || 0),
      start_time: Number(parsed.start_time || 0),
      end_time: Number(parsed.end_time || 0),
      withdrawn: Number(parsed.withdrawn || 0),
    };
  } catch (e) {
    console.error("[StratFlow] getStream error:", e);
    return null;
  }
}

/**
 * Get earned amount for a stream from the contract.
 */
export async function getEarned(executionId: number): Promise<number | null> {
  try {
    const result = await queryContract("get_earned", [toScValU64(executionId)]);
    if (!result) return null;
    return Number(StellarSdk.scValToNative(result));
  } catch (e) {
    console.error("[StratFlow] getEarned error:", e);
    return null;
  }
}

// ============================================================
// LOCAL STRATEGY METADATA STORAGE
// These store off-chain metadata (title, description, rules)
// since the smart contract only stores creator + reward_amount.
// ============================================================

export interface StrategyMeta {
  id: number;
  title: string;
  description: string;
  rules: string[];
  rewardAmount: number;
  stakeAmount?: number;
  profitSharePercent?: number;
  baseAsset?: string;
  counterAsset?: string;
  creatorAddress: string;
  createdAt: string;
}

export interface ExecutionMeta {
  id: number;
  strategyId: number;
  proof: { title: string; summary: string; steps: string[] };
  executorAddress: string;
  createdAt: string;
}

/**
 * Save strategy metadata locally (keyed by on-chain ID).
 */
export function saveStrategyMeta(meta: StrategyMeta): void {
  const all = getAllStrategyMetas();
  all[meta.id] = meta;
  localStorage.setItem("stratflow_strategies", JSON.stringify(all));
}

/**
 * Get all stored strategy metas.
 */
export function getAllStrategyMetas(): Record<number, StrategyMeta> {
  try {
    return JSON.parse(localStorage.getItem("stratflow_strategies") || "{}");
  } catch {
    return {};
  }
}

/**
 * Get a specific strategy meta by ID.
 */
export function getStrategyMeta(strategyId: number): StrategyMeta | null {
  const all = getAllStrategyMetas();
  return all[strategyId] || null;
}

/**
 * Save execution metadata locally.
 */
export function saveExecutionMeta(meta: ExecutionMeta): void {
  const all = getAllExecutionMetas();
  all[meta.id] = meta;
  localStorage.setItem("stratflow_executions", JSON.stringify(all));
}

/**
 * Get all stored execution metas.
 */
export function getAllExecutionMetas(): Record<number, ExecutionMeta> {
  try {
    return JSON.parse(localStorage.getItem("stratflow_executions") || "{}");
  } catch {
    return {};
  }
}

/**
 * Get a specific execution meta by ID.
 */
export function getExecutionMeta(executionId: number): ExecutionMeta | null {
  const all = getAllExecutionMetas();
  return all[executionId] || null;
}

/**
 * Save an activity event to localStorage.
 */
export function saveActivity(activity: { icon: string; action: string; time: string }): void {
  try {
    const all = JSON.parse(localStorage.getItem("stratflow_activity") || "[]");
    all.unshift(activity);
    // Keep max 50 entries
    if (all.length > 50) all.length = 50;
    localStorage.setItem("stratflow_activity", JSON.stringify(all));
  } catch {
    localStorage.setItem("stratflow_activity", JSON.stringify([activity]));
  }
}

/**
 * Get recent activities.
 */
export function getActivities(): { icon: string; action: string; time: string }[] {
  try {
    return JSON.parse(localStorage.getItem("stratflow_activity") || "[]");
  } catch {
    return [];
  }
}
