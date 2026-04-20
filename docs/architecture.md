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
- Reads an `IKycSBT`-compatible SBT to gate sensitive actions by tier (Phase 2)
- Reads an APRO `AggregatorV3` USDC/USD feed to gate `allocateToYield` on peg deviation (Phase 2)

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
    "yield_balance": 0,
    "yield_apy": 8,
    "pending_payouts": 200,
    "treasury_hsk_balance": 0.3
  },
  "output": {
    "action": "allocate_to_yield",
    "amount_pct": 60,
    "amount_abs": 600.0,
    "reasoning": "Move 60% to Yield Vault (APY 8%). Keep 40% in Reserve. Payout reserve of 200 is covered. Risk level acceptable.",
    "scores": {
      "yield": 80,
      "liquidity": 100,
      "risk": 85,
      "payout_reserve": 95,
      "gas_reserve": 70
    },
    "data_source": "live"
  }
}
```

Prices are fetched server-side from the APRO oracle on HashKey Chain (`/prices` endpoint). The AI service also accepts client-supplied `treasury_hsk_balance` because the backend does not hold a wallet and therefore cannot query the treasury contract's native balance itself — the frontend reads it via `useBalance` and forwards it.

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

## Phase 2 Delta (HashKey-Native Core)

Phase 2 adds three HashKey-native primitives on top of the MVP architecture. All three integrations are additive — when their setters are unconfigured, the MVP behavior is unchanged and the original 45 MVP contract tests continue to pass.

### New contract: `MockKycSBT`
Demo stand-in for the canonical HashKey KYC SBT. Implements the full `IKycSBT` interface (`requestKyc`, `isHuman`, `revokeKyc`, `restoreKyc`, `getKycInfo`, `approveEnsName`, `isEnsNameApproved`) plus an owner-only `setKycInfo` for tier seeding and `getTotalFee`/`setTotalFee`. This contract is demo-only — it is **not** a production-grade identity contract. Migration to the canonical SBT is a single `TreasuryVault.setKycSBT(newAddress)` call.

### `TreasuryVault` gates
- `deposit` → requires `isHuman(caller) == true` (any tier ≥ BASIC)
- `addApprover(a)` → requires `level(a) ≥ ADVANCED`
- `payout` → requires `level(msg.sender) ≥ PREMIUM`
- `allocateToYield` → passes through the APRO peg gate (see below)
- `removeApprover`, `withdraw`, `withdrawFromYield` remain ungated so operators can exit during KYC-system outages

### APRO peg gate
- Reads the APRO USDC/USD `AggregatorV3` feed (8 decimals)
- Reverts `"peg deviation"` if `|answer - 1e8| > 5e5` (i.e. > 0.5% off peg)
- Reverts `"bad feed"` if the feed returns `answer ≤ 0`
- Gate is **unidirectional**: only `allocateToYield` is gated; exits (`withdrawFromYield`, `withdraw`, `payout`) are always permitted
- No caching — the feed is read every call so feed updates take effect immediately
- No staleness check — the feed's `answer > 0` sanity is sufficient for the demo and avoids false reverts during testnet oracle downtime

### AI service: `gas_reserve` score
- New Pydantic field on `TreasuryState`: `treasury_hsk_balance: float` (default `1.0` so existing clients do not regress)
- New scoring function `gas_reserve_score(hsk_balance)` with thresholds: `≥1.0 → 95`, `≥0.2 → 70`, `≥0.05 → 40`, `≥0.01 → 20`, else `5`
- New decision-tree branch: `IF gas_reserve_score < 30 → hold("Gas reserve too low…")` evaluated before the payout-reserve branch
- Scores dict now has five fields: `yield`, `liquidity`, `risk`, `payout_reserve`, `gas_reserve`

### Frontend changes
- `KycBadge` component renders the connected wallet's tier as a colored badge; hides cleanly when `NEXT_PUBLIC_KYC_SBT_ADDRESS` is unset
- `RequestKycButton` calls `requestKyc("<short>.sentinel", { value: getTotalFee() })` and refetches `isHuman` on confirmation
- Dashboard reads the treasury's native HSK balance via `useBalance` and forwards it to the `/recommend` POST body as `treasury_hsk_balance`
- Explainability panel renders 5 score tiles (responsive: 3 columns on mobile, 5 on `sm+`)
- "Phase 2 Roadmap" panel links to the already-deployed `KycTierProofVerifier` on HashKey testnet as the credible ZKID migration path — the panel is static content, no ZK code ships in this submission

### What Phase 2 does **not** ship
- No PolicyVault contract — tier checks live inline in `TreasuryVault`
- No ZK proof generation or verification — zkFabric is roadmap only
- No multi-stablecoin support — USDT feed is mislabeled on HashKey testnet, so only USDC peg is gated
- No staleness check on the APRO feed — trade-off accepted to avoid demo-day false reverts
