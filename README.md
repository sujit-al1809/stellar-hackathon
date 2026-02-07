<p align="center">
  <h1 align="center">StratFlow</h1>
  <p align="center">
    <strong>Decentralized Strategy Execution & Settlement Protocol</strong><br/>
    Built on <a href="https://stellar.org">Stellar</a> + <a href="https://soroban.stellar.org">Soroban</a>
  </p>
  <p align="center">
    <a href="#quick-start"><img src="https://img.shields.io/badge/Quick_Start-blue?style=for-the-badge" /></a>
    <a href="#demo"><img src="https://img.shields.io/badge/Live_Demo-green?style=for-the-badge" /></a>
    <a href="#smart-contract-api"><img src="https://img.shields.io/badge/Soroban_Contract-orange?style=for-the-badge" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" /></a>
  </p>
</p>

---

## What is StratFlow?

StratFlow is a **trustless protocol** where trading experts publish strategies, traders execute them, and AI verifies the results — all settled on-chain with streamed rewards.

> **Publish → Execute → Verify → Stream Rewards**

No middlemen. No trust assumptions. Smart contracts enforce every step.

```
 Expert                        AI Verifier                  Trader
 ──────                        ───────────                  ──────
 Publishes strategy    ──>     Gemini verifies proof   <──  Executes strategy
 Locks reward escrow           Returns YES / NO             Stakes skin-in-the-game
       |                             |                              |
       └─────────────────────────────┴──────────────────────────────┘
                                     |
                            ┌────────▼────────┐
                            │    Reward       │
                            │    Stream       │
                            │   (on-chain)    │
                            └─────────────────┘
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Strategy Marketplace** | Experts publish structured trading strategies with locked rewards |
| **Stake-to-Unlock** | Traders stake XLM to access strategy details — skin in the game |
| **AI Verification** | Gemini AI evaluates execution proof against strategy rules |
| **On-Chain Escrow** | Rewards locked in Soroban smart contracts — no admin keys |
| **Reward Streaming** | Earnings stream linearly over time, not paid as lump sums |
| **Dispute System** | Experts can challenge verified executions within a time window |
| **Oracle Price Feeds** | Real-time prices from Pyth Network, CoinGecko & Binance |
| **Proof System** | Image uploads, blockchain TX verification, URL validation |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐   │
│  │Marketplace│ │  Execute   │ │  Verify  │ │  Dashboard  │   │
│  └─────┬────┘ └─────┬──────┘ └────┬─────┘ └──────┬──────┘   │
└────────┼────────────┼─────────────┼──────────────┼───────────┘
         │            │             │              │
    ┌────▼────────────▼─────────────▼──────────────▼────┐
    │              Soroban Smart Contract                │
    │  create_strategy | submit_execution | verify       │
    │  raise_dispute   | finalize         | withdraw     │
    └───────────────────────────┬────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
        ┌─────▼─────┐   ┌──────▼──────┐   ┌─────▼─────┐
        │  Gemini AI │   │ Pyth Oracle │   │ Freighter │
        │  Verifier  │   │ Price Feeds │   │  Wallet   │
        └───────────┘   └─────────────┘   └───────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Smart Contracts** | Soroban (Rust), deployed on Stellar Testnet |
| **Wallet** | Freighter Browser Extension |
| **AI Engine** | Google Gemini (gemini-2.0-flash) |
| **Oracles** | Pyth Network, CoinGecko, Binance |
| **Auth** | JWT sessions (jose) + bcrypt |
| **Database** | SQLite (better-sqlite3) |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) v1.84+
- [Stellar CLI](https://github.com/stellar/stellar-cli) v25+
- [Freighter Wallet](https://www.freighter.app/) browser extension

### 1. Clone & Install

```bash
git clone https://github.com/your-username/stratflow.git
cd stratflow/frontend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_CONTRACT_ID=your_deployed_contract_id
```

### 3. Deploy Smart Contract

```bash
cd contracts

# Add Soroban build target
rustup target add wasm32v1-none

# Build
cargo build --target wasm32v1-none --release

# Deploy to Stellar Testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stratflow.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet
```

Copy the contract ID into your `.env.local`.

### 4. Run

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** → Connect Freighter (Testnet) → Start trading!

---

## Demo

### Flow

```
1. Expert creates a strategy            ->  locks 1000 XLM reward
2. Trader stakes & executes             ->  submits proof of execution
3. Gemini AI verifies the proof         ->  approves or rejects on-chain
4. Dispute window opens (24h)           ->  expert can challenge
5. Finalized                            ->  reward stream begins
6. Trader withdraws earned rewards      ->  streamed over time
```

### Run Tests

```bash
cd frontend
node test-demo.mjs
```

> 39 automated tests covering: server health, page rendering, auth flow, AI verification, oracle prices, and full Soroban contract lifecycle.

---

## Project Structure

```
stratflow/
├── contracts/                       # Soroban smart contracts (Rust)
│   └── stratflow/src/lib.rs         # Core contract — 914 lines
│
├── frontend/                        # Next.js application
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── login/ & signup/         # Authentication
│   │   └── app/
│   │       ├── marketplace/         # Browse & stake on strategies
│   │       ├── create/              # Publish new strategies
│   │       ├── execute/             # Submit execution proof
│   │       ├── verify/              # AI verification results
│   │       ├── dashboard/           # Reward streaming dashboard
│   │       └── dispute/             # Challenge executions
│   ├── api/
│   │   ├── auth/                    # Signup, login, logout, session
│   │   ├── oracle/price/            # Multi-source price aggregation
│   │   └── verify/                  # Gemini AI verification endpoint
│   ├── components/                  # React components
│   ├── lib/                         # Stellar SDK, contracts, oracles
│   └── test-demo.mjs               # 39-test verification suite
│
└── scripts/                         # Utilities & test data
```

---

## Smart Contract API

The Soroban contract manages the full lifecycle: strategies → executions → disputes → streaming.

### Write Functions

| Function | Description |
|----------|-------------|
| `create_strategy(creator, reward_amount)` | Publish strategy & lock XLM reward in escrow → returns `strategy_id` |
| `submit_execution(executor, strategy_id)` | Submit execution attempt → returns `execution_id` |
| `verify_execution(execution_id, approved)` | Record AI verdict, start dispute window if approved |
| `set_confidence(execution_id, confidence)` | Store AI confidence score (0-100) |
| `raise_dispute(challenger, execution_id, reason_code)` | Expert challenges an approved execution |
| `resolve_dispute(execution_id, upheld)` | Resolve dispute — slash trader or clear execution |
| `finalize_execution(execution_id)` | Finalize after dispute window → start reward stream |
| `withdraw_reward(executor, execution_id, amount)` | Withdraw earned rewards (streaming math) |

### Read Functions

| Function | Description |
|----------|-------------|
| `get_strategy(strategy_id)` | Strategy details (creator, reward, active) |
| `get_execution(execution_id)` | Execution details (status, stake, confidence) |
| `get_stream(execution_id)` | Reward stream (total, start/end time, withdrawn) |
| `get_dispute(dispute_id)` | Dispute record |
| `get_earned(execution_id)` | Current earned amount via streaming math |
| `get_dispute_window()` | Dispute window duration (seconds) |
| `get_min_confidence()` | Minimum AI confidence threshold |

### Execution Lifecycle

```
  Pending --> Rejected           (AI says NO)
     |
     v
  Approved --> Disputed          (Expert challenges within window)
     |            |
     |         +--+--+
     |         v     v
     |      Cleared  Slashed     (Dispute resolved)
     |         |
     v         v
  Finalized <--+                 (No dispute / dispute cleared)
     |
     v
  Reward Stream Active           (Linear streaming over time)
```

---

## AI Verification

Gemini's role is **strictly limited** — it verifies, never touches funds:

```
+------------------------------------+
|  INPUT                             |
|  - Strategy rules                  |
|  - Execution proof (images, URLs,  |
|    tx hashes, text)                |
+------------------------------------+
|  GEMINI 2.0 FLASH                  |
|  Compare rules vs. evidence        |
+------------------------------------+
|  OUTPUT                            |
|  {                                 |
|    "approved": true,               |
|    "confidence": 0.95,             |
|    "reason": "All rules met."      |
|  }                                 |
+------------------------------------+
```

> **AI never moves money.** It returns a verdict. The smart contract handles payouts.

---

## Oracle Integration

Three-tier price feed with automatic fallback:

| Priority | Source | Coverage |
|----------|--------|----------|
| 1 | **Pyth Network** | Real-time, cross-chain oracle |
| 2 | **CoinGecko** | Free REST API, wide coverage |
| 3 | **Binance** | Spot prices, high reliability |

Supported assets: `BTC` · `ETH` · `SOL` · `XLM` · `USDC` · `USDT`

```bash
GET /api/oracle/price?asset=BTC
```
```json
{
  "source": "pyth",
  "asset": "BTC",
  "price": 69324.57,
  "confidence": 27.54,
  "timestamp": 1770492029
}
```

---

## Security Model

| Guarantee | How It's Enforced |
|-----------|-------------------|
| No reward without verification | `verify_execution()` must approve first |
| No early withdrawal | Streaming math enforced on-chain |
| No admin override | Zero admin functions in the contract |
| No fake liquidity | XLM locked in escrow at strategy creation |
| AI can't move funds | AI returns verdict only; contract handles payouts |
| Dispute protection | 24h challenge window before finalization |
| Skin in the game | Traders must stake XLM to participate |

---

## Roadmap

- [x] Strategy creation with XLM escrow
- [x] Stake-to-unlock marketplace
- [x] AI verification (Gemini)
- [x] On-chain dispute system
- [x] Reward streaming
- [x] Multi-source oracles (Pyth + CoinGecko + Binance)
- [x] Multi-format proof uploads
- [x] 39-test automated verification suite
- [ ] Mainnet deployment
- [ ] Mobile-responsive UI
- [ ] DAO governance for dispute resolution
- [ ] Strategy performance analytics
- [ ] Cross-chain execution support

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/awesome-feature`)
3. **Commit** your changes (`git commit -m 'Add awesome feature'`)
4. **Push** to the branch (`git push origin feature/awesome-feature`)
5. **Open** a Pull Request

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with love for the <strong>Stellar Build-A-Thon</strong>
  <br/>
  <sub>StratFlow — Publish. Execute. Verify. Earn.</sub>
</p>
