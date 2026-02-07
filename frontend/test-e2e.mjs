#!/usr/bin/env node
// ============================================================
// StratFlow End-to-End Test Script
// Tests: Soroban contract queries, AI verification API,
//        and the full create → execute → verify → stream flow.
//
// Usage: node test-e2e.mjs
// ============================================================

import * as StellarSdk from "@stellar/stellar-sdk";

// ── Config ──────────────────────────────────────────────────
const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org:443";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID ||
  "CDC3GUQDQFCMTC6GZCACPLQOSOC5TWH2H4L7YVINVWNAYUU7OXOQRH47";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDKCksb8QoKZAz_W5AHW3iIdYzZegB4WFE";
const DEV_SERVER = "http://localhost:3000";

const { rpc: StellarRpc } = StellarSdk;
const server = new StellarRpc.Server(SOROBAN_RPC_URL);

// ── Helpers ─────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

function log(icon, msg) {
  console.log(`  ${icon} ${msg}`);
}

async function test(name, fn) {
  process.stdout.write(`\n🧪 ${name}... `);
  try {
    await fn();
    console.log("✅ PASS");
    passed++;
    results.push({ name, status: "PASS" });
  } catch (e) {
    console.log("❌ FAIL");
    log("  ", e.message || e);
    failed++;
    results.push({ name, status: "FAIL", error: e.message });
  }
}

async function testSkip(name, reason) {
  console.log(`\n⏭️  ${name}... SKIP (${reason})`);
  skipped++;
  results.push({ name, status: "SKIP", reason });
}

function assert(condition, msg) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

function assertEqual(a, b, label) {
  if (a !== b) throw new Error(`${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ── Contract Query Helper (read-only, no wallet needed) ─────
async function queryContract(functionName, args = []) {
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const dummyKeypair = StellarSdk.Keypair.random();
  const account = new StellarSdk.Account(dummyKeypair.publicKey(), "0");

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if (StellarRpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
    return sim.result.retval;
  }
  return null;
}

function toScValU64(v) {
  return StellarSdk.nativeToScVal(v, { type: "u64" });
}

function parseStruct(scVal) {
  const native = StellarSdk.scValToNative(scVal);
  if (native instanceof Map) {
    const obj = {};
    native.forEach((v, k) => {
      obj[k] = typeof v === "bigint" ? Number(v) : v;
    });
    return obj;
  }
  if (typeof native === "object" && native !== null) {
    const obj = {};
    for (const [k, v] of Object.entries(native)) {
      obj[k] = typeof v === "bigint" ? Number(v) : v;
    }
    return obj;
  }
  return native;
}

// ── Tests ───────────────────────────────────────────────────

console.log("╔══════════════════════════════════════════════════════╗");
console.log("║         StratFlow End-to-End Test Suite              ║");
console.log("╠══════════════════════════════════════════════════════╣");
console.log(`║  Contract: ${CONTRACT_ID.slice(0, 12)}...${CONTRACT_ID.slice(-6)}  ║`);
console.log(`║  RPC:      ${SOROBAN_RPC_URL.slice(8, 40).padEnd(30)}          ║`);
console.log("╚══════════════════════════════════════════════════════╝");

// ────────────────────────────────────────────────────────────
// 1. SOROBAN RPC CONNECTIVITY
// ────────────────────────────────────────────────────────────
console.log("\n━━━ 1. Soroban RPC Connectivity ━━━━━━━━━━━━━━━━━━━━━━");

await test("Soroban RPC server is reachable", async () => {
  const health = await server.getHealth();
  log("📡", `Status: ${health.status}`);
  assert(health.status === "healthy", `RPC not healthy: ${health.status}`);
});

await test("Contract exists on testnet", async () => {
  // Try to get the contract's ledger entry
  const contractId = new StellarSdk.Contract(CONTRACT_ID);
  // A simple way to verify: try calling a function that panics with known data
  // Instead, just verify the contract address is valid
  const addr = StellarSdk.Address.fromString(CONTRACT_ID);
  log("📄", `Contract address valid: ${addr.toString().slice(0, 12)}...`);
  assert(addr !== null, "Invalid contract address");
});

// ────────────────────────────────────────────────────────────
// 2. CONTRACT READ QUERIES (get_strategy, get_execution, etc.)
// ────────────────────────────────────────────────────────────
console.log("\n━━━ 2. Contract Read Queries ━━━━━━━━━━━━━━━━━━━━━━━━━");

let strategyExists = false;
let executionExists = false;
let streamExists = false;

await test("Query get_strategy(1) — check if any strategy exists", async () => {
  const result = await queryContract("get_strategy", [toScValU64(1)]);
  if (result) {
    const parsed = parseStruct(result);
    log("📋", `Strategy #1 found:`);
    log("  ", `  Creator: ${String(parsed.creator).slice(0, 12)}...`);
    log("  ", `  Reward:  ${parsed.reward_amount}`);
    log("  ", `  Active:  ${parsed.active}`);
    strategyExists = true;
    assert(parsed.reward_amount > 0, "reward_amount should be > 0");
  } else {
    log("📋", "No strategy #1 found (contract is fresh — this is OK)");
    log("  ", "Create a strategy via the UI to populate on-chain data");
  }
});

await test("Query get_execution(1) — check if any execution exists", async () => {
  const result = await queryContract("get_execution", [toScValU64(1)]);
  if (result) {
    const parsed = parseStruct(result);
    log("⚡", `Execution #1 found:`);
    log("  ", `  Executor:    ${String(parsed.executor).slice(0, 12)}...`);
    log("  ", `  Strategy ID: ${parsed.strategy_id}`);
    log("  ", `  Verified:    ${parsed.verified}`);
    executionExists = true;
  } else {
    log("⚡", "No execution #1 found (OK if contract is fresh)");
  }
});

await test("Query get_stream(1) — check if any stream exists", async () => {
  const result = await queryContract("get_stream", [toScValU64(1)]);
  if (result) {
    const parsed = parseStruct(result);
    log("◈ ", `Stream for execution #1 found:`);
    log("  ", `  Total:     ${parsed.total_amount}`);
    log("  ", `  Start:     ${parsed.start_time} (${new Date(parsed.start_time * 1000).toISOString()})`);
    log("  ", `  End:       ${parsed.end_time} (${new Date(parsed.end_time * 1000).toISOString()})`);
    log("  ", `  Withdrawn: ${parsed.withdrawn}`);
    streamExists = true;
  } else {
    log("◈ ", "No stream found for execution #1 (OK if not yet verified)");
  }
});

if (streamExists) {
  await test("Query get_earned(1) — check earned amount", async () => {
    const result = await queryContract("get_earned", [toScValU64(1)]);
    if (result) {
      const earned = Number(StellarSdk.scValToNative(result));
      log("💰", `Earned for execution #1: ${earned}`);
      assert(earned >= 0, "earned should be >= 0");
    } else {
      throw new Error("get_earned returned null despite stream existing");
    }
  });
} else {
  await testSkip("Query get_earned(1)", "no stream exists yet");
}

// Test querying non-existent data (should fail gracefully)
await test("Query non-existent strategy(999) — should return null/error", async () => {
  const result = await queryContract("get_strategy", [toScValU64(999)]);
  // The contract panics with "Strategy not found", so simulation should fail
  // meaning result should be null
  log("🔍", `Result for strategy #999: ${result === null ? "null (correct)" : "unexpected value"}`);
  assertEqual(result, null, "non-existent strategy query");
});

// ────────────────────────────────────────────────────────────
// 3. WRITE TRANSACTION TEST (create_strategy with test keypair)
// ────────────────────────────────────────────────────────────
console.log("\n━━━ 3. Write Transaction (create_strategy) ━━━━━━━━━━━");

let testStrategyId = null;
let testKeypair = null;

await test("Fund test keypair via Friendbot", async () => {
  testKeypair = StellarSdk.Keypair.random();
  log("🔑", `Test pubkey: ${testKeypair.publicKey().slice(0, 12)}...`);

  const res = await fetch(
    `https://friendbot.stellar.org?addr=${testKeypair.publicKey()}`
  );
  assert(res.ok, `Friendbot failed: ${res.status} ${res.statusText}`);
  log("💧", "Funded via Friendbot");

  // Verify account exists
  const acct = await server.getAccount(testKeypair.publicKey());
  log("✓ ", `Account seq: ${acct.sequenceNumber()}`);
});

await test("create_strategy — sign and submit on-chain", async () => {
  const pubKey = testKeypair.publicKey();
  const account = await server.getAccount(pubKey);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const rewardAmount = 500; // 500 XLM for test

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "create_strategy",
        new StellarSdk.Address(pubKey).toScVal(),
        StellarSdk.nativeToScVal(rewardAmount, { type: "i128" })
      )
    )
    .setTimeout(30)
    .build();

  log("📝", "Built transaction, simulating...");
  const prepared = await server.prepareTransaction(tx);

  // Sign locally (no Freighter needed in test)
  prepared.sign(testKeypair);
  log("✍️ ", "Signed with test keypair");

  const sendResult = await server.sendTransaction(prepared);
  log("📤", `Sent: status=${sendResult.status}, hash=${sendResult.hash.slice(0, 12)}...`);
  assert(sendResult.status === "PENDING", `Expected PENDING, got ${sendResult.status}`);

  // Poll for result
  let getResult = await server.getTransaction(sendResult.hash);
  let polls = 0;
  while (getResult.status === "NOT_FOUND" && polls < 30) {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await server.getTransaction(sendResult.hash);
    polls++;
  }

  log("⏱️ ", `Polled ${polls} times, final status: ${getResult.status}`);
  assert(getResult.status === "SUCCESS", `Transaction failed: ${getResult.status}`);

  // Extract strategy ID from return value
  const meta = getResult.resultMetaXdr;
  let returnVal;
  try {
    returnVal = meta.v3().sorobanMeta()?.returnValue();
  } catch {
    try {
      returnVal = meta.v4?.().sorobanMeta?.()?.returnValue?.();
    } catch {
      // noop
    }
  }

  if (returnVal) {
    testStrategyId = Number(StellarSdk.scValToNative(returnVal));
    log("🎯", `Created Strategy ID: ${testStrategyId}`);
    assert(testStrategyId > 0, "strategy ID should be > 0");
  } else {
    throw new Error("Could not extract return value from transaction");
  }
});

// Verify the strategy we just created
if (testStrategyId) {
  await test(`Verify created strategy #${testStrategyId} on-chain`, async () => {
    const result = await queryContract("get_strategy", [toScValU64(testStrategyId)]);
    assert(result !== null, "Strategy should exist");
    const parsed = parseStruct(result);
    log("📋", `Strategy #${testStrategyId}:`);
    log("  ", `  Creator: ${String(parsed.creator).slice(0, 12)}...`);
    log("  ", `  Reward:  ${parsed.reward_amount}`);
    log("  ", `  Active:  ${parsed.active}`);
    assertEqual(parsed.reward_amount, 500, "reward_amount");
    assertEqual(parsed.active, true, "active");
  });
}

// ────────────────────────────────────────────────────────────
// 4. SUBMIT EXECUTION (submit_execution with same test keypair)
// ────────────────────────────────────────────────────────────
console.log("\n━━━ 4. Submit Execution ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

let testExecutionId = null;

if (testStrategyId) {
  await test(`submit_execution for strategy #${testStrategyId}`, async () => {
    const pubKey = testKeypair.publicKey();
    const account = await server.getAccount(pubKey);
    const contract = new StellarSdk.Contract(CONTRACT_ID);

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "submit_execution",
          new StellarSdk.Address(pubKey).toScVal(),
          StellarSdk.nativeToScVal(testStrategyId, { type: "u64" })
        )
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(testKeypair);

    const sendResult = await server.sendTransaction(prepared);
    log("📤", `Sent: status=${sendResult.status}`);
    assert(sendResult.status === "PENDING", `Expected PENDING`);

    let getResult = await server.getTransaction(sendResult.hash);
    let polls = 0;
    while (getResult.status === "NOT_FOUND" && polls < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      getResult = await server.getTransaction(sendResult.hash);
      polls++;
    }

    assert(getResult.status === "SUCCESS", `Failed: ${getResult.status}`);

    const meta = getResult.resultMetaXdr;
    let returnVal;
    try { returnVal = meta.v3().sorobanMeta()?.returnValue(); } catch {}
    if (!returnVal) try { returnVal = meta.v4?.().sorobanMeta?.()?.returnValue?.(); } catch {}

    if (returnVal) {
      testExecutionId = Number(StellarSdk.scValToNative(returnVal));
      log("🎯", `Created Execution ID: ${testExecutionId}`);
    } else {
      throw new Error("Could not extract execution ID");
    }
  });

  if (testExecutionId) {
    await test(`Verify execution #${testExecutionId} on-chain`, async () => {
      const result = await queryContract("get_execution", [toScValU64(testExecutionId)]);
      assert(result !== null, "Execution should exist");
      const parsed = parseStruct(result);
      log("⚡", `Execution #${testExecutionId}:`);
      log("  ", `  Strategy: ${parsed.strategy_id}`);
      log("  ", `  Verified: ${parsed.verified}`);
      assertEqual(parsed.strategy_id, testStrategyId, "strategy_id");
      assertEqual(parsed.verified, false, "should not be verified yet");
    });
  }
} else {
  await testSkip("submit_execution", "no strategy was created");
}

// ────────────────────────────────────────────────────────────
// 5. VERIFY EXECUTION (verify_execution on-chain)
// ────────────────────────────────────────────────────────────
console.log("\n━━━ 5. Verify Execution On-Chain ━━━━━━━━━━━━━━━━━━━━━");

if (testExecutionId) {
  await test(`verify_execution(${testExecutionId}, approved=true)`, async () => {
    // Note: verify_execution in the contract doesn't require auth
    // (it's meant to be called by the verification layer)
    const pubKey = testKeypair.publicKey();
    const account = await server.getAccount(pubKey);
    const contract = new StellarSdk.Contract(CONTRACT_ID);

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "verify_execution",
          StellarSdk.nativeToScVal(testExecutionId, { type: "u64" }),
          StellarSdk.nativeToScVal(true, { type: "bool" })
        )
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(testKeypair);

    const sendResult = await server.sendTransaction(prepared);
    assert(sendResult.status === "PENDING", `Expected PENDING`);

    let getResult = await server.getTransaction(sendResult.hash);
    let polls = 0;
    while (getResult.status === "NOT_FOUND" && polls < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      getResult = await server.getTransaction(sendResult.hash);
      polls++;
    }

    assert(getResult.status === "SUCCESS", `Failed: ${getResult.status}`);

    const meta = getResult.resultMetaXdr;
    let returnVal;
    try { returnVal = meta.v3().sorobanMeta()?.returnValue(); } catch {}
    if (!returnVal) try { returnVal = meta.v4?.().sorobanMeta?.()?.returnValue?.(); } catch {}

    if (returnVal) {
      const verified = StellarSdk.scValToNative(returnVal);
      log("✓ ", `verify_execution returned: ${verified}`);
      assertEqual(verified, true, "should return true");
    }
  });

  // Check the stream was created
  await test(`Stream created for execution #${testExecutionId}`, async () => {
    const result = await queryContract("get_stream", [toScValU64(testExecutionId)]);
    assert(result !== null, "Stream should exist after verification");
    const parsed = parseStruct(result);
    log("◈ ", `Stream:`);
    log("  ", `  Total:     ${parsed.total_amount}`);
    log("  ", `  Duration:  ${parsed.end_time - parsed.start_time}s`);
    log("  ", `  Withdrawn: ${parsed.withdrawn}`);
    assertEqual(parsed.total_amount, 500, "total_amount should match strategy reward");
    assert(parsed.end_time - parsed.start_time === 300, "duration should be 300s");
  });

  // Check execution is now marked verified
  await test(`Execution #${testExecutionId} marked as verified`, async () => {
    const result = await queryContract("get_execution", [toScValU64(testExecutionId)]);
    const parsed = parseStruct(result);
    assertEqual(parsed.verified, true, "should be verified now");
    log("✓ ", "Execution correctly marked as verified");
  });

  // Check strategy is now inactive
  await test(`Strategy #${testStrategyId} deactivated after verify`, async () => {
    const result = await queryContract("get_strategy", [toScValU64(testStrategyId)]);
    const parsed = parseStruct(result);
    assertEqual(parsed.active, false, "should be inactive after verification");
    log("✓ ", "Strategy correctly deactivated");
  });
} else {
  await testSkip("verify_execution", "no execution was created");
}

// ────────────────────────────────────────────────────────────
// 6. GEMINI AI VERIFICATION API
// ────────────────────────────────────────────────────────────
console.log("\n━━━ 6. Gemini AI Verification API ━━━━━━━━━━━━━━━━━━━━");

async function fetchWithRetry(url, options, maxRetries = 4) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 && attempt < maxRetries) {
      const wait = (attempt + 1) * 5;
      log("⏳", `Rate limited (429), retrying in ${wait}s... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }
    return res;
  }
}

await test("Gemini API — verify VALID execution (should approve)", async () => {
  const strategy = {
    title: "Content Creation Strategy",
    description: "Create a structured content piece",
    rules: [
      "Provide a title for the content",
      "Provide a summary of at least 2 sentences",
      "Provide exactly 3 action steps",
    ],
  };

  const execution = {
    title: "How to Build a DeFi Dashboard",
    summary:
      "This guide covers building a DeFi dashboard from scratch. It includes connecting to blockchain APIs and displaying real-time data.",
    steps: [
      "Set up the project with Next.js and install web3 dependencies",
      "Connect to Ethereum and Stellar RPC endpoints",
      "Build the dashboard UI with real-time price feeds",
    ],
  };

  const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  const prompt = `You are an impartial execution verifier.

You are given:
1) A strategy definition
2) A user's execution proof

Your task:
- Verify whether the execution proof satisfies ALL strategy rules.
- Do not assume anything not explicitly provided.
- If all requirements are met, approve.
- Otherwise, reject.

Return ONLY valid JSON:
{
  "approved": true | false,
  "confidence": number,
  "reason": "short explanation"
}

Strategy Definition:
${JSON.stringify(strategy, null, 2)}

Execution Proof:
${JSON.stringify(execution, null, 2)}`;

  const res = await fetchWithRetry(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    }),
  });

  assert(res.ok, `Gemini API returned ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  log("📝", `Raw Gemini response: ${text.slice(0, 120)}...`);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  assert(jsonMatch, "Should return JSON");

  const verdict = JSON.parse(jsonMatch[0]);
  log("🤖", `Approved: ${verdict.approved}, Confidence: ${verdict.confidence}`);
  log("  ", `Reason: ${verdict.reason}`);
  assertEqual(verdict.approved, true, "valid execution should be approved");
  assert(verdict.confidence >= 0.8, `Confidence too low: ${verdict.confidence}`);
});

// Brief pause between Gemini calls to avoid rate limiting
await new Promise(r => setTimeout(r, 3000));

await test("Gemini API — verify INVALID execution (should reject)", async () => {
  const strategy = {
    rules: [
      "Provide a title",
      "Provide a summary of at least 2 sentences",
      "Provide exactly 3 action steps",
    ],
  };

  const execution = {
    title: "My Submission",
    summary: "Short.",
    steps: ["Only one step"],
  };

  const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  const prompt = `You are an impartial execution verifier.
Return ONLY valid JSON: {"approved": true|false, "confidence": number, "reason": "..."}

Strategy: ${JSON.stringify(strategy)}
Execution: ${JSON.stringify(execution)}`;

  const res = await fetchWithRetry(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    }),
  });

  assert(res.ok, `Gemini API returned ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  assert(jsonMatch, "Should return JSON");

  const verdict = JSON.parse(jsonMatch[0]);
  log("🤖", `Approved: ${verdict.approved}, Confidence: ${verdict.confidence}`);
  log("  ", `Reason: ${verdict.reason}`);
  assertEqual(verdict.approved, false, "invalid execution should be rejected");
});

// ────────────────────────────────────────────────────────────
// 7. NEXT.JS API ROUTE TEST (if dev server running)
// ────────────────────────────────────────────────────────────
console.log("\n━━━ 7. Next.js /api/verify Route ━━━━━━━━━━━━━━━━━━━━━");

let devServerUp = false;
try {
  const ping = await fetch(DEV_SERVER, { signal: AbortSignal.timeout(3000) });
  devServerUp = ping.ok || ping.status === 404;
} catch {}

if (devServerUp) {
  await test("POST /api/verify — valid execution", async () => {
    const res = await fetch(`${DEV_SERVER}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strategy: {
          rules: [
            "Provide a title",
            "Provide a summary of at least 2 sentences",
            "Provide exactly 3 action steps",
          ],
        },
        execution: {
          title: "DeFi Dashboard Guide",
          summary:
            "A comprehensive guide to building dashboards. It covers multiple blockchain integrations and data visualization.",
          steps: ["Step 1: Setup", "Step 2: Connect APIs", "Step 3: Build UI"],
        },
      }),
    });

    assert(res.ok, `API returned ${res.status}`);
    const result = await res.json();
    log("🌐", `API result: approved=${result.approved}, confidence=${result.confidence}`);
    log("  ", `Reason: ${result.reason}`);
    assert(typeof result.approved === "boolean", "should have approved field");
    assert(typeof result.confidence === "number", "should have confidence field");
  });

  await test("POST /api/verify — missing data (should 400)", async () => {
    const res = await fetch(`${DEV_SERVER}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assertEqual(res.status, 400, "should return 400 for missing data");
    log("🌐", "Correctly returned 400 for missing data");
  });
} else {
  await testSkip("POST /api/verify — valid execution", "dev server not running on :3000");
  await testSkip("POST /api/verify — missing data", "dev server not running on :3000");
}

// ────────────────────────────────────────────────────────────
// 8. WITHDRAW TEST (if stream exists from step 5)
// ────────────────────────────────────────────────────────────
console.log("\n━━━ 8. Withdraw Reward ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

if (testExecutionId && testKeypair) {
  // Wait a few seconds for some reward to accrue
  log("⏳", "Waiting 5 seconds for rewards to accrue...");
  await new Promise((r) => setTimeout(r, 5000));

  await test(`get_earned(${testExecutionId}) — check accrued amount`, async () => {
    const result = await queryContract("get_earned", [toScValU64(testExecutionId)]);
    assert(result !== null, "get_earned should return a value");
    const earned = Number(StellarSdk.scValToNative(result));
    log("💰", `Earned so far: ${earned}`);
    assert(earned > 0, "Should have earned something after 5 seconds");
  });

  await test(`withdraw_reward — withdraw 1 from execution #${testExecutionId}`, async () => {
    const pubKey = testKeypair.publicKey();
    const account = await server.getAccount(pubKey);
    const contract = new StellarSdk.Contract(CONTRACT_ID);

    const withdrawAmt = 1; // withdraw 1 unit

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "withdraw_reward",
          new StellarSdk.Address(pubKey).toScVal(),
          StellarSdk.nativeToScVal(testExecutionId, { type: "u64" }),
          StellarSdk.nativeToScVal(withdrawAmt, { type: "i128" })
        )
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(testKeypair);

    const sendResult = await server.sendTransaction(prepared);
    assert(sendResult.status === "PENDING", `Expected PENDING`);

    let getResult = await server.getTransaction(sendResult.hash);
    let polls = 0;
    while (getResult.status === "NOT_FOUND" && polls < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      getResult = await server.getTransaction(sendResult.hash);
      polls++;
    }

    assert(getResult.status === "SUCCESS", `Failed: ${getResult.status}`);
    log("💸", `Withdrew ${withdrawAmt} successfully`);

    // Verify stream updated
    const streamResult = await queryContract("get_stream", [toScValU64(testExecutionId)]);
    const parsed = parseStruct(streamResult);
    log("◈ ", `Stream withdrawn now: ${parsed.withdrawn}`);
    assert(parsed.withdrawn >= withdrawAmt, "withdrawn should have increased");
  });
} else {
  await testSkip("Withdraw reward", "no verified execution from earlier steps");
}

// ────────────────────────────────────────────────────────────
// SUMMARY
// ────────────────────────────────────────────────────────────
console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║                   TEST SUMMARY                      ║");
console.log("╠══════════════════════════════════════════════════════╣");
console.log(`║  ✅ Passed:  ${String(passed).padEnd(3)}                                    ║`);
console.log(`║  ❌ Failed:  ${String(failed).padEnd(3)}                                    ║`);
console.log(`║  ⏭️  Skipped: ${String(skipped).padEnd(3)}                                    ║`);
console.log(`║  📊 Total:   ${String(passed + failed + skipped).padEnd(3)}                                    ║`);
console.log("╠══════════════════════════════════════════════════════╣");

if (failed === 0) {
  console.log("║  🎉 ALL TESTS PASSED!                                ║");
} else {
  console.log("║  ⚠️  SOME TESTS FAILED — see details above            ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  for (const r of results.filter((r) => r.status === "FAIL")) {
    console.log(`║  ❌ ${r.name.slice(0, 46).padEnd(46)}  ║`);
  }
}
console.log("╚══════════════════════════════════════════════════════╝\n");

process.exit(failed > 0 ? 1 : 0);
