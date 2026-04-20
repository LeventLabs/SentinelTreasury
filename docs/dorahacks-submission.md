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
- Treasury's native HSK gas reserve

It returns a recommended action (`allocate_to_yield`, `withdraw_from_yield`, or `hold`), an allocation amount, and a reasoning payload with five explainable scores: yield, liquidity, risk, payout reserve, and gas reserve.

## Key Features

- **Explainable AI**: Every recommendation includes five scored dimensions with color-coded indicators and human-readable reasoning
- **Policy-Gated Execution**: No autonomous fund movement — an approver must confirm every action
- **KYC-Gated Treasury Actions**: Deposits require a KYC SBT; approver appointments require ADVANCED+; payouts require PREMIUM+. Uses an `IKycSBT`-compatible contract so the demo-day `MockKycSBT` can be swapped for the canonical HashKey KYC SBT via a single owner-only setter
- **APRO Peg Gate**: `allocateToYield` reverts if the APRO USDC/USD feed shows more than 0.5% deviation from peg, while `deposit`, `withdraw`, `withdrawFromYield`, and `payout` remain available so operators can always exit during depeg stress
- **Oracle-Aware Risk Scoring**: USDC depeg detection via APRO price feeds with automatic fallback and visible indicator
- **Gas-Reserve Awareness**: AI returns `hold` with an actionable reason when the treasury's native HSK balance is too low to safely fund future on-chain operations
- **Staleness Protection**: Recommendations auto-clear when balances change, preventing execution on stale data
- **Deterministic Logic**: Identical inputs always produce identical outputs — fully auditable

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, Hardhat, OpenZeppelin 5.x, `IKycSBT` + APRO `AggregatorV3` interfaces |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Wallet | wagmi v2, RainbowKit, viem |
| AI Service | Python, FastAPI, Pydantic |
| Oracle | APRO price feeds via JSON-RPC (Chainlink-compatible) |
| Network | HashKey Chain Testnet (Chain ID 133) |

## Deployed Contracts (HashKey Chain Testnet)

All contracts are verified on Blockscout:

| Contract | Address | Explorer |
|----------|---------|----------|
| MockERC20 (USDC) | `0x06Dd39741a02DdA6105505BE4073aDbbf393701C` | [View](https://testnet-explorer.hsk.xyz/address/0x06Dd39741a02DdA6105505BE4073aDbbf393701C#code) |
| MockYieldVault | `0x3f0335AeA55FD00E85DC8DA345F67fFba0730774` | [View](https://testnet-explorer.hsk.xyz/address/0x3f0335AeA55FD00E85DC8DA345F67fFba0730774#code) |
| TreasuryVault | `0xCd93E05Df0C0bB8C40a9BD592b4bB4d1a6DaE931` | [View](https://testnet-explorer.hsk.xyz/address/0xCd93E05Df0C0bB8C40a9BD592b4bB4d1a6DaE931#code) |
| MockKycSBT | `0x5cEd9f517101B25D575aA19f620077543cA83454` | [View](https://testnet-explorer.hsk.xyz/address/0x5cEd9f517101B25D575aA19f620077543cA83454#code) |

External reference — APRO USDC/USD feed: [`0xCdB10dC9dB30B6ef2a63aB4460263655808fAE27`](https://testnet-explorer.hsk.xyz/address/0xCdB10dC9dB30B6ef2a63aB4460263655808fAE27).

## Test Coverage

- **109 contract unit tests** — deposit, withdraw, allocate, payout, access control, approver management, `MockKycSBT` behavior (28 tests), TreasuryVault KYC gating (20 tests), and APRO peg gate (16 tests)
- **48 AI service tests** — scoring functions, decision logic branches, determinism, data_source propagation, gas-reserve score thresholds (10 tests), and gas-reserve decision branch (4 tests)

## Demo Flow

1. Connect wallet to HashKey Chain Testnet
2. **Request KYC** → MockKycSBT mints a BASIC tier SBT to the connected address (badge flips from "No KYC" → "BASIC")
3. Deposit 1,000 USDC into TreasuryVault (KYC gate passes)
4. Click "Get Recommendation" (pending payouts = 200)
5. AI recommends: `allocate_to_yield` — $600 (60%)
6. Review five explainable scores: yield, liquidity, risk, payout reserve, gas reserve
7. Click "Approve & Execute" → APRO USDC/USD peg gate reads ≈ $1.00 → allocation succeeds
8. Funds move on-chain: Treasury=$400, Yield=$600
9. Change pending payouts to 900 → AI recommends `hold` with "payout obligations require full reserve"

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
- **Live App**: https://sentineltreasury.com
- **Demo Video**: https://youtu.be/c5eBq2aXRPA
- **Domain**: sentineltreasury.com

## Roadmap

- **zkFabric / ZKID integration** — integrated in a next sprint. The already-deployed `KycTierProofVerifier` (`0x3b395F…4bbc`) on HashKey testnet is the target verifier; the dashboard already links it from a "Phase 2 Roadmap" panel. This submission does **not** claim the ZKID track and does **not** currently use ZK proofs.
- **Canonical HashKey KYC SBT migration** — `MockKycSBT` implements the full canonical interface, so migrating is a single owner-only setter call once the production SBT is deployed.

## Team

LeventLabs
