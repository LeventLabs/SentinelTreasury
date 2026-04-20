"""
Rule-based AI recommendation engine for Sentinel Treasury.
No ML — deterministic scoring with explainable output.
"""


def recommend(state, prices: dict) -> dict:
    total = state.treasury_balance + state.yield_balance
    data_source = prices.get("data_source", "fallback")
    hsk_balance = getattr(state, "treasury_hsk_balance", 1.0)
    if total == 0:
        return _empty("No funds in treasury.", data_source, hsk_balance)

    # --- Score calculation ---
    yield_score = _yield_score(state.yield_apy)
    liquidity_score = _liquidity_score(state.treasury_balance, total)
    risk_score = _risk_score(prices)
    payout_score = _payout_score(state.treasury_balance, state.pending_payouts)
    gas_score = gas_reserve_score(hsk_balance)

    scores = {
        "yield": yield_score,
        "liquidity": liquidity_score,
        "risk": risk_score,
        "payout_reserve": payout_score,
        "gas_reserve": gas_score,
    }

    # --- Decision logic ---
    # High yield + low risk + low payout pressure = allocate more
    # Low yield + high risk + high payout pressure = keep in reserve

    if gas_score < 30:
        return _hold(state, scores, "Gas reserve too low for further operations; top up HSK on the treasury.", data_source)

    if payout_score < 40:
        return _hold(state, scores, "Payout obligations require full reserve.", data_source)

    if risk_score < 30:
        if state.yield_balance > 0:
            return _withdraw_from_yield(state, scores, "Market risk elevated, reducing yield exposure.", data_source)
        return _hold(state, scores, "Market risk elevated, holding in reserve.", data_source)

    if yield_score > 60 and liquidity_score > 50:
        alloc_pct = min(60, max(20, yield_score - 20))
        reserve_needed = max(state.pending_payouts * 1.2, total * 0.3)
        max_allocatable = max(0, state.treasury_balance - reserve_needed)
        alloc_amount = min(state.treasury_balance * alloc_pct / 100, max_allocatable)

        if alloc_amount < 10:
            return _hold(state, scores, "Yield attractive but insufficient allocatable balance after reserves.", data_source)

        pct = int(alloc_amount / state.treasury_balance * 100)
        reasoning = (
            f"Move {pct}% to Yield Vault (APY {state.yield_apy}%). "
            f"Keep {100 - pct}% in Reserve. "
            f"Payout reserve of {state.pending_payouts:.0f} is covered. "
            f"Risk level acceptable."
        )
        return {
            "action": "allocate_to_yield",
            "amount_pct": pct,
            "amount_abs": round(alloc_amount, 2),
            "reasoning": reasoning,
            "scores": scores,
            "data_source": data_source,
        }

    return _hold(state, scores, "Conditions do not favor reallocation at this time.", data_source)


def _yield_score(apy: float) -> int:
    """0-100. Higher APY = higher score."""
    if apy <= 0:
        return 0
    return min(100, int(apy * 10))


def _liquidity_score(treasury_balance: float, total: float) -> int:
    """0-100. Higher ratio of liquid funds = higher score."""
    if total == 0:
        return 0
    ratio = treasury_balance / total
    return min(100, int(ratio * 100))


def _risk_score(prices: dict) -> int:
    """0-100. Higher = safer. Simple heuristic based on USDC peg."""
    usdc = prices.get("USDC_USD", 1.0)
    # If USDC depegs, risk is high
    depeg = abs(usdc - 1.0)
    if depeg > 0.02:
        return 10  # high risk
    if depeg > 0.005:
        return 50
    return 85  # stable


def _payout_score(treasury_balance: float, pending: float) -> int:
    """0-100. Higher = more comfortable payout coverage."""
    if pending <= 0:
        return 100
    ratio = treasury_balance / pending
    if ratio >= 3:
        return 95
    if ratio >= 1.5:
        return 70
    if ratio >= 1:
        return 40
    return 10  # underfunded


def gas_reserve_score(hsk_balance: float) -> int:
    """0-100. Higher = more HSK runway for future on-chain operations."""
    if hsk_balance >= 1.0:
        return 95
    if hsk_balance >= 0.2:
        return 70
    if hsk_balance >= 0.05:
        return 40
    if hsk_balance >= 0.01:
        return 20
    return 5


def _hold(state, scores, reason, data_source):
    return {
        "action": "hold",
        "amount_pct": 0,
        "amount_abs": 0,
        "reasoning": reason,
        "scores": scores,
        "data_source": data_source,
    }


def _withdraw_from_yield(state, scores, reason, data_source):
    return {
        "action": "withdraw_from_yield",
        "amount_pct": 100,
        "amount_abs": round(state.yield_balance, 2),
        "reasoning": reason,
        "scores": scores,
        "data_source": data_source,
    }


def _empty(reason, data_source, hsk_balance=0.0):
    return {
        "action": "hold",
        "amount_pct": 0,
        "amount_abs": 0,
        "reasoning": reason,
        "scores": {
            "yield": 0,
            "liquidity": 0,
            "risk": 0,
            "payout_reserve": 0,
            "gas_reserve": gas_reserve_score(hsk_balance),
        },
        "data_source": data_source,
    }
