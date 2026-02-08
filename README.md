# StratFlow

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Rust](https://img.shields.io/badge/Rust-Soroban%20SDK-orange)](https://soroban.stellar.org)

**A decentralized trading strategy marketplace where experts monetize their knowledge without managing other people's money, and traders access verified strategies with on-chain profit sharing.**

StratFlow solves a fundamental problem in trading: experts cannot share strategies without custody risk, and traders cannot trust anonymous strategy sellers. Our solution uses Soroban smart contracts on Stellar to create a trustless marketplace where experts publish strategies and lock XLM rewards in escrow, traders independently execute on StellarX DEX and submit proof, Gemini AI verifies execution with confidence scoring, and streaming payments distribute rewards over time. The entire flow is on-chain with no admin keys, no custody, and perfect incentive alignment -- experts only earn when traders profit, and traders only pay on verified success.

Built for the Stellar Build-A-Thon Chennai 2026 (February 7-8, 2026).

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Execution Lifecycle](#execution-lifecycle)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Smart Contract API](#smart-contract-api)
- [Demo Flow](#demo-flow)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

StratFlow is a decentralized trading strategy marketplace built on Stellar where:

- Experts publish trading strategies and lock XLM rewards as incentive
- Traders execute strategies on StellarX DEX and submit proof
- AI (Gemini 2.0 Flash) verifies execution proofs with confidence scoring
- Smart contracts handle escrow, disputes, and streaming payouts

---

## How It Works

```
Expert                          Trader                         Smart Contract
  |                               |                                  |
  |-- 1. Publish strategy ------->|                                  |
  |   (lock 1000 XLM reward)      |                                  |
  |                               |                                  |
  |                               |-- 2. Stake 100 XLM (10%) ------->|
  |                               |                                  |
  |                               |-- 3. Execute on StellarX ------->|
  |                               |                                  |
  |                               |-- 4. Submit proof --------------->|
  |                               |                                  |
  |                               |<-- 5. AI verifies (92% conf) ----|
  |                               |                                  |
  |<-- 6. Dispute window (60s) ---|----------------------------------|
  |                               |                                  |
  |                               |<-- 7. Stream rewards (5 min) ----|
  |                               |                                  |
  |<-- 8. Get 20% share ----------|-- Gets 80% + stake back -------->|
```

---

## Architecture

```mermaid
flowchart TB
    subgraph Frontend["Next.js Frontend"]
        Demo[Demo Flow]
        Market[Marketplace]
        Agents[AI Agents]
        Verify[Verification]
        Dispute[Disputes]
    end

    subgraph Contract["Soroban Smart Contract"]
        Create[create_strategy]
        Submit[submit_execution]
        VerifyFn[verify_execution]
        RaiseDispute[raise_dispute]
        Resolve[resolve_dispute]
        Finalize[finalize_execution]
        Withdraw[withdraw_reward]
    end

    subgraph External["External Services"]
        StellarX[StellarX DEX]
        Gemini[Gemini 2.0 Flash AI]
        Horizon[Stellar Testnet Horizon]
        Freighter[Freighter Wallet]
    end

    Frontend --> Contract
    Contract --> External
    
    Demo --> Market --> Agents --> Verify --> Dispute
    Create --> Submit --> VerifyFn --> Finalize --> Withdraw
    VerifyFn --> RaiseDispute --> Resolve
```

---

## Execution Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: submit_execution()
    
    Pending --> Approved: AI approves (verify_execution true)
    Pending --> Rejected: AI rejects (verify_execution false)
    
    Approved --> Disputed: Expert raises dispute within 60s
    Approved --> Finalized: No dispute after 60s (finalize_execution)
    
    Disputed --> Cleared: Dispute dismissed (resolve_dispute false)
    Disputed --> Slashed: Dispute upheld (resolve_dispute true)
    
    Cleared --> StreamActive: Reward stream starts
    Finalized --> StreamActive: Reward stream starts
    
    StreamActive --> [*]: withdraw_reward() over 5 minutes
    
    Rejected --> [*]: Strategy re-activated
    Slashed --> [*]: Stake burned, strategy re-activated
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| Strategy Marketplace | Experts publish strategies with locked XLM rewards |
| Staking Mechanism | Traders stake 10% of reward as collateral |
| AI Agent Execution | Autonomous trading bots execute strategies 24/7 |
| Gemini AI Verification | Analyzes proofs, assigns 0-100 confidence scores |
| Dispute Resolution | 60-second window for experts to challenge |
| Streaming Payouts | Rewards unlock linearly over 5 minutes |
| On-Chain Escrow | All funds locked in Soroban smart contracts |
| StellarX Integration | One-click trading on Stellar native DEX |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Stellar Testnet + Soroban Smart Contracts |
| Smart Contract | Rust + soroban-sdk |
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | TailwindCSS, Framer Motion |
| AI Verification | Google Gemini 2.0 Flash API |
| Wallet | Freighter Browser Extension |
| DEX | StellarX Integration |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jose) + bcrypt |

---

## Project Structure

```
stratflow/
├── contracts/
│   └── stratflow/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs              # Soroban smart contract (700+ lines)
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── login/                  # Authentication
│   │   ├── signup/
│   │   ├── api/
│   │   │   ├── auth/               # Login, signup, session endpoints
│   │   │   ├── oracle/             # Price feed API
│   │   │   └── verify/             # Gemini AI verification endpoint
│   │   └── app/
│   │       ├── page.tsx            # Dashboard overview
│   │       ├── demo/               # 6-step demo walkthrough
│   │       ├── marketplace/        # Browse and stake on strategies
│   │       ├── create/             # Publish new strategies
│   │       ├── agents/             # AI agent dashboard
│   │       ├── verify/             # AI verification results
│   │       ├── submissions/        # View past submissions
│   │       └── dispute/            # Challenge executions
│   │
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── WalletProvider.tsx
│   │   ├── StellarXIntegration.tsx
│   │   ├── ProofUploader.tsx
│   │   └── LivePriceOracle.tsx
│   │
│   └── lib/
│       ├── stellar.ts              # Stellar SDK helpers
│       ├── contract.ts             # Contract interaction
│       ├── auth.tsx                # Auth context
│       ├── session.ts              # JWT session management
│       └── db.ts                   # SQLite database
│
├── scripts/
│   └── test-flow.md
│
└── README.md
```

---

## Smart Contract API

### Data Structures

| Structure | Fields |
|-----------|--------|
| Strategy | creator, reward_amount, active |
| Execution | executor, strategy_id, verified, status, stake_amount, approved_at, confidence |
| RewardStream | total_amount, start_time, end_time, withdrawn |
| Dispute | challenger, execution_id, reason_code, created_at, resolved, upheld |

### Execution Status Enum

| Status | Description |
|--------|-------------|
| Pending | Submitted, awaiting AI verification |
| Approved | AI approved, in dispute window |
| Disputed | Expert raised a challenge |
| Cleared | Dispute dismissed, stream starts |
| Slashed | Dispute upheld, stake burned |
| Finalized | No dispute, stream starts |
| Rejected | AI rejected outright |

### Write Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| create_strategy | creator: Address, reward_amount: i128 | u64 | Expert publishes strategy, locks reward in escrow |
| submit_execution | executor: Address, strategy_id: u64 | u64 | Trader stakes 10% and submits execution |
| verify_execution | execution_id: u64, approved: bool | bool | Record AI verdict, enter dispute window if approved |
| set_confidence | execution_id: u64, confidence: u32 | - | Store AI confidence score (0-100) |
| raise_dispute | challenger: Address, execution_id: u64, reason_code: u32 | u64 | Expert challenges within 60s window |
| resolve_dispute | execution_id: u64, upheld: bool | bool | Resolve dispute: slash or clear |
| finalize_execution | execution_id: u64 | bool | No dispute raised, start reward stream |
| withdraw_reward | executor: Address, execution_id: u64, amount: i128 | i128 | Claim streamed rewards |

### Read Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| get_strategy | strategy_id: u64 | Strategy | Get strategy details |
| get_execution | execution_id: u64 | Execution | Get execution details |
| get_stream | execution_id: u64 | RewardStream | Get reward stream |
| get_dispute | dispute_id: u64 | Dispute | Get dispute record |
| get_exec_dispute | execution_id: u64 | u64 | Get dispute ID for execution |
| get_dispute_window | - | u64 | Returns 60 (seconds) |
| get_min_confidence | - | u32 | Returns 85 (percent) |
| get_earned | execution_id: u64 | i128 | Calculate current earned amount |

### Contract Constants

| Constant | Value | Description |
|----------|-------|-------------|
| DISPUTE_WINDOW | 60 seconds | Time for expert to challenge (demo) |
| MIN_CONFIDENCE | 85% | Minimum AI confidence to approve |
| STAKE_PERCENT | 10% | Executor stake as percentage of reward |
| STREAM_DURATION | 300 seconds | Reward streaming period (5 minutes) |

---

## Demo Flow

```mermaid
sequenceDiagram
    participant Expert
    participant Contract
    participant Trader
    participant AI as Gemini AI
    participant DEX as StellarX

    Expert->>Contract: 1. create_strategy(1000 XLM)
    Note over Contract: Reward locked in escrow

    Trader->>Contract: 2. submit_execution(stake 100 XLM)
    Note over Contract: 10% stake locked

    Trader->>DEX: 3. Execute trades on StellarX
    DEX-->>Trader: Trade confirmation

    Trader->>AI: 4. Submit proof (screenshots, tx hashes)
    AI->>Contract: verify_execution(approved: true, confidence: 92%)
    Note over Contract: Status: Approved

    Note over Contract: 5. Dispute Window (60 seconds)
    
    alt No Dispute
        Contract->>Contract: 6. finalize_execution()
        Note over Contract: Status: Finalized
    else Expert Disputes
        Expert->>Contract: raise_dispute(reason_code: 1)
        AI->>Contract: resolve_dispute(upheld: false)
        Note over Contract: Status: Cleared
    end

    loop Every 30 seconds for 5 minutes
        Trader->>Contract: 7. withdraw_reward()
        Contract-->>Trader: Streamed XLM
    end
```

### Step-by-Step

1. **Expert Creates Strategy** - Expert locks 1000 XLM reward and publishes trading rules
2. **Trader Stakes** - Trader stakes 100 XLM (10%) as collateral and commits to execute
3. **Execute on StellarX** - Trader executes trades on Stellar DEX following strategy rules
4. **AI Verification** - Gemini 2.0 Flash analyzes proof and assigns confidence score
5. **Dispute Window** - Expert has 60 seconds to challenge the execution
6. **Finalization** - If no dispute, execution is finalized and stream starts
7. **Streaming Payout** - Trader withdraws rewards linearly over 5 minutes

---

## Quick Start

### Prerequisites

- Node.js v18+
- Rust v1.84+ (for contract development)
- Stellar CLI v25+ (for deployment)
- Freighter Wallet browser extension

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/stratflow
cd stratflow

# Install frontend dependencies
cd frontend
npm install

# Run development server
npm run dev
```

Open http://localhost:3000 and click "Demo Flow" in the sidebar.

### Deploy Smart Contract

```bash
cd contracts

# Add Soroban target
rustup target add wasm32v1-none

# Build contract
cargo build --target wasm32v1-none --release

# Deploy to Stellar Testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stratflow.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet
```

---

## Environment Variables

Create `frontend/.env.local`:

```env
# Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key

# Deployed Soroban Contract ID
NEXT_PUBLIC_CONTRACT_ID=CBJRILB6ZOEUWJ7Q5WGXL7PZZJDB7M7YUOFCOYAV3QYZYHGLB7FW5Q73

# Stellar Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

---

## Testing

### Smart Contract Tests

```bash
cd contracts/stratflow
cargo test
```

8 test cases covering:
- Full flow without dispute
- Dispute upheld (executor slashed)
- Dispute dismissed (stream starts)
- Rejection re-activates strategy
- Late dispute blocked
- Non-creator dispute blocked
- Withdraw before finalize blocked
- Early withdrawal blocked

### Frontend Tests

```bash
cd frontend
node test-demo.mjs
```

---

## Security Model

| Guarantee | Enforcement |
|-----------|-------------|
| No reward without verification | verify_execution must approve first |
| No early withdrawal | Streaming math enforced on-chain |
| No admin override | Zero admin functions in contract |
| Stake prevents fraud | 10% stake slashed if dispute upheld |
| AI cannot move funds | AI returns verdict only, contract handles payouts |
| Dispute protection | 60-second challenge window before finalization |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repo
git clone https://github.com/sujit-al1809/stellar-hackathon.git
cd stratflow

# Install frontend dependencies
cd frontend && npm install

# Run in development mode
npm run dev
```

### Running Contract Tests

```bash
cd contracts/stratflow
cargo test
```

---

## Acknowledgments

- [Stellar Development Foundation](https://stellar.org) for the Soroban smart contracts platform
- [StellarX](https://stellarx.com) for the DEX integration
- [Google Gemini](https://gemini.google.com) for AI verification capabilities
- Stellar Build-A-Thon Chennai 2026 organizers

---

## Hackathon Submission

| Field | Value |
|-------|-------|
| Event | Stellar Build-A-Thon Chennai |
| Date | February 7-8, 2026 |
| Prize Pool | $1,200 |
| Track | DeFi / AI / Payments |
| Repository | [github.com/sujit-al1809/stellar-hackathon](https://github.com/sujit-al1809/stellar-hackathon) |

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 StratFlow

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

**Made with Rust, Next.js, and Stellar**
