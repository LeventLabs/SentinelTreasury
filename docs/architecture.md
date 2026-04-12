# Sentinel Treasury - Architecture

## Goal
Build an explainable treasury copilot that recommends how much capital should stay liquid, how much should be deployed to yield, and how much should remain reserved for payouts.

## Core Components

### 1. Frontend
- Next.js dashboard for treasury operations
- Wallet connection with wagmi + RainbowKit
- User actions: deposit, request recommendation, approve execution, payout
- UI panels: balances, recommendation card, explainability breakdown, payout form

### 2. Treasury Contract Layer
- `TreasuryVault.sol`
- Holds treasury funds
- Supports deposit, withdraw, payout, and allocation into the mock yield vault
- Stores simple approval state for policy-gated execution

### 3. Yield Contract Layer
- `MockYieldVault.sol`
- Accepts treasury allocations
- Exposes simulated APY and basic deposit/withdraw flows
- Keeps the demo deterministic and avoids dependency on third-party protocols

### 4. AI Service
- FastAPI service with rule-based scoring
- Consumes treasury balances, vault balances, oracle prices, APY, and payout obligations
- Returns an action, allocation percentage, and human-readable reasoning

### 5. Oracle Inputs
- APRO feeds for market data
- Used to derive risk and volatility signals
- Should support fallback mock values for demo continuity

## End-To-End Flow
1. User connects wallet in the frontend
2. User deposits USDC into `TreasuryVault`
3. Frontend fetches treasury state and oracle-backed market inputs
4. Frontend sends a recommendation request to the FastAPI service
5. AI service computes:
   - `yield_score`
   - `liquidity_score`
   - `risk_score`
   - `payout_reserve_score`
6. AI service returns a recommendation with reasoning
7. Authorized approver confirms the recommendation
8. Frontend calls the treasury contract to execute allocation or payout
9. Dashboard refreshes and shows updated balances plus the reasoning trail

## Data Contract For Recommendation API
```json
{
  "inputs": {
    "treasury_balance": 1000,
    "yield_vault_balance": 0,
    "yield_apy": 8,
    "pending_payouts": 200,
    "prices": {
      "BTC_USD": 83000,
      "USDC_USD": 1,
      "HSK_USD": 0.75
    }
  },
  "output": {
    "action": "allocate_to_yield",
    "amount_pct": 40,
    "reasoning": "Move 40% to Yield Vault, keep 60% in Reserve because payout obligation is due and volatility threshold is elevated.",
    "scores": {
      "yield": 72,
      "liquidity": 85,
      "risk": 45,
      "payout_reserve": 90
    }
  }
}
```

## Design Decisions
- Rule-based AI instead of LLM/ML:
  - deterministic output
  - easier to explain to judges
  - faster to build and debug
- Single treasury vault plus one mock yield vault:
  - lower surface area
  - easier end-to-end demo
  - enough to prove allocation logic
- Approval-gated execution:
  - keeps a human in the loop
  - avoids overclaiming autonomous finance
  - aligns better with compliance-aware positioning

## Demo-Critical Dependencies
- HashKey Chain testnet deployment
- Stable wallet connection and funded test account
- Working recommendation API
- At least one live or mocked oracle path
- Reliable happy path for deposit -> recommend -> approve -> execute

## Known Risks
- Oracle integration may be slower than the contract/frontend path
- Testnet instability can break a live demo
- KYC SBT integration may take longer than its presentation value

## Mitigations
- Keep oracle mocks available behind a simple toggle
- Pre-fund wallets and pre-deploy contracts before recording
- Treat KYC as optional polish, not core scope
