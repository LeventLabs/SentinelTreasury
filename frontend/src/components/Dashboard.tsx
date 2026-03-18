"use client";

import { useState } from "react";
import { DepositForm } from "./DepositForm";
import { RecommendationCard } from "./RecommendationCard";
import { ApprovalFlow } from "./ApprovalFlow";

export function Dashboard() {
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [yieldBalance, setYieldBalance] = useState(0);
  const [recommendation, setRecommendation] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-400 text-sm">Treasury Reserve</p>
          <p className="text-2xl font-bold mt-1">${treasuryBalance.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-400 text-sm">Yield Vault</p>
          <p className="text-2xl font-bold mt-1">${yieldBalance.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold mt-1">${(treasuryBalance + yieldBalance).toLocaleString()}</p>
        </div>
      </div>

      {/* Deposit */}
      <DepositForm onDeposit={(amount) => setTreasuryBalance((b) => b + amount)} />

      {/* AI Recommendation */}
      <RecommendationCard
        treasuryBalance={treasuryBalance}
        yieldBalance={yieldBalance}
        onRecommendation={setRecommendation}
      />

      {/* Approve & Execute */}
      {recommendation && recommendation.action !== "hold" && (
        <ApprovalFlow
          recommendation={recommendation}
          onExecuted={() => {
            if (recommendation.action === "allocate_to_yield") {
              setTreasuryBalance((b) => b - recommendation.amount_abs);
              setYieldBalance((b) => b + recommendation.amount_abs);
            }
            setRecommendation(null);
          }}
        />
      )}
    </div>
  );
}
