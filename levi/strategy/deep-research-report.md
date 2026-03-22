# On-Chain Horizon Hackathon Research Report

## Verified Event Snapshot

Based on the live HashFans portal and the metadata embedded in its production app bundle, the active hackathon linked from `https://hashfans.io/` is:

- **Event:** On-Chain Horizon Hackathon
- **Dates:** **March 10 to April 23, 2026**
- **Status:** Live
- **Prize Pool:** **40,000 USDT**
- **Location:** **Online + Hong Kong**
- **Focus Tags:** **AI, PayFi, DeFi, ZKID**
- **Application Link:** `https://dorahacks.io/hackathon/2045/detail`

The DoraHacks page itself is currently protected by a human-verification gate, but HashFans points directly to that URL as the official application page and exposes the hackathon metadata in its frontend bundle.

## What HashFans Is Positioning

HashFans presents itself as **HashKey Group's official developer portal** and frames the ecosystem as a place to:

- build **compliant, scalable Web3 applications**
- build on **HashKey Chain**
- use the **HSK token ecosystem**
- access docs, hackathons, ecosystem tools, staking, and explorer links from one entry point

The homepage also markets the developer community as being trusted by **2000+ developers** and explicitly uses the hackathon funnel as a primary call to action.

## Strategic Read

This hackathon is not broad and generic. The track mix is quite specific:

- **AI** implies autonomous agents, intelligence layers, analytics, and workflow automation.
- **PayFi** implies payment rails, merchant flows, streaming payments, treasury automation, settlement UX, and stablecoin-style utility.
- **DeFi** implies liquidity, lending, vaults, structured products, and on-chain capital efficiency.
- **ZKID** implies identity, compliance proofs, attestations, sybil resistance, and privacy-preserving access control.

That combination strongly suggests the highest-scoring ideas will not be pure consumer AI demos. The stronger direction is a product where **AI drives decisions**, **payments or financial actions settle on-chain**, and **identity/compliance is handled with privacy-preserving controls**.

## Best Project Directions

### 1. AI Treasury Copilot for On-Chain Businesses

An agentic treasury layer for merchants, DAOs, or crypto-native teams on HashKey Chain.

- AI monitors inflows, burn, and liabilities.
- PayFi rails handle payroll, vendor payouts, and programmable settlement.
- DeFi modules route idle balances into conservative yield strategies.
- ZKID gates who can approve, receive, or access treasury actions without exposing full identity data on-chain.

Why it fits:

- touches all four tags cleanly
- has immediate business value
- can be demoed clearly in a hackathon setting

### 2. ZK-Gated Credit Marketplace

A lending protocol where borrowers prove attributes without revealing full identity.

- users submit zk-based proofs for eligibility, jurisdiction, or reputation
- AI risk models price loans dynamically
- DeFi contracts issue and manage loans
- PayFi flows support repayment schedules, auto-debit logic, or invoice-linked financing

Why it fits:

- combines DeFi + ZKID in a nontrivial way
- AI has a real underwriting role
- compliance/privacy angle is stronger than standard overcollateralized lending

### 3. Agent Wallet for Subscription and Usage Payments

A wallet and settlement layer for autonomous services or apps.

- AI agents decide when to buy data, APIs, compute, or human services
- PayFi supports micro-payments, recurring payments, and usage-based settlement
- DeFi vaults optimize idle balance management
- ZKID verifies service providers or enterprise counterparties

Why it fits:

- strong PayFi story
- easy to demo with live agent actions
- aligns with the "on-chain applications" framing from the hackathon description

### 4. Compliance-First RWA Yield Gateway

A gateway that routes verified users into regulated or semi-permissioned yield strategies.

- AI recommends portfolios based on risk profile and market conditions
- DeFi executes vault allocations
- ZKID proves investor eligibility or regional constraints
- PayFi handles deposits, withdrawals, and reporting-oriented payment flows

Why it fits:

- well aligned with HashKey's compliance-oriented positioning
- more differentiated than a generic yield aggregator
- attractive if judges care about institutional relevance

## Recommended Direction

The strongest hackathon candidate is:

**AI Treasury Copilot for On-Chain Businesses**

Reason:

- easiest to explain in one sentence
- covers **AI + PayFi + DeFi + ZKID** without forcing the architecture
- can show immediate value to startups, protocols, and merchants
- supports a polished demo: treasury dashboard, AI action suggestions, zk-gated approvals, and on-chain settlement

## MVP Scope for a Winning Demo

Keep the prototype narrow. A strong MVP should do only a few things, but do them end-to-end:

1. User connects wallet and creates a treasury workspace.
2. Team member proves role or access through a lightweight identity/attestation flow.
3. AI analyzes balances and proposes an action such as:
   - pay suppliers
   - rebalance idle assets
   - move funds into a low-risk yield vault
4. User approves the action.
5. Smart contracts execute the transaction on-chain.
6. Dashboard shows before/after balances, rationale, and transaction history.

## Judging Advantage

Projects in this hackathon are more likely to stand out if they demonstrate:

- a clear business user, not just a technical feature
- working on-chain flow, not only UI mockups
- a real reason for AI to exist in the product
- a real reason for ZK identity to exist in the product
- a credible PayFi use case rather than a vague payments mention

The common weak submission will be "AI + DeFi dashboard." The stronger submission will be "AI-powered financial workflow that executes safely and compliantly on-chain."

## Risks to Avoid

- Do not build a generic chatbot for crypto education.
- Do not build a standard DEX, lending fork, or wallet without a differentiated workflow layer.
- Do not claim ZK identity if the product only has wallet login.
- Do not spread the MVP across too many tracks without a coherent core action.

## Practical Build Stack

A reasonable hackathon stack would be:

- **Frontend:** Next.js or Vite
- **Wallet/Auth:** wagmi / RainbowKit or equivalent
- **Contracts:** Solidity on HashKey Chain-compatible EVM flow
- **Indexing/Data:** explorer APIs or lightweight event reads
- **AI Layer:** off-chain agent service for recommendation logic
- **Identity Layer:** attestation-based access flow with a minimal zk-proof or privacy-preserving eligibility model

## Source Notes

Verified directly from `https://hashfans.io/` and its production frontend:

- HashFans brands itself as HashKey Group's official developer portal.
- The portal states builders can create compliant, scalable Web3 applications on HashKey Chain using HSK.
- The active hackathon listing is **On-Chain Horizon Hackathon** with dates **March 10 to April 23, 2026**, **40,000 USDT** prize pool, **Online + Hong Kong**, and tags **AI / PayFi / DeFi / ZKID**.
- The official application target is `https://dorahacks.io/hackathon/2045/detail`.

Limitation:

- The DoraHacks detail page was behind a human-verification screen during this research session, so event specifics above were taken from the HashFans site and its shipped app metadata rather than from the DoraHacks page body.
