"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  treasuryBalance: number;
  yieldBalance: number;
  yieldApy: number;
  onRecommendation: (rec: any) => void;
}

export function RecommendationCard({ treasuryBalance, yieldBalance, yieldApy, onRecommendation }: Props) {
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<any>(null);
  const [pendingPayouts, setPendingPayouts] = useState("200");

  // Clear local recommendation when balances change (staleness)
  const prevBalances = useRef({ treasury: treasuryBalance, yield: yieldBalance });
  useEffect(() => {
    const prev = prevBalances.current;
    if (prev.treasury !== treasuryBalance || prev.yield !== yieldBalance) {
      setRec(null);
    }
    prevBalances.current = { treasury: treasuryBalance, yield: yieldBalance };
  }, [treasuryBalance, yieldBalance]);

  const fetchRecommendation = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treasury_balance: treasuryBalance,
          yield_balance: yieldBalance,
          yield_apy: yieldApy,
          pending_payouts: parseFloat(pendingPayouts) || 0,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      setRec(data);
      onRecommendation(data);
    } catch {
      setRec({ action: "error", reasoning: "Failed to reach AI service." });
      onRecommendation(null);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">AI Recommendation</h2>
        <button
          onClick={fetchRecommendation}
          disabled={loading || treasuryBalance === 0}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-1.5 rounded-lg text-sm font-medium"
        >
          {loading ? "Analyzing..." : "Get Recommendation"}
        </button>
      </div>

      {/* Pending Payouts Input */}
      <div className="mb-3">
        <label className="text-xs text-gray-500">Pending Payouts (USDC)</label>
        <input
          type="number"
          value={pendingPayouts}
          onChange={(e) => setPendingPayouts(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm mt-1"
        />
      </div>

      {rec && (
        <div className="space-y-3">
          {/* Action */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
              rec.action === "allocate_to_yield" ? "bg-green-900 text-green-300" :
              rec.action === "withdraw_from_yield" ? "bg-red-900 text-red-300" :
              "bg-gray-800 text-gray-400"
            }`}>
              {rec.action}
            </span>
            {rec.amount_abs > 0 && <span className="text-sm text-gray-300">${rec.amount_abs}</span>}
          </div>

          {/* Reasoning */}
          <p className="text-sm text-gray-300 bg-gray-800 rounded-lg p-3">{rec.reasoning}</p>

          {/* Data source indicator */}
          {rec.data_source === "fallback" && (
            <p className="text-xs text-yellow-400">⚠ Using fallback oracle data</p>
          )}

          {/* Scores */}
          {rec.scores && (
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(rec.scores).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-xs text-gray-500 capitalize">{key.replace("_", " ")}</div>
                  <div className={`text-lg font-bold ${
                    (val as number) >= 70 ? "text-green-400" : (val as number) >= 40 ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {val as number}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
