// ============================================================
// Stellar SDK helpers for interacting with Soroban contracts
// ============================================================

import * as StellarSdk from "@stellar/stellar-sdk";
import { rpc as StellarRpc } from "@stellar/stellar-sdk";
import {
  CONTRACT_ID,
  SOROBAN_RPC_URL,
  NETWORK_PASSPHRASE,
} from "./constants";

// Create a Soroban RPC server instance
export const server = new StellarRpc.Server(SOROBAN_RPC_URL);

/**
 * Build, sign, and submit a Soroban contract invocation transaction.
 * Returns the result of the transaction.
 */
export async function invokeContract(
  publicKey: string,
  functionName: string,
  args: StellarSdk.xdr.ScVal[],
  signTransaction: (
    xdr: string,
    opts: { networkPassphrase: string }
  ) => Promise<{ signedTxXdr: string }>
) {
  console.log("[StratFlow] invokeContract start:", functionName);
  console.log("[StratFlow] args count:", args.length);
  args.forEach((a, i) =>
    console.log(`[StratFlow] arg[${i}] switch:`, a.switch().name, a.switch().value)
  );

  // Get the source account
  console.log("[StratFlow] fetching account for:", publicKey);
  const account = await server.getAccount(publicKey);
  console.log("[StratFlow] account fetched, seq:", account.sequenceNumber());

  // Build the contract call
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  console.log("[StratFlow] contract id:", CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();
  console.log("[StratFlow] tx built OK");

  // Prepare (simulate) the transaction
  console.log("[StratFlow] preparing (simulating) transaction...");
  let preparedTx;
  try {
    preparedTx = await server.prepareTransaction(tx);
    console.log("[StratFlow] prepareTransaction OK");
  } catch (e: any) {
    console.error("[StratFlow] prepareTransaction FAILED:", e);
    // If simulation failed, try to get more details
    try {
      const sim = await server.simulateTransaction(tx);
      console.error("[StratFlow] simulation result:", JSON.stringify(sim, null, 2));
    } catch (simErr) {
      console.error("[StratFlow] simulateTransaction also failed:", simErr);
    }
    throw e;
  }

  // Sign with Freighter
  console.log("[StratFlow] requesting Freighter signature...");
  const xdrToSign = preparedTx.toEnvelope().toXDR("base64");
  console.log("[StratFlow] XDR to sign length:", xdrToSign.length);

  const signedResponse = await signTransaction(xdrToSign, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  console.log("[StratFlow] signTransaction response type:", typeof signedResponse.signedTxXdr);

  // Rebuild the signed transaction
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedResponse.signedTxXdr,
    NETWORK_PASSPHRASE
  ) as StellarSdk.Transaction;
  console.log("[StratFlow] signed tx rebuilt OK");

  // Submit
  console.log("[StratFlow] submitting transaction...");
  const txResult = await server.sendTransaction(signedTx);
  console.log("[StratFlow] sendTransaction status:", txResult.status);

  if (txResult.status !== "PENDING") {
    throw new Error(`Transaction failed with status: ${txResult.status}`);
  }

  // Poll for confirmation
  const hash = txResult.hash;
  console.log("[StratFlow] polling tx hash:", hash);
  let getResponse = await server.getTransaction(hash);

  while (getResponse.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResponse = await server.getTransaction(hash);
  }

  console.log("[StratFlow] final status:", getResponse.status);

  if (getResponse.status === "SUCCESS") {
    if (!getResponse.resultMetaXdr) {
      throw new Error("Empty resultMetaXdr in getTransaction response");
    }
    return getResponse;
  } else {
    throw new Error(`Transaction failed: ${getResponse.status}`);
  }
}

/**
 * Extract return value from a successful transaction result.
 */
export function extractReturnValue(
  response: StellarRpc.Api.GetSuccessfulTransactionResponse
): StellarSdk.xdr.ScVal | undefined {
  const meta = response.resultMetaXdr;
  try {
    // Try v3 first (older SDK)
    return (meta as any).v3().sorobanMeta()?.returnValue();
  } catch {
    try {
      // Try v4 (newer SDK)
      return (meta as any).v4?.().sorobanMeta?.()?.returnValue?.();
    } catch {
      return undefined;
    }
  }
}

/**
 * Convert native JS values to ScVal for contract arguments.
 */
export function toScValAddress(address: string): StellarSdk.xdr.ScVal {
  return new StellarSdk.Address(address).toScVal();
}

export function toScValU64(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "u64" });
}

export function toScValI128(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "i128" });
}

export function toScValBool(value: boolean): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "bool" });
}

/**
 * Parse common ScVal types to JS.
 */
export function scValToU64(scVal: StellarSdk.xdr.ScVal): number {
  return Number(StellarSdk.scValToNative(scVal));
}

export function scValToI128(scVal: StellarSdk.xdr.ScVal): number {
  return Number(StellarSdk.scValToNative(scVal));
}

export function scValToBool(scVal: StellarSdk.xdr.ScVal): boolean {
  return StellarSdk.scValToNative(scVal);
}

export function toScValString(value: string): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "string" });
}

/**
 * Read-only contract query (no signing needed).
 * Uses simulateTransaction to call view functions.
 */
export async function queryContract(
  functionName: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.xdr.ScVal | undefined> {
  console.log("[StratFlow] queryContract:", functionName);

  // Use a dummy source account for simulation (read-only calls don't need a real one)
  // We use the contract's own address as a dummy source
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  // We need a valid account - use a well-known testnet friendbot account
  const dummyKeypair = StellarSdk.Keypair.random();
  const dummyPublicKey = dummyKeypair.publicKey();

  // Build a minimal transaction for simulation
  let account: StellarSdk.Account;
  try {
    account = await server.getAccount(dummyPublicKey);
  } catch {
    // If can't fetch (unfunded), create a dummy account object
    account = new StellarSdk.Account(dummyPublicKey, "0");
  }

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if (
    StellarRpc.Api.isSimulationSuccess(sim) &&
    sim.result?.retval
  ) {
    return sim.result.retval;
  }

  console.error("[StratFlow] queryContract failed:", sim);
  return undefined;
}
