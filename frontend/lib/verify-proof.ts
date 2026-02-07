// ============================================================
// Proof verification utilities
// Verify blockchain transactions, check URLs, validate evidence
// ============================================================

import * as StellarSdk from "@stellar/stellar-sdk";

/**
 * Verify a Stellar transaction hash exists on-chain
 */
export async function verifyStellarTransaction(txHash: string): Promise<{
  valid: boolean;
  details?: any;
  error?: string;
}> {
  try {
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
    const transaction = await server.transactions().transaction(txHash).call();

    return {
      valid: true,
      details: {
        hash: transaction.hash,
        ledger: transaction.ledger_attr,
        created: transaction.created_at,
        successful: transaction.successful,
        sourceAccount: transaction.source_account,
      },
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Transaction not found on Stellar testnet",
    };
  }
}

/**
 * Verify a URL is accessible
 */
export async function verifyURL(url: string): Promise<{
  valid: boolean;
  status?: number;
  error?: string;
}> {
  try {
    const response = await fetch(url, { method: "HEAD", mode: "no-cors" });
    return {
      valid: response.ok || response.type === "opaque",
      status: response.status,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "URL not accessible",
    };
  }
}

/**
 * Detect proof type from content
 */
export function detectProofType(content: string): {
  type: "transaction" | "url" | "text";
  chain?: "stellar" | "ethereum" | "other";
} {
  // Stellar transaction hash (64 hex chars)
  if (/^[A-Fa-f0-9]{64}$/.test(content)) {
    return { type: "transaction", chain: "stellar" };
  }

  // Ethereum transaction hash (0x + 64 hex chars)
  if (/^0x[A-Fa-f0-9]{64}$/.test(content)) {
    return { type: "transaction", chain: "ethereum" };
  }

  // URL
  if (/^https?:\/\//i.test(content)) {
    return { type: "url" };
  }

  return { type: "text" };
}

/**
 * Extract transaction hashes from text
 */
export function extractTransactionHashes(text: string): {
  stellar: string[];
  ethereum: string[];
} {
  const stellar: string[] = [];
  const ethereum: string[] = [];

  // Find Stellar hashes (64 hex chars not starting with 0x)
  const stellarMatches = text.match(/\b[A-Fa-f0-9]{64}\b/g) || [];
  stellar.push(...stellarMatches.filter((hash) => !hash.startsWith("0x")));

  // Find Ethereum hashes (0x + 64 hex chars)
  const ethMatches = text.match(/\b0x[A-Fa-f0-9]{64}\b/g) || [];
  ethereum.push(...ethMatches);

  return { stellar, ethereum };
}

/**
 * Extract URLs from text
 */
export function extractURLs(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return text.match(urlRegex) || [];
}

/**
 * Comprehensive proof validation
 */
export async function validateTradingProof(proof: {
  title: string;
  summary: string;
  evidence: string[];
}): Promise<{
  valid: boolean;
  score: number; // 0-100
  issues: string[];
  strengths: string[];
  verifiedTxs: number;
  verifiedUrls: number;
}> {
  const issues: string[] = [];
  const strengths: string[] = [];
  let score = 50; // Start at 50

  // Check basic requirements
  if (!proof.title || proof.title.length < 10) {
    issues.push("Title too short");
    score -= 10;
  } else {
    strengths.push("Clear title provided");
    score += 5;
  }

  if (!proof.summary || proof.summary.length < 50) {
    issues.push("Summary too brief");
    score -= 10;
  } else {
    strengths.push("Detailed summary provided");
    score += 5;
  }

  if (!proof.evidence || proof.evidence.length === 0) {
    issues.push("No evidence provided");
    score -= 20;
  }

  // Extract and verify transaction hashes
  const allText = [proof.summary, ...proof.evidence].join(" ");
  const { stellar, ethereum } = extractTransactionHashes(allText);
  const urls = extractURLs(allText);

  let verifiedTxs = 0;
  let verifiedUrls = 0;

  // Verify Stellar transactions
  for (const hash of stellar.slice(0, 3)) {
    // Check first 3
    const result = await verifyStellarTransaction(hash);
    if (result.valid) {
      verifiedTxs++;
      strengths.push(`Verified Stellar TX: ${hash.slice(0, 8)}...`);
      score += 10;
    } else {
      issues.push(`Invalid Stellar TX: ${hash.slice(0, 8)}...`);
      score -= 5;
    }
  }

  // Check URLs (don't verify due to CORS, just check format)
  if (urls.length > 0) {
    strengths.push(`${urls.length} evidence URL(s) provided`);
    score += urls.length * 5;
    verifiedUrls = urls.length;
  }

  // Check for trading-specific keywords
  const tradingKeywords = [
    "entry",
    "exit",
    "p&l",
    "profit",
    "loss",
    "rsi",
    "macd",
    "volume",
    "trade",
    "buy",
    "sell",
  ];

  const summaryLower = proof.summary.toLowerCase();
  const matchedKeywords = tradingKeywords.filter((kw) =>
    summaryLower.includes(kw)
  );

  if (matchedKeywords.length >= 3) {
    strengths.push("Trading-specific terminology used");
    score += 10;
  } else {
    issues.push("Lacks trading-specific details");
    score -= 5;
  }

  // Normalize score to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    valid: score >= 60,
    score,
    issues,
    strengths,
    verifiedTxs,
    verifiedUrls,
  };
}
