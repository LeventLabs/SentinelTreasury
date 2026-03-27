import os
import httpx
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL", "https://testnet.hsk.xyz")

# Minimal ABI for APRO price feed (Chainlink-compatible)
APRO_ABI_FRAGMENT = {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
        {"name": "roundId", "type": "uint80"},
        {"name": "answer", "type": "int256"},
        {"name": "startedAt", "type": "uint256"},
        {"name": "updatedAt", "type": "uint256"},
        {"name": "answeredInRound", "type": "uint80"},
    ],
    "stateMutability": "view",
    "type": "function",
}

# latestRoundData() selector
SELECTOR = "0xfeaf968c"

FEEDS = {
    "BTC_USD": os.getenv("APRO_BTC_USD", "0x64697A6Abb508079687465FA9EF99D2Da955D791"),
    "USDC_USD": os.getenv("APRO_USDC_USD", "0xCdB10dC9dB30B6ef2a63aB4460263655808fAE27"),
}


async def _call_feed(address: str) -> float | None:
    """Call latestRoundData on an APRO price feed via raw JSON-RPC."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [{"to": address, "data": SELECTOR}, "latest"],
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(RPC_URL, json=payload)
            result = resp.json().get("result", "0x")
            if result == "0x" or len(result) < 66:
                return None
            # answer is the second 32-byte word (offset 64..128 hex chars after 0x)
            answer_hex = result[2 + 64 : 2 + 128]
            answer = int(answer_hex, 16)
            # APRO feeds use 8 decimals
            return answer / 1e8
    except Exception:
        return None


async def get_prices() -> dict:
    """Fetch latest prices from oracle feeds. Falls back to defaults on error."""
    prices = {}
    used_fallback = False
    for name, address in FEEDS.items():
        price = await _call_feed(address)
        prices[name] = price

    # Fallback defaults for demo if oracle is unreachable
    if prices.get("BTC_USD") is None:
        prices["BTC_USD"] = 85000.0
        used_fallback = True
    if prices.get("USDC_USD") is None:
        prices["USDC_USD"] = 1.0
        used_fallback = True

    prices["data_source"] = "fallback" if used_fallback else "live"
    return prices
