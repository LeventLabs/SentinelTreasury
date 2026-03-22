# 1. Project Name

- Sentinel Treasury

# 2. One-Sentence Summary

- Explainable treasury copilot for on-chain teams that recommends reserve, yield allocation, and payout actions on HashKey Chain.

# 3. Core Idea

- Combine a treasury contract, a mock yield vault, and a rule-based AI service into one operator flow.
- Keep a human approver in the loop before execution.
- Show reasoning for every recommendation.

# 4. Problem

- On-chain teams keep idle capital because allocation decisions are manual and slow.
- Existing tools cover custody, yield, or monitoring separately.
- There is no simple flow in this repo yet that ties treasury actions and explainable recommendations together end to end.

# 5. Solution

- `TreasuryVault` handles deposit, withdraw, payout, and allocation actions.
- `MockYieldVault` simulates yield with a deterministic APY.
- FastAPI service computes deterministic recommendations from balances, payout obligations, APY, and oracle inputs.
- Next.js frontend is intended to connect wallet, show balances, request recommendation, and execute approved actions.

# 6. ICP / Target Customer

- Small on-chain teams with treasury funds on HashKey Chain testnet.
- Teams that want explainable treasury actions instead of fully autonomous execution.
- Hackathon judges and demo viewers are also an immediate audience for the MVP.

# 7. Current Status

- Repo scaffold exists for contracts, frontend, AI service, and docs.
- Public product/technical docs stay in `docs/`; internal working docs stay in `levi/`.
- Smart contracts exist: `TreasuryVault.sol`, `MockYieldVault.sol`.
- AI service exists with `/health`, `/prices`, and `/recommend` endpoints.
- Frontend exists with dashboard components and wallet stack wiring.
- Frontend deposit and approval flows are still simulated in UI and not yet wired to on-chain writes.
- Frontend contract addresses currently default to `"0x"` if env vars are missing.
- Testnet deployment status: TBD
- Verified deployed contract addresses: TBD

# 8. Tech Stack

- Smart contracts: Solidity, Hardhat, OpenZeppelin
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Wallet/Web3: wagmi v2, RainbowKit, viem
- AI service: Python, FastAPI, Pydantic, httpx, web3.py
- Oracle inputs: SUPRA and APRO feeds, with mock fallback expected for demo continuity
- Network target: HashKey Chain testnet

# 9. Key Decisions

- Rule-based AI, not LLM/ML
- Single `TreasuryVault` plus single `MockYieldVault`
- Approval-gated execution instead of autonomous execution
- Mock yield vault is acceptable for MVP
- KYC SBT integration is optional and not core scope

# 10. Constraints

- Hackathon MVP scope; not production-ready treasury infrastructure
- Demo must survive external dependency failure where possible
- Oracle integration may be slower than contract and frontend work
- Testnet reliability can affect demo quality
- Live contract addresses and wallet funding are required before full end-to-end verification

# 11. Open Tasks

- Deploy contracts to HashKey Chain testnet
- Verify contracts on Blockscout
- Set real frontend env vars for treasury, yield vault, and USDC addresses
- Replace simulated deposit flow with real contract write
- Replace simulated approval/execute flow with real contract write
- Confirm oracle path works with live feeds or add explicit mock toggle
- Validate full browser happy path: connect -> deposit -> recommend -> approve -> execute
- Add error handling and loading states where still missing
- KYC SBT integration: TBD

# 12. Next Step

- Finish testnet deployment and wire deployed contract addresses into frontend and AI service env files.
