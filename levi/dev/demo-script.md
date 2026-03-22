# Sentinel Treasury - Demo Script

## Goal
Show that Sentinel Treasury can accept treasury capital, generate an explainable recommendation, and execute a policy-gated on-chain action.

## Demo Length
Target: 2.5 to 4 minutes

## Setup Before Recording
- Frontend deployed and connected to HashKey Chain testnet
- Treasury and mock yield vault contracts deployed
- Demo wallet funded
- Treasury starts empty or with a known balance
- AI service running
- Oracle path verified, with fallback mock values ready

## Live Demo Sequence
1. Open dashboard and show current treasury state
2. Connect wallet
3. Deposit `1000 USDC` into the treasury
4. Show updated treasury balance on the dashboard
5. Trigger AI recommendation
6. Read the recommendation aloud:
   - example: "Allocate 40% to yield, keep 60% in reserve"
7. Open explainability panel
8. Point to the scores:
   - yield
   - liquidity
   - risk
   - payout reserve
9. Approve and execute the recommendation
10. Show updated balances:
    - treasury reserve decreased
    - yield vault balance increased
11. Trigger a payout flow to an external address
12. Show final balances and explain that reserve protection was part of the recommendation logic

## Talk Track
- "Most on-chain treasuries still move capital manually."
- "Sentinel Treasury watches balances, market data, and payout needs."
- "It does not just automate. It explains why an action should happen."
- "Execution is policy-gated, so the final action remains under authorized control."

## What Judges Should Understand
- This is not a generic chatbot
- The recommendation is deterministic and explainable
- The product combines AI, treasury ops, and compliance-aware execution
- HashKey Chain is relevant because of identity, policy, and finance-oriented positioning

## Backup Demo Path
- Use seeded mock balances if faucet or testnet latency is a problem
- Switch oracle responses to mocked values if external feeds fail
- If payout flow is unstable, prioritize the allocation flow as the main proof point

## Success Criteria
- A deposit succeeds on-chain
- A recommendation is generated with readable reasoning
- An authorized action is executed on-chain
- Before/after balances visibly change in the UI
