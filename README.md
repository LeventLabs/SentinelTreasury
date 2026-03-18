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
User → Wallet Connect → TreasuryVault (on-chain)
                              ↓
                    AI Service (off-chain)
                    ├── Oracle feeds (SUPRA/APRO)
                    ├── Rule-based scoring engine
                    └── Recommendation + reasoning
                              ↓
                    Approver confirms → Execute on-chain
                              ↓
                    Dashboard shows reasoning
```

The recommendation engine evaluates:

- treasury balance
- yield vault balance and APY
- market inputs from oracle feeds
- pending payout obligations

It returns a recommended action, allocation size, and a reasoning payload with readable scores.

## Core Components

- `frontend/`: Next.js dashboard with wallet connect, treasury actions, recommendation UI, and explainability panels
- `contracts/`: Hardhat workspace for `TreasuryVault` and `MockYieldVault`
- `ai-service/`: FastAPI recommendation service with deterministic scoring logic
- `docs/`: product scope, architecture, build plan, and demo/submission material

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
cp .env.example .env   # add PRIVATE_KEY + USDC_ADDRESS
npx hardhat compile
npx hardhat run scripts/deploy.ts --network hashkeyTestnet
```

### 2. AI Service
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env   # add contract addresses
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
- contract addresses
- API base URL
- chain-specific addresses such as testnet USDC

## Repo Structure

```text
SentinelTreasury/
├── contracts/    # Hardhat project and deployment scripts
├── ai-service/   # FastAPI scoring and recommendation service
├── frontend/     # Next.js application
├── docs/         # Product, architecture, and hackathon docs
└── README.md
```

## HashKey Chain Testnet

| Param | Value |
|-------|-------|
| RPC | https://testnet.hsk.xyz |
| Chain ID | 133 |
| Explorer | https://testnet-explorer.hsk.xyz |

## Current Status

This project is currently being built as an MVP for the HashKey Chain Horizon Hackathon.

- Core direction is locked in `docs/mvp.md`
- Build execution plan is tracked in `docs/build-plan.md`
- Demo flow is defined in `docs/demo-script.md`

## Hackathon

HashKey Chain Horizon Hackathon — [dorahacks.io/hackathon/2045](https://dorahacks.io/hackathon/2045/detail)

Tracks: AI, DeFi

## Documentation

- [Product pitch](/home/levent/Documents/LeventLabs/SentinelTreasury/docs/pitch.md)
- [MVP definition](/home/levent/Documents/LeventLabs/SentinelTreasury/docs/mvp.md)
- [Architecture](/home/levent/Documents/LeventLabs/SentinelTreasury/docs/architecture.md)
- [Build plan](/home/levent/Documents/LeventLabs/SentinelTreasury/docs/build-plan.md)
- [Demo script](/home/levent/Documents/LeventLabs/SentinelTreasury/docs/demo-script.md)
- [DoraHacks submission draft](/home/levent/Documents/LeventLabs/SentinelTreasury/docs/dorahacks-submission.md)

## Disclaimer

Sentinel Treasury is currently an MVP and hackathon project. It is not production-ready treasury infrastructure and should not be used to manage real funds without a full security review, operational controls, and protocol hardening.

## Team

LeventLabs
