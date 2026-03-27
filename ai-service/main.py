from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from recommender import recommend
from oracle import get_prices

app = FastAPI(title="Sentinel Treasury AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TreasuryState(BaseModel):
    treasury_balance: float
    yield_balance: float
    yield_apy: float  # e.g. 8.0
    pending_payouts: float  # upcoming obligations


class Recommendation(BaseModel):
    action: str
    amount_pct: int
    amount_abs: float
    reasoning: str
    scores: dict
    data_source: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/prices")
async def prices():
    return await get_prices()


@app.post("/recommend", response_model=Recommendation)
async def get_recommendation(state: TreasuryState):
    prices = await get_prices()
    return recommend(state, prices)
