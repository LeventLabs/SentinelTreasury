# Sentinel Treasury — MVP Definition

## Locked Feature Set

| # | Feature | Description | Track |
|---|---------|-------------|-------|
| F1 | Wallet connect | wagmi + RainbowKit, HashKey Chain testnet | — |
| F2 | Treasury deposit/withdraw | Single TreasuryVault contract, USDC | DeFi |
| F3 | Mock yield vault | Single MockYieldVault, simulated 8% APY | DeFi |
| F4 | AI recommendation engine | Rule-based: oracle + balance + risk → suggestion + reasoning | AI |
| F5 | Approve and execute | Simple approve mapping, authorized caller confirms | AI |
| F6 | Payout flow | Treasury → external address transfer | PayFi |
| F7 | Explainability panel | AI reasoning: yield score, liquidity, risk, payout reserve | AI |
| F8 | Optional KYC gate | HashKey KYC SBT isHuman — bonus, not blocker | ZKID |

## Explicitly Cut
- ~~3 separate ERC-4626 vaults~~ → 1 TreasuryVault + 1 MockYieldVault
- ~~Real multisig contract~~ → simple approve mapping
- ~~Historical performance charts~~
- ~~Notification system~~
- ~~Complex role matrix~~
- ~~ML/LLM-based AI~~ → rule-based deterministic engine

## AI Logic

**Inputs:**
- Oracle price feeds (APRO): BTC/USD, USDC/USD
- Treasury vault balance
- Yield vault balance + APY
- Pending payout obligations (manual input or mock)

**Scoring:**
- `yield_score`: is yield vault APY attractive vs risk?
- `liquidity_score`: enough liquid capital for operations?
- `risk_score`: market volatility signal from oracle
- `payout_reserve_score`: upcoming obligations covered?

**Output:**
```json
{
  "action": "allocate_to_yield",
  "amount_pct": 40,
  "reasoning": "Move 40% to Yield Vault, keep 60% in Reserve because payout obligation is due and volatility threshold is elevated.",
  "scores": { "yield": 72, "liquidity": 85, "risk": 45, "payout_reserve": 90 }
}
```

## Demo Flow
1. User connects wallet
2. Deposits 1000 USDC into Treasury
3. AI detects idle capital
4. Recommends: 40% yield, 60% reserve
5. Approver confirms
6. Funds move on-chain
7. Dashboard shows reasoning panel
