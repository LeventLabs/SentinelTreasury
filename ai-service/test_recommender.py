"""Tests for the Sentinel Treasury recommendation engine."""
import pytest
from types import SimpleNamespace
from recommender import recommend, _yield_score, _liquidity_score, _risk_score, _payout_score


def state(treasury=0, yield_bal=0, apy=8.0, pending=200):
    return SimpleNamespace(
        treasury_balance=treasury,
        yield_balance=yield_bal,
        yield_apy=apy,
        pending_payouts=pending,
    )


LIVE = {"BTC_USD": 67000.0, "USDC_USD": 1.0, "data_source": "live"}


# ── Scoring functions ──────────────────────────────────────────────


class TestYieldScore:
    def test_zero_apy(self):
        assert _yield_score(0) == 0

    def test_negative_apy(self):
        assert _yield_score(-5) == 0

    def test_normal_apy(self):
        assert _yield_score(8.0) == 80

    def test_low_apy(self):
        assert _yield_score(5.0) == 50

    def test_capped_at_100(self):
        assert _yield_score(12.0) == 100


class TestLiquidityScore:
    def test_zero_total(self):
        assert _liquidity_score(0, 0) == 0

    def test_all_liquid(self):
        assert _liquidity_score(1000, 1000) == 100

    def test_half_liquid(self):
        assert _liquidity_score(500, 1000) == 50

    def test_low_liquidity(self):
        assert _liquidity_score(300, 1000) == 30


class TestRiskScore:
    def test_stable(self):
        assert _risk_score({"USDC_USD": 1.0}) == 85

    def test_minor_depeg(self):
        assert _risk_score({"USDC_USD": 0.994}) == 50

    def test_major_depeg_low(self):
        assert _risk_score({"USDC_USD": 0.97}) == 10

    def test_major_depeg_high(self):
        assert _risk_score({"USDC_USD": 1.03}) == 10

    def test_missing_defaults_stable(self):
        assert _risk_score({}) == 85


class TestPayoutScore:
    def test_no_pending(self):
        assert _payout_score(1000, 0) == 100

    def test_negative_pending(self):
        assert _payout_score(1000, -1) == 100

    def test_ratio_gte_3(self):
        assert _payout_score(1000, 200) == 95

    def test_ratio_gte_1_5(self):
        assert _payout_score(300, 200) == 70

    def test_ratio_gte_1(self):
        assert _payout_score(200, 200) == 40

    def test_underfunded(self):
        assert _payout_score(100, 200) == 10


# ── Decision logic branches ───────────────────────────────────────


class TestDecisionLogic:
    def test_zero_total_assets(self):
        r = recommend(state(treasury=0, yield_bal=0), LIVE)
        assert r["action"] == "hold"
        assert r["reasoning"] == "No funds in treasury."
        assert r["scores"] == {"yield": 0, "liquidity": 0, "risk": 0, "payout_reserve": 0}

    def test_payout_reserve_below_40(self):
        # treasury=100, pending=200 → ratio=0.5 → payout_score=10
        r = recommend(state(treasury=100, pending=200), LIVE)
        assert r["action"] == "hold"
        assert r["reasoning"] == "Payout obligations require full reserve."
        assert r["scores"]["payout_reserve"] == 10

    def test_high_risk_with_yield_balance(self):
        prices = {"USDC_USD": 0.97, "data_source": "live"}
        r = recommend(state(treasury=1000, yield_bal=500, pending=200), prices)
        assert r["action"] == "withdraw_from_yield"
        assert r["amount_pct"] == 100
        assert r["amount_abs"] == 500.0
        assert r["scores"]["risk"] == 10

    def test_high_risk_no_yield_balance(self):
        prices = {"USDC_USD": 0.97, "data_source": "live"}
        r = recommend(state(treasury=1000, yield_bal=0, pending=200), prices)
        assert r["action"] == "hold"
        assert r["reasoning"] == "Market risk elevated, holding in reserve."
        assert r["scores"]["risk"] == 10

    def test_allocate_happy_path(self):
        r = recommend(state(treasury=1000, yield_bal=0, apy=8.0, pending=200), LIVE)
        assert r["action"] == "allocate_to_yield"
        assert r["amount_pct"] == 60
        assert r["amount_abs"] == 600.0
        assert r["scores"] == {"yield": 80, "liquidity": 100, "risk": 85, "payout_reserve": 95}

    def test_hold_insufficient_allocatable(self):
        # treasury=249, pending=200 → payout_score=40 (not <40)
        # reserve_needed = max(240, 74.7) = 240
        # max_allocatable = 9 < 10 → hold
        r = recommend(state(treasury=249, yield_bal=0, apy=8.0, pending=200), LIVE)
        assert r["action"] == "hold"
        assert r["reasoning"] == "Yield attractive but insufficient allocatable balance after reserves."

    def test_generic_hold(self):
        # yield_score=50 (not > 60) → falls through
        r = recommend(state(treasury=1000, yield_bal=0, apy=5.0, pending=200), LIVE)
        assert r["action"] == "hold"
        assert r["reasoning"] == "Conditions do not favor reallocation at this time."


# ── Determinism ────────────────────────────────────────────────────


class TestDeterminism:
    def test_identical_inputs_identical_outputs(self):
        s = state(treasury=1000, yield_bal=0, apy=8.0, pending=200)
        r1 = recommend(s, LIVE)
        r2 = recommend(s, LIVE)
        assert r1 == r2


# ── data_source propagation ───────────────────────────────────────


class TestDataSource:
    def test_live_propagated(self):
        r = recommend(state(treasury=1000, pending=200), LIVE)
        assert r["data_source"] == "live"

    def test_fallback_propagated(self):
        prices = {"USDC_USD": 1.0, "data_source": "fallback"}
        r = recommend(state(treasury=1000, pending=200), prices)
        assert r["data_source"] == "fallback"

    def test_missing_defaults_to_fallback(self):
        prices = {"USDC_USD": 1.0}
        r = recommend(state(treasury=1000, pending=200), prices)
        assert r["data_source"] == "fallback"

    def test_empty_treasury_propagates(self):
        r = recommend(state(treasury=0, yield_bal=0), LIVE)
        assert r["data_source"] == "live"
