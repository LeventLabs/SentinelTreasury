# Sentinel Treasury — Build Plan

## Timeline
- **Registration target:** April 15, 2026
- **Final submission target:** before April 23, 2026
- **Build start:** March 17, 2026

## Week 1 (Mar 17–23): Foundation
- [ ] Project scaffold: Hardhat + Next.js + FastAPI
- [ ] Testnet wallet setup, fund via faucet
- [ ] TreasuryVault.sol — deposit, withdraw, approve, payout, allocateToYield
- [ ] MockYieldVault.sol — deposit, withdraw, getAPY
- [ ] Deploy both to HashKey Chain testnet
- [ ] Verify on Blockscout

**Deliverable:** Contracts on testnet, deposit/withdraw working via script.
**Exit criteria:** Contracts are deployed, one funded wallet can deposit and withdraw successfully, and the flow is repeatable from scripts without manual patching.

## Week 2 (Mar 24–30): AI + Oracle
- [ ] Python FastAPI service scaffold
- [ ] SUPRA oracle client — fetch BTC/USD, USDC/USD prices
- [ ] APRO oracle client — fetch HSK/USD price
- [ ] Rule-based recommendation engine (4 scores → allocation)
- [ ] API endpoint: POST /recommend → allocations + reasoning
- [ ] Test with mock data

**Deliverable:** AI service returns recommendations from live oracle data.
**Exit criteria:** `POST /recommend` returns deterministic output for the same input, includes readable reasoning, and still works with mocked oracle data if live feeds fail.

## Week 3 (Mar 31 – Apr 6): Frontend + Flows
- [ ] Next.js app with wagmi + RainbowKit
- [ ] Connect to HashKey Chain testnet
- [ ] Dashboard: treasury balance, yield vault balance
- [ ] Deposit form
- [ ] AI recommendation card (fetch from API)
- [ ] Approve + execute button (calls contract)
- [ ] Payout form (address + amount)

**Deliverable:** End-to-end flow working in browser.
**Exit criteria:** A user can connect a wallet, deposit funds, fetch a recommendation, approve execution, and observe balance changes in the browser.

## Week 4 (Apr 7–13): Polish
- [ ] Explainability panel (scores + reasoning text)
- [ ] Optional: KYC SBT isHuman integration
- [ ] Error handling + loading states
- [ ] UI polish: Tailwind styling, responsive
- [ ] Demo data seeding

**Deliverable:** Polished MVP, all happy paths working.
**Exit criteria:** The core happy path works without manual intervention, the explainability panel is present, and the demo can survive one failed external dependency through fallback data.

## Week 5 (Apr 14–20): Submit
- [ ] Demo script rehearsal (3x)
- [ ] Screen recording + voiceover
- [ ] DoraHacks submission
- [ ] README + architecture diagram
- [ ] GitHub repo cleanup

**Deliverable:** Submitted on DoraHacks.
**Exit criteria:** Submission copy is final, the recorded demo matches the live product flow, and all public links are valid before publishing.
