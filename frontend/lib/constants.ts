// ============================================================
// Stellar / Soroban configuration constants
// ============================================================

export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org:443";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

// Contract ID - replace with your deployed contract ID
export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID ||
  "CDC3GUQDQFCMTC6GZCACPLQOSOC5TWH2H4L7YVINVWNAYUU7OXOQRH47";

// Stream duration (set in the smart contract)
export const STREAM_DURATION_SECONDS = 300; // 5 minutes
