# Sentinel Treasury

**The AI copilot for compliant on-chain treasury management**

AI treasury copilot that decides how much capital to keep liquid, how much to deploy for yield, and how much to reserve for payments — with explainable and policy-gated execution on HashKey Chain.

## Overview

Sentinel Treasury is a hackathon-stage treasury management system for teams that hold on-chain capital and still make allocation decisions manually. It combines:

- on-chain treasury controls
- a rule-based AI recommendation service
- explainable scoring for every suggested action
- policy-gated execution instead of blind automation

The MVP focuses on one clear flow: deposit funds, generate a recommendation, approve it, and execute the resulting treasury action on-chain.

## Problem

Many on-chain teams keep idle capital in treasury wallets because allocation decisions are slow, manual, and hard to justify. Existing tooling usually solves only one part of the problem:

- wallets and multisigs handle custody
- yield protocols handle deployment
- risk tools handle monitoring

Sentinel Treasury tries to connect these layers into one operating flow.

## How It Works

```
User → Wallet Connect → KYC SBT check → TreasuryVault (on-chain)
                                                ↓
                            allocateToYield ⇢ APRO peg gate (USDC/USD)
                                                ↓
                                       AI Service (off-chain)
                                       ├── Oracle feeds (APRO)
                                       ├── Rule-based scoring engine (5 signals)
                                       └── Recommendation + reasoning
                                                ↓
                                      Approver confirms → Execute on-chain
                                                ↓
                                      Dashboard shows reasoning
```

The recommendation engine evaluates:

- treasury balance
- yield vault balance and APY
- market inputs from oracle feeds (APRO)
- pending payout obligations
- native HSK gas reserve on the treasury

It returns a recommended action, allocation size, and a reasoning payload with five explainable scores (`yield`, `liquidity`, `risk`, `payout reserve`, `gas reserve`).

On-chain, deposits require a KYC SBT on the caller, approver appointments require an `ADVANCED` or higher tier, and `payout` requires `PREMIUM` or higher. Allocations to the yield vault are additionally gated by an APRO USDC/USD peg check — if USDC deviates more than 0.5% from $1.00, the allocation reverts while `deposit`, `withdraw`, `withdrawFromYield`, and `payout` remain available so operators can always exit during depeg stress.

## Core Components

- `frontend/`: Next.js dashboard with wallet connect, treasury actions, recommendation UI, KYC badge + Request KYC button, and explainability panels
- `contracts/`: Hardhat workspace for `TreasuryVault`, `MockYieldVault`, and `MockKycSBT` (demo stand-in for the canonical HashKey KYC SBT)
- `ai-service/`: FastAPI recommendation service with deterministic scoring logic
- `docs/`: public product and technical docs

## Phase 2: HashKey-Native Primitives

Phase 2 layers three HashKey-native integrations on top of the MVP, preserving all existing behavior when the gates are unset:

- **KYC SBT gating.** `TreasuryVault` reads an `IKycSBT`-compatible contract to gate `deposit` (any tier), `addApprover` (ADVANCED+), and `payout` (PREMIUM+). When no KYC SBT address is configured, all gates short-circuit and MVP behavior is unchanged. The demo ships `MockKycSBT` which implements the full canonical interface; the production migration path is to point the same setter at the canonical HashKey KYC SBT when available.
- **APRO USDC/USD peg gate.** `allocateToYield` consults an APRO `AggregatorV3`-compatible feed and reverts with `peg deviation` if USDC is more than 0.5% off peg. The gate is unidirectional by design: it blocks risky allocations while leaving withdrawals and payouts fully operational during depeg events.
- **Gas-reserve signal in AI scoring.** The recommendation engine reads the treasury's native HSK balance and emits a `gas_reserve` score. If the reserve is too low, the AI returns `hold` with an actionable reason ("top up HSK") rather than recommending further on-chain operations the treasury cannot pay gas for.

A **Phase 2 Roadmap** panel in the dashboard links to the already-deployed `KycTierProofVerifier` on HashKey testnet as the credible ZKID migration path. Phase 2 itself does not ship ZK proofs — zkFabric integration is deferred to a next sprint.

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Python 3.11+
- a funded wallet for HashKey Chain testnet

### 1. Contracts
```bash
cd contracts
npm install
cp .env.example .env   # add PRIVATE_KEY
npx hardhat compile
npx hardhat run scripts/deploy.ts --network hashkeyTestnet
```

### 2. AI Service
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env   # defaults work for HashKey testnet
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # add contract addresses + API URL
npm run dev
```

## Environment

Each app has its own example env file:

- `contracts/.env.example`
- `ai-service/.env.example`
- `frontend/.env.example`

At minimum, expect to configure:

- private key / deployer wallet
- API base URL
- deployed contract addresses (output of deploy script)

## Repo Structure

```text
SentinelTreasury/
├── contracts/    # Hardhat project and deployment scripts
├── ai-service/   # FastAPI scoring and recommendation service
├── frontend/     # Next.js application
├── docs/         # Public product and technical docs
└── README.md
```

## HashKey Chain Testnet

| Param | Value |
|-------|-------|
| RPC | https://testnet.hsk.xyz |
| Chain ID | 133 |
| Explorer | https://testnet-explorer.hsk.xyz |

## Demo

- **Live app:** https://sentineltreasury.com
- **Demo video:**

[![Demo Video](https://img.youtube.com/vi/c5eBq2aXRPA/maxresdefault.jpg)](https://youtu.be/c5eBq2aXRPA)

## Current Status

Phase 2 is live on HashKey Chain Testnet. `TreasuryVault` now enforces KYC-SBT tier gates, the APRO USDC/USD peg gate, and the AI recommendation engine scores treasury gas reserves.

- 4 contracts deployed and verified on Blockscout (TreasuryVault, MockYieldVault, MockERC20, MockKycSBT)
- 157 automated tests (109 contract + 48 AI service)
- End-to-end flow verified: request KYC → deposit → recommend (5 scores) → approve (peg gate) → execute

## Deployed Contracts (HashKey Chain Testnet, Phase 2)

| Contract | Address |
|----------|---------|
| MockERC20 (USDC) | [`0x06Dd39741a02DdA6105505BE4073aDbbf393701C`](https://testnet-explorer.hsk.xyz/address/0x06Dd39741a02DdA6105505BE4073aDbbf393701C#code) |
| MockYieldVault | [`0x3f0335AeA55FD00E85DC8DA345F67fFba0730774`](https://testnet-explorer.hsk.xyz/address/0x3f0335AeA55FD00E85DC8DA345F67fFba0730774#code) |
| TreasuryVault | [`0xCd93E05Df0C0bB8C40a9BD592b4bB4d1a6DaE931`](https://testnet-explorer.hsk.xyz/address/0xCd93E05Df0C0bB8C40a9BD592b4bB4d1a6DaE931#code) |
| MockKycSBT | [`0x5cEd9f517101B25D575aA19f620077543cA83454`](https://testnet-explorer.hsk.xyz/address/0x5cEd9f517101B25D575aA19f620077543cA83454#code) |

The TreasuryVault is wired to the APRO USDC/USD feed at [`0xCdB1…fAE27`](https://testnet-explorer.hsk.xyz/address/0xCdB10dC9dB30B6ef2a63aB4460263655808fAE27).

## Hackathon

HashKey Chain Horizon Hackathon — [dorahacks.io/hackathon/2045](https://dorahacks.io/hackathon/2045/detail)

Tracks: AI, DeFi

## Documentation

- [MVP definition](docs/mvp.md)
- [Architecture](docs/architecture.md)

## Disclaimer

Sentinel Treasury is currently an MVP and hackathon project. It is not production-ready treasury infrastructure and should not be used to manage real funds without a full security review, operational controls, and protocol hardening.

## Team

LeventLabs
