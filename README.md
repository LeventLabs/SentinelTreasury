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
                    ├── Oracle feeds (APRO)
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
- `docs/`: public product and technical docs

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

[![Demo Video](https://img.youtube.com/vi/c5eBq2aXRPA/maxresdefault.jpg)](https://youtu.be/c5eBq2aXRPA)

## Current Status

MVP is functional and deployed on HashKey Chain Testnet.

- 3 contracts deployed and verified on Blockscout
- 77 automated tests (45 contract + 32 AI service)
- End-to-end flow manually verified: deposit → recommend → approve → execute

## Deployed Contracts

| Contract | Address |
|----------|---------|
| MockERC20 (USDC) | [`0xbE6962010697f1B914166209a0E5B18A56bf5708`](https://testnet-explorer.hsk.xyz/address/0xbE6962010697f1B914166209a0E5B18A56bf5708#code) |
| MockYieldVault | [`0x056E4680a3d13A454e8Cc1EA06b9c7df9e2C5f5A`](https://testnet-explorer.hsk.xyz/address/0x056E4680a3d13A454e8Cc1EA06b9c7df9e2C5f5A#code) |
| TreasuryVault | [`0xD45883b809E25FDe337DcFeC24B9844A294cb3F5`](https://testnet-explorer.hsk.xyz/address/0xD45883b809E25FDe337DcFeC24B9844A294cb3F5#code) |

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
