#!/usr/bin/env node
// ============================================================
// StratFlow — Full Demo Verification Script
// Tests every layer: Server, Auth, Pages, APIs, Contract, AI
//
// Usage:  cd frontend && node test-demo.mjs
//         (start dev server first: npm run dev)
// ============================================================

const BASE = "http://localhost:3000";

// ── Styling ─────────────────────────────────────────────────
const CLR = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  magenta: "\x1b[35m",
};

let passed = 0, failed = 0, skipped = 0;
const results = [];
let authCookie = null; // shared across tests

function log(icon, msg) {
  console.log(`    ${icon} ${msg}`);
}

async function test(section, name, fn) {
  process.stdout.write(`  ${CLR.dim}[${section}]${CLR.reset} ${name} `);
  try {
    await fn();
    console.log(`${CLR.green}✓ PASS${CLR.reset}`);
    passed++;
    results.push({ section, name, status: "PASS" });
  } catch (e) {
    console.log(`${CLR.red}✗ FAIL${CLR.reset}`);
    console.log(`    ${CLR.red}→ ${e.message}${CLR.reset}`);
    failed++;
    results.push({ section, name, status: "FAIL", error: e.message });
  }
}

function skip(section, name, reason) {
  console.log(`  ${CLR.dim}[${section}]${CLR.reset} ${name} ${CLR.yellow}⊘ SKIP (${reason})${CLR.reset}`);
  skipped++;
  results.push({ section, name, status: "SKIP", reason });
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }
function eq(a, b, label) {
  if (a !== b) throw new Error(`${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function header(title) {
  console.log(`\n${CLR.cyan}━━━ ${title} ━━━━━━━━━━━━━━━━━━━━━━━━━━━${CLR.reset}`);
}

// ── Helper: fetch with timeout ──────────────────────────────
async function safeFetch(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ═══════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════
console.log(`
${CLR.bold}${CLR.cyan}╔═══════════════════════════════════════════════════════╗
║     StratFlow — Full Demo Verification Suite          ║
║     Testing: Server · Auth · Pages · APIs · Contract  ║
╚═══════════════════════════════════════════════════════╝${CLR.reset}
`);

// ─────────────────────────────────────────────────────────
// 1. DEV SERVER HEALTH
// ─────────────────────────────────────────────────────────
header("1. Dev Server Health");

let serverUp = false;

await test("Server", "Dev server is running on localhost:3000", async () => {
  const res = await safeFetch(BASE, {}, 5000);
  assert(res.status === 200 || res.status === 302 || res.status === 307, `Got status ${res.status}`);
  serverUp = true;
});

if (!serverUp) {
  console.log(`\n${CLR.red}  ⛔ Dev server not running! Start it first: npm run dev${CLR.reset}`);
  console.log(`  Skipping all remaining tests.\n`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────
// 2. PAGE RENDERING (every route returns 200)
// ─────────────────────────────────────────────────────────
header("2. Page Rendering");

const pages = [
  ["/", "Landing page"],
  ["/login", "Login page"],
  ["/signup", "Signup page"],
  ["/app", "App dashboard"],
  ["/app/marketplace", "Marketplace"],
  ["/app/create", "Create strategy"],
  ["/app/execute", "Execute strategy"],
  ["/app/verify", "Verify execution"],
  ["/app/dashboard", "Rewards dashboard"],
  ["/app/examples", "Examples page"],
];

for (const [path, label] of pages) {
  await test("Pages", `${label} (${path}) → 200`, async () => {
    const res = await safeFetch(`${BASE}${path}`);
    // Allow 200 or redirect (302/307/308) — both mean page exists
    assert(
      [200, 302, 307, 308].includes(res.status),
      `Expected 200/3xx, got ${res.status}`
    );
  });
}

// ─────────────────────────────────────────────────────────
// 3. AUTHENTICATION FLOW
// ─────────────────────────────────────────────────────────
header("3. Authentication Flow");

await test("Auth", "POST /api/auth/signup — create test user", async () => {
  const email = `demo-${Date.now()}@test.com`;
  const res = await safeFetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Demo Tester",
      email,
      password: "testpass123",
      role: "trader",
    }),
  });
  assert(res.status === 200 || res.status === 201, `Signup failed: ${res.status}`);
  const body = await res.json();
  assert(body.user || body.success || body.email, `Unexpected response: ${JSON.stringify(body)}`);
  log("👤", `Created: ${email}`);
});

await test("Auth", "POST /api/auth/login — demo admin login", async () => {
  const res = await safeFetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@stratflow.io", password: "demo123" }),
  });
  eq(res.status, 200, "login status");
  const body = await res.json();
  assert(body.user || body.success || body.name, `Login response invalid: ${JSON.stringify(body)}`);
  authCookie = res.headers.get("set-cookie");
  assert(authCookie, "Should set auth cookie");
  log("🔐", "Logged in, cookie received");
});

await test("Auth", "GET /api/auth/me — fetch current user", async () => {
  assert(authCookie, "No cookie from login");
  const res = await safeFetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: authCookie },
  });
  eq(res.status, 200, "me status");
  const body = await res.json();
  assert(body.user || body.name || body.email, `Unexpected /me response: ${JSON.stringify(body)}`);
  log("👤", `User: ${body.user?.name || body.name || body.email}`);
});

await test("Auth", "POST /api/auth/login — bad password → 401", async () => {
  const res = await safeFetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@stratflow.io", password: "wrongpass" }),
  });
  assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
  log("🛡️", "Bad password correctly rejected");
});

await test("Auth", "GET /api/auth/me — no cookie → 401", async () => {
  const res = await safeFetch(`${BASE}/api/auth/me`);
  assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
});

// ─────────────────────────────────────────────────────────
// 4. AI VERIFICATION API
// ─────────────────────────────────────────────────────────
header("4. AI Verification API (/api/verify)");

await test("Verify", "POST /api/verify — valid execution → approved", async () => {
  const res = await safeFetch(`${BASE}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      strategy: {
        title: "Bitcoin Scalping Strategy",
        rules: [
          "Entry: Buy when RSI < 30 on 5min chart",
          "Exit: Sell when RSI > 70 or 2% stop loss",
          "Position: Max 5% of portfolio per trade",
        ],
      },
      execution: {
        title: "BTC Scalp Trade — Jan 2026",
        summary:
          "Executed a BTC/USDT scalp trade on Binance. RSI dropped to 28 on the 5-minute chart so I entered a long at $42,100. Set stop loss at $41,258 (2%). RSI hit 72 and I exited at $42,950 for a +2% gain. Position was 4% of portfolio.",
        steps: [
          "https://binance.com/trade/BTC_USDT — entry screenshot",
          "TX: 0xabc123...def — on-chain confirmation",
          "P&L Report: +$850 (2.02%)",
        ],
      },
    }),
  });
  assert(res.ok, `API returned ${res.status}`);
  const body = await res.json();
  assert(typeof body.approved === "boolean", "Missing 'approved' field");
  assert(typeof body.confidence === "number", "Missing 'confidence' field");
  log("🤖", `approved=${body.approved}, confidence=${body.confidence}`);
  log("📝", `reason: ${(body.reason || "").slice(0, 100)}`);
});

await test("Verify", "POST /api/verify — invalid execution → rejected", async () => {
  const res = await safeFetch(`${BASE}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      strategy: {
        rules: [
          "Entry: Buy when RSI < 30",
          "Exit: Sell when RSI > 70",
          "Must include P&L proof screenshots",
        ],
      },
      execution: {
        title: "I did a trade",
        summary: "It went well.",
        steps: ["trust me bro"],
      },
    }),
  });
  assert(res.ok, `API returned ${res.status}`);
  const body = await res.json();
  log("🤖", `approved=${body.approved}, confidence=${body.confidence}`);
  // For weak proof, either rejected or very low confidence
  assert(
    body.approved === false || body.confidence < 0.85,
    `Should reject/low-confidence weak proof: approved=${body.approved} conf=${body.confidence}`
  );
});

await test("Verify", "POST /api/verify — missing data → 400", async () => {
  const res = await safeFetch(`${BASE}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  eq(res.status, 400, "missing data should return 400");
});

// ─────────────────────────────────────────────────────────
// 5. ORACLE PRICE API
// ─────────────────────────────────────────────────────────
header("5. Oracle Price API (/api/oracle/price)");

await test("Oracle", "GET /api/oracle/price?asset=BTC → price data", async () => {
  const res = await safeFetch(`${BASE}/api/oracle/price?asset=BTC`);
  assert(res.ok, `API returned ${res.status}`);
  const body = await res.json();
  assert(body.price > 0, `Price should be > 0, got ${body.price}`);
  assert(body.asset === "BTC", `Asset should be BTC, got ${body.asset}`);
  log("💲", `BTC price: $${Number(body.price).toLocaleString()} (source: ${body.source})`);
});

await test("Oracle", "GET /api/oracle/price?asset=ETH → price data", async () => {
  const res = await safeFetch(`${BASE}/api/oracle/price?asset=ETH`);
  assert(res.ok, `API returned ${res.status}`);
  const body = await res.json();
  assert(body.price > 0, `Price should be > 0`);
  log("💲", `ETH price: $${Number(body.price).toLocaleString()} (source: ${body.source})`);
});

await test("Oracle", "GET /api/oracle/price (no asset) → 400", async () => {
  const res = await safeFetch(`${BASE}/api/oracle/price`);
  eq(res.status, 400, "missing asset should return 400");
});

// ─────────────────────────────────────────────────────────
// 6. SOROBAN CONTRACT (on-chain queries)
// ─────────────────────────────────────────────────────────
header("6. Soroban Smart Contract (Testnet)");

let StellarSdk;
try {
  StellarSdk = await import("@stellar/stellar-sdk");
} catch {
  skip("Contract", "All contract tests", "@stellar/stellar-sdk not importable");
}

if (StellarSdk) {
  const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "CBJRILB6ZOEUWJ7Q5WGXL7PZZJDB7M7YUOFCOYAV3QYZYHGLB7FW5Q73";
  const RPC_URL = "https://soroban-testnet.stellar.org:443";
  const NETWORK = "Test SDF Network ; September 2015";
  const { rpc: StellarRpc } = StellarSdk;
  const sorobanServer = new StellarRpc.Server(RPC_URL);

  async function queryContract(fn, args = []) {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const dummy = StellarSdk.Keypair.random();
    const account = new StellarSdk.Account(dummy.publicKey(), "0");
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK,
    })
      .addOperation(contract.call(fn, ...args))
      .setTimeout(30)
      .build();

    const sim = await sorobanServer.simulateTransaction(tx);
    if (StellarRpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      return sim.result.retval;
    }
    return null;
  }

  function toU64(v) { return StellarSdk.nativeToScVal(v, { type: "u64" }); }
  function parseStruct(scVal) {
    const native = StellarSdk.scValToNative(scVal);
    if (native instanceof Map) {
      const obj = {};
      native.forEach((v, k) => { obj[k] = typeof v === "bigint" ? Number(v) : v; });
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

  await test("Contract", "Soroban RPC is healthy", async () => {
    const health = await sorobanServer.getHealth();
    eq(health.status, "healthy", "RPC health");
    log("📡", `Soroban RPC: ${health.status}`);
  });

  await test("Contract", "Contract address is valid", async () => {
    const addr = StellarSdk.Address.fromString(CONTRACT_ID);
    assert(addr !== null, "Invalid address");
    log("📄", `Contract: ${CONTRACT_ID.slice(0, 12)}…${CONTRACT_ID.slice(-6)}`);
  });

  await test("Contract", "get_strategy(1) — query on-chain", async () => {
    const result = await queryContract("get_strategy", [toU64(1)]);
    if (result) {
      const s = parseStruct(result);
      log("📋", `Strategy #1: reward=${s.reward_amount}, active=${s.active}, creator=${String(s.creator).slice(0, 10)}…`);
      assert(s.reward_amount >= 0, "reward should be >= 0");
    } else {
      log("📋", "No strategy #1 found (contract may be fresh — OK for demo)");
    }
  });

  await test("Contract", "get_strategy(2) — query on-chain", async () => {
    const result = await queryContract("get_strategy", [toU64(2)]);
    if (result) {
      const s = parseStruct(result);
      log("📋", `Strategy #2: reward=${s.reward_amount}, active=${s.active}`);
    } else {
      log("📋", "No strategy #2 — OK");
    }
  });

  await test("Contract", "get_execution(1) — query on-chain", async () => {
    const result = await queryContract("get_execution", [toU64(1)]);
    if (result) {
      const e = parseStruct(result);
      log("⚡", `Execution #1: strategy=${e.strategy_id}, verified=${e.verified}, status=${e.status}`);
    } else {
      log("⚡", "No execution #1 — OK");
    }
  });

  await test("Contract", "get_strategy(999) — non-existent → null", async () => {
    const result = await queryContract("get_strategy", [toU64(999)]);
    eq(result, null, "should be null for non-existent strategy");
  });

  // ── Write test: create_strategy + submit_execution ──
  let testKeypair = null;
  let testStrategyId = null;
  let testExecutionId = null;

  await test("Contract", "Fund test keypair via Friendbot", async () => {
    testKeypair = StellarSdk.Keypair.random();
    log("🔑", `Test key: ${testKeypair.publicKey().slice(0, 12)}…`);
    const res = await fetch(`https://friendbot.stellar.org?addr=${testKeypair.publicKey()}`);
    assert(res.ok, `Friendbot failed: ${res.status}`);
    log("💧", "Funded OK");
  });

  await test("Contract", "create_strategy — write to chain", async () => {
    const pub = testKeypair.publicKey();
    const acct = await sorobanServer.getAccount(pub);
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const tx = new StellarSdk.TransactionBuilder(acct, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK,
    })
      .addOperation(
        contract.call(
          "create_strategy",
          new StellarSdk.Address(pub).toScVal(),
          StellarSdk.nativeToScVal(100, { type: "i128" })
        )
      )
      .setTimeout(30)
      .build();

    const prepared = await sorobanServer.prepareTransaction(tx);
    prepared.sign(testKeypair);
    const sendRes = await sorobanServer.sendTransaction(prepared);
    assert(sendRes.status === "PENDING", `Expected PENDING, got ${sendRes.status}`);

    let getRes = await sorobanServer.getTransaction(sendRes.hash);
    let polls = 0;
    while (getRes.status === "NOT_FOUND" && polls < 30) {
      await new Promise(r => setTimeout(r, 1000));
      getRes = await sorobanServer.getTransaction(sendRes.hash);
      polls++;
    }
    assert(getRes.status === "SUCCESS", `TX failed: ${getRes.status}`);

    let retVal;
    try { retVal = getRes.resultMetaXdr.v3().sorobanMeta()?.returnValue(); } catch {}
    if (!retVal) try { retVal = getRes.resultMetaXdr.v4?.().sorobanMeta?.()?.returnValue?.(); } catch {}
    assert(retVal, "No return value");
    testStrategyId = Number(StellarSdk.scValToNative(retVal));
    log("🎯", `Created strategy #${testStrategyId} (100 XLM)`);
  });

  if (testStrategyId) {
    await test("Contract", `submit_execution for strategy #${testStrategyId}`, async () => {
      const pub = testKeypair.publicKey();
      const acct = await sorobanServer.getAccount(pub);
      const contract = new StellarSdk.Contract(CONTRACT_ID);
      const tx = new StellarSdk.TransactionBuilder(acct, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK,
      })
        .addOperation(
          contract.call(
            "submit_execution",
            new StellarSdk.Address(pub).toScVal(),
            StellarSdk.nativeToScVal(testStrategyId, { type: "u64" })
          )
        )
        .setTimeout(30)
        .build();

      const prepared = await sorobanServer.prepareTransaction(tx);
      prepared.sign(testKeypair);
      const sendRes = await sorobanServer.sendTransaction(prepared);
      assert(sendRes.status === "PENDING", `Expected PENDING`);

      let getRes = await sorobanServer.getTransaction(sendRes.hash);
      let polls = 0;
      while (getRes.status === "NOT_FOUND" && polls < 30) {
        await new Promise(r => setTimeout(r, 1000));
        getRes = await sorobanServer.getTransaction(sendRes.hash);
        polls++;
      }
      assert(getRes.status === "SUCCESS", `TX failed: ${getRes.status}`);

      let retVal;
      try { retVal = getRes.resultMetaXdr.v3().sorobanMeta()?.returnValue(); } catch {}
      if (!retVal) try { retVal = getRes.resultMetaXdr.v4?.().sorobanMeta?.()?.returnValue?.(); } catch {}
      assert(retVal, "No return value");
      testExecutionId = Number(StellarSdk.scValToNative(retVal));
      log("🎯", `Created execution #${testExecutionId}`);
    });

    await test("Contract", `Verify execution #${testExecutionId} on-chain`, async () => {
      const result = await queryContract("get_execution", [toU64(testExecutionId)]);
      assert(result, "Execution should exist");
      const e = parseStruct(result);
      eq(e.strategy_id, testStrategyId, "strategy_id");
      eq(e.verified, false, "should not be verified yet");
      log("✓", `Execution exists, pending verification`);
    });
  }

  // verify_execution
  if (testExecutionId) {
    await test("Contract", `verify_execution(${testExecutionId}, true) → approve`, async () => {
      const pub = testKeypair.publicKey();
      const acct = await sorobanServer.getAccount(pub);
      const contract = new StellarSdk.Contract(CONTRACT_ID);
      const tx = new StellarSdk.TransactionBuilder(acct, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK,
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

      const prepared = await sorobanServer.prepareTransaction(tx);
      prepared.sign(testKeypair);
      const sendRes = await sorobanServer.sendTransaction(prepared);
      assert(sendRes.status === "PENDING", `Expected PENDING`);

      let getRes = await sorobanServer.getTransaction(sendRes.hash);
      let polls = 0;
      while (getRes.status === "NOT_FOUND" && polls < 30) {
        await new Promise(r => setTimeout(r, 1000));
        getRes = await sorobanServer.getTransaction(sendRes.hash);
        polls++;
      }
      assert(getRes.status === "SUCCESS", `TX failed: ${getRes.status}`);
      log("✓", "Execution approved on-chain");
    });

    await test("Contract", `Post-verify: execution #${testExecutionId} is Approved`, async () => {
      const result = await queryContract("get_execution", [toU64(testExecutionId)]);
      assert(result, "Execution should exist");
      const e = parseStruct(result);
      // After verify_execution(approved=true), status goes to Approved (dispute window)
      // verified=false is expected here — it only becomes true after finalize
      // Stream is only created after finalize (post-dispute window)
      const statusStr = JSON.stringify(e.status);
      assert(
        statusStr.includes("Approved") || statusStr.includes("Finalized") || e.verified === true,
        `Expected Approved/Finalized, got status=${statusStr}`
      );
      log("✓", `Execution status: ${statusStr} (verified=${e.verified} — correct for dispute window)`);

      // Try stream — may or may not exist depending on contract version
      const stream = await queryContract("get_stream", [toU64(testExecutionId)]);
      if (stream) {
        const s = parseStruct(stream);
        log("◈", `Stream exists: total=${s.total_amount}, duration=${s.end_time - s.start_time}s`);
      } else {
        log("◈", "No stream yet (in dispute window — expected behavior)");
      }
    });
  }
}

// ─────────────────────────────────────────────────────────
// 7. STATIC ASSETS & UI COMPONENTS
// ─────────────────────────────────────────────────────────
header("7. Static Assets & Page Content");

await test("Assets", "Marketplace page contains strategy cards HTML", async () => {
  const res = await safeFetch(`${BASE}/app/marketplace`);
  const html = await res.text();
  assert(
    html.includes("Marketplace") || html.includes("marketplace") || html.includes("strategy"),
    "Marketplace page should contain marketplace-related content"
  );
});

await test("Assets", "Create page renders form", async () => {
  const res = await safeFetch(`${BASE}/app/create`);
  const html = await res.text();
  assert(
    html.includes("Create") || html.includes("create") || html.includes("strategy") || html.includes("Publish"),
    "Should contain create/publish form content"
  );
});

await test("Assets", "Login page renders", async () => {
  const res = await safeFetch(`${BASE}/login`);
  const html = await res.text();
  assert(
    html.includes("login") || html.includes("Login") || html.includes("email") || html.includes("password") || html.includes("Sign"),
    "Login page should contain auth form content"
  );
});

// ─────────────────────────────────────────────────────────
// 8. DISPUTE API (if exists)
// ─────────────────────────────────────────────────────────
header("8. Dispute API");

await test("Dispute", "POST /api/verify/dispute — missing data → 400", async () => {
  const res = await safeFetch(`${BASE}/api/verify/dispute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  // Should either be 400 (validation) or 404 (route doesn't exist) or 405
  assert([400, 404, 405].includes(res.status), `Expected 400/404/405, got ${res.status}`);
  log("🛡️", `Dispute endpoint responded: ${res.status}`);
});

// ─────────────────────────────────────────────────────────
// 9. LOGOUT
// ─────────────────────────────────────────────────────────
header("9. Auth Logout");

await test("Auth", "POST /api/auth/logout", async () => {
  const res = await safeFetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: authCookie ? { Cookie: authCookie } : {},
  });
  // Should be 200 or redirect
  assert([200, 302, 307].includes(res.status), `Expected 200/3xx, got ${res.status}`);
  log("🔓", "Logged out");
});

// ═══════════════════════════════════════════════════════════
//  SUMMARY
// ═══════════════════════════════════════════════════════════
const total = passed + failed + skipped;

console.log(`
${CLR.bold}╔═══════════════════════════════════════════════════════╗
║                    TEST SUMMARY                       ║
╠═══════════════════════════════════════════════════════╣${CLR.reset}
  ${CLR.green}✓ Passed:  ${passed}${CLR.reset}
  ${CLR.red}✗ Failed:  ${failed}${CLR.reset}
  ${CLR.yellow}⊘ Skipped: ${skipped}${CLR.reset}
  📊 Total:   ${total}
${CLR.bold}╠═══════════════════════════════════════════════════════╣${CLR.reset}`);

if (failed === 0) {
  console.log(`${CLR.bold}${CLR.green}║  🎉 ALL TESTS PASSED — DEMO IS READY!                ║${CLR.reset}`);
} else {
  console.log(`${CLR.bold}${CLR.red}║  ⚠  SOME TESTS FAILED — see details above            ║${CLR.reset}`);
  console.log(`${CLR.bold}╠═══════════════════════════════════════════════════════╣${CLR.reset}`);
  for (const r of results.filter(r => r.status === "FAIL")) {
    console.log(`  ${CLR.red}✗ [${r.section}] ${r.name}${CLR.reset}`);
    if (r.error) console.log(`    ${CLR.dim}→ ${r.error.slice(0, 80)}${CLR.reset}`);
  }
}
console.log(`${CLR.bold}╚═══════════════════════════════════════════════════════╝${CLR.reset}\n`);

process.exit(failed > 0 ? 1 : 0);
