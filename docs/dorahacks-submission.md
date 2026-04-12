# Sentinel Treasury — DoraHacks Submission

## Project Name

Sentinel Treasury

## One-Liner

AI copilot for compliant on-chain treasury management on HashKey Chain.

## Tracks

AI, DeFi

## Problem

On-chain teams keep idle capital in treasury wallets because allocation decisions are slow, manual, and hard to justify. Existing tools solve custody, yield, or monitoring separately — but nothing ties them into one explainable operating flow.

## Solution

Sentinel Treasury connects a treasury vault, a yield vault, and a deterministic AI recommendation engine into one operator flow with human-in-the-loop approval. Every recommendation comes with explainable scores and reasoning, so the approver knows exactly why the AI suggests a specific action.

## How It Works

```
Connect Wallet → Deposit USDC → Get AI Recommendation → Review Scores & Reasoning → Approve & Execute → Dashboard Refreshes
```

The AI service evaluates:
- Treasury balance and yield vault balance
- Yield APY (read from chain)
- Oracle price feeds (APRO on HashKey Chain)
- Pending payout obligations (operator input)

It returns a recommended action (`allocate_to_yield`, `withdraw_from_yield`, or `hold`), an allocation amount, and a reasoning payload with four explainable scores: yield, liquidity, risk, and payout reserve.

## Key Features

- **Explainable AI**: Every recommendation includes four scored dimensions with color-coded indicators and human-readable reasoning
- **Policy-Gated Execution**: No autonomous fund movement — an approver must confirm every action
- **Oracle-Aware Risk Scoring**: USDC depeg detection via APRO price feeds with automatic fallback and visible indicator
- **Staleness Protection**: Recommendations auto-clear when balances change, preventing execution on stale data
- **Deterministic Logic**: Identical inputs always produce identical outputs — fully auditable

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, Hardhat, OpenZeppelin 5.x |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Wallet | wagmi v2, RainbowKit, viem |
| AI Service | Python, FastAPI, Pydantic |
| Oracle | APRO price feeds via JSON-RPC (Chainlink-compatible) |
| Network | HashKey Chain Testnet (Chain ID 133) |

## Deployed Contracts (HashKey Chain Testnet)

All contracts are verified on Blockscout:

| Contract | Address | Explorer |
|----------|---------|----------|
| MockERC20 (USDC) | `0xbE6962010697f1B914166209a0E5B18A56bf5708` | [View](https://testnet-explorer.hsk.xyz/address/0xbE6962010697f1B914166209a0E5B18A56bf5708#code) |
| MockYieldVault | `0x056E4680a3d13A454e8Cc1EA06b9c7df9e2C5f5A` | [View](https://testnet-explorer.hsk.xyz/address/0x056E4680a3d13A454e8Cc1EA06b9c7df9e2C5f5A#code) |
| TreasuryVault | `0xD45883b809E25FDe337DcFeC24B9844A294cb3F5` | [View](https://testnet-explorer.hsk.xyz/address/0xD45883b809E25FDe337DcFeC24B9844A294cb3F5#code) |

## Test Coverage

- **45 contract unit tests** — deposit, withdraw, allocate, payout, access control, approver management
- **32 AI service tests** — scoring functions, decision logic branches, determinism, data_source propagation

## Demo Flow

1. Connect wallet to HashKey Chain Testnet
2. Deposit 1,000 USDC into TreasuryVault
3. Click "Get Recommendation" (pending payouts = 200)
4. AI recommends: `allocate_to_yield` — $600 (60%)
5. Review scores: yield=80, liquidity=100, risk=85, payout_reserve=95
6. Click "Approve & Execute"
7. Funds move on-chain: Treasury=$400, Yield=$600
8. Change pending payouts to 900 → AI recommends `hold`

## Architecture

```
┌──────────────────────────────────────────┐
│            Frontend (Next.js)            │
│  Balances · Deposit · Recommend · Approve│
└──────────┬───────────────────┬───────────┘
           │                   │
     wagmi/viem            fetch API
           │                   │
           ▼                   ▼
┌──────────────────┐  ┌────────────────────┐
│  HashKey Chain    │  │  AI Service        │
│  TreasuryVault   │  │  /recommend        │
│  MockYieldVault  │  │  /prices           │
│  APRO Oracles    │  │  /health           │
└──────────────────┘  └────────────────────┘
```

## Links

- **GitHub**: https://github.com/LeventLabs/SentinelTreasury
- **Domain**: sentineltreasury.com

## Team

LeventLabs
