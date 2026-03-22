# Sentinel Treasury - Implementation Spec

## Purpose

- Define the implementation path for the MVP.
- Keep delivery aligned across contracts, AI service, and frontend.
- Track progress in one operational document.

## Status Snapshot

- Contracts exist in repo, but testnet deployment is not yet confirmed in this document.
- AI service exists and exposes `/health`, `/prices`, and `/recommend`.
- Frontend exists, but deposit and approve/execute flows are still simulated.
- Current primary goal is the happy path:
  - connect wallet
  - deposit
  - request recommendation
  - approve and execute
- Payout flow is useful for the demo, but not required for the core MVP proof.

## Current Objective

- Deliver a demoable end-to-end flow on HashKey Chain testnet:
  - connect wallet
  - deposit into treasury
  - request recommendation
  - approve and execute
  - show updated balances and reasoning

## Scope

- In scope:
  - `contracts/contracts/TreasuryVault.sol`
  - `contracts/contracts/MockYieldVault.sol`
  - `contracts/scripts/deploy.ts`
  - `ai-service/main.py`
  - `ai-service/oracle.py`
  - `ai-service/recommender.py`
  - `frontend/src/app/page.tsx`
  - `frontend/src/components/DepositForm.tsx`
  - `frontend/src/components/ApprovalFlow.tsx`
  - `frontend/src/components/Dashboard.tsx`
  - `frontend/src/components/RecommendationCard.tsx`
  - `frontend/src/config/contracts.ts`
  - `frontend/src/config/wagmi.ts`
  - `frontend/src/providers/Web3Provider.tsx`
- Out of scope for MVP:
  - production hardening
  - complex permissions model
  - real multisig
  - historical analytics
  - notification system
  - LLM/ML-based decision engine

## Delivery Standard

- Deterministic behavior over novelty
- Explainability visible in UI
- No critical happy-path step should depend on manual patching during demo
- If an external dependency can fail, there should be a fallback path or a clear demo-safe workaround

## System Breakdown

### 1. Contracts

- `TreasuryVault.sol`
  - Must support deposit
  - Must support withdraw
  - Must support payout
  - Must support allocate to yield
  - Must support withdraw from yield
  - Must support simple approval-gated execution
- `MockYieldVault.sol`
  - Must accept treasury allocations
  - Must expose deterministic APY
  - Must support withdraw back to treasury
- `deploy.ts`
  - Must deploy yield vault first
  - Must deploy treasury with required constructor params
  - Must print deployed addresses clearly

### 2. AI Service

- `/health`
  - Must return simple readiness signal
- `/prices`
  - Must return usable market data shape
  - Must tolerate oracle issues with fallback behavior if needed
- `/recommend`
  - Must accept treasury state
  - Must return:
    - action
    - amount percentage
    - amount absolute
    - reasoning
    - scores
- Recommendation logic must remain deterministic for the same inputs

### 3. Frontend

- Wallet connection must work on HashKey Chain testnet
- User must be able to:
  - connect wallet
  - view balances
  - deposit
  - request recommendation
  - approve and execute
  - view reasoning and resulting state
- Payout can remain outside the primary demo path if the core allocation flow is working reliably.
- Current gap:
  - `DepositForm.tsx` still simulates deposit
  - `ApprovalFlow.tsx` still simulates execution
  - contract addresses default to `"0x"` without env config

## Required Environment

- Contracts env:
  - private key
  - USDC address
- AI service env:
  - RPC URL
  - oracle addresses
  - contract addresses if required by implementation
- Frontend env:
  - treasury address
  - yield vault address
  - USDC address
  - AI service base URL

## Implementation Sequence

### Phase 1 - Contracts and Deployment

- Verify contract interfaces against intended frontend actions
- Compile successfully
- Deploy to HashKey Chain testnet
- Save deployed addresses
- Verify basic contract calls with script or console

### Phase 2 - AI Service

- Confirm `/health` works
- Confirm `/prices` returns expected structure
- Confirm `/recommend` returns deterministic output
- Add fallback behavior if live oracle path is unstable

### Phase 3 - Frontend Wiring

- Set real env addresses
- Replace simulated deposit with actual contract write
- Replace simulated approve/execute with actual contract write
- Load balances from chain
- Connect recommendation UI to AI service

### Phase 4 - End-to-End Validation

- Execute happy path on testnet
- Verify balance changes after deposit
- Verify recommendation payload is shown correctly
- Verify approve/execute updates on-chain state
- Verify payout flow only if it is kept in the final demo scope

### Phase 5 - Demo Readiness

- Remove broken placeholder states from critical path
- Confirm fallback path for oracle or testnet issues
- Rehearse exact demo path at least once using final env values

## Progress Checklist

### Contracts

- [ ] `TreasuryVault.sol` compile passes
- [ ] `MockYieldVault.sol` compile passes
- [ ] deploy script runs on HashKey Chain testnet
- [ ] deployed addresses recorded
- [ ] deposit flow verified
- [ ] allocate to yield flow verified
- [ ] withdraw from yield flow verified
- [ ] payout flow verified

### AI Service

- [ ] FastAPI app starts locally
- [ ] `/health` verified
- [ ] `/prices` verified
- [ ] `/recommend` verified with stable output
- [ ] oracle fallback path defined or implemented

### Frontend

- [ ] wallet connect works on target chain
- [ ] dashboard loads real balances
- [ ] deposit form writes on-chain
- [ ] recommendation card calls AI service
- [ ] approval flow executes on-chain action
- [ ] payout UI works or is explicitly excluded from the final demo scope
- [ ] loading and error states cover the happy path

### Integration

- [ ] frontend points to deployed contract addresses
- [ ] frontend points to running AI service
- [ ] end-to-end deposit -> recommend -> execute works
- [ ] end-to-end balance updates are visible in UI

### Demo Readiness

- [ ] demo wallet funded
- [ ] contract addresses finalized
- [ ] fallback plan documented
- [ ] one full rehearsal completed

## Acceptance Criteria

- A wallet connects on HashKey Chain testnet without manual code changes
- A user can deposit funds into treasury from the UI
- The system returns a readable recommendation with scores and reasoning
- An approver can execute the recommended action from the UI
- Updated balances are visible after execution
- The demo can still be completed if oracle data needs to fall back to mock values

## Known Risks

- Testnet instability
- Missing or incorrect deployed addresses
- Frontend contract write integration still incomplete
- Oracle path may be less reliable than local deterministic logic

## Mitigations

- Pre-deploy contracts and record addresses before demo
- Keep env values explicit and versioned in example files
- Keep simulated logic out of the final happy path
- Add fallback data path for recommendation inputs if live feeds fail

## Immediate Next Actions

- Wire `DepositForm.tsx` to real treasury deposit call
- Wire `ApprovalFlow.tsx` to real allocate/withdraw action call
- Deploy contracts and record final addresses
- Set frontend env vars with deployed addresses
- Run one end-to-end test on HashKey Chain testnet
