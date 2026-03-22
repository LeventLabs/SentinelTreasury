"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { DepositForm } from "./DepositForm";
import { RecommendationCard } from "./RecommendationCard";
import { ApprovalFlow } from "./ApprovalFlow";
import {
  CONTRACTS_CONFIGURED,
  TREASURY_ABI,
  TREASURY_ADDRESS,
  USDC_DECIMALS,
  YIELD_VAULT_ABI,
  YIELD_VAULT_ADDRESS,
} from "@/config/contracts";

export function Dashboard() {
  const [recommendation, setRecommendation] = useState<any>(null);

  const treasuryQuery = useReadContract({
    address: TREASURY_ADDRESS,
    abi: TREASURY_ABI,
    functionName: "getBalance",
    query: {
      enabled: CONTRACTS_CONFIGURED,
      refetchInterval: 10000,
    },
  });

  const yieldQuery = useReadContract({
    address: YIELD_VAULT_ADDRESS,
    abi: YIELD_VAULT_ABI,
    functionName: "getBalance",
    args: [TREASURY_ADDRESS],
    query: {
      enabled: CONTRACTS_CONFIGURED,
      refetchInterval: 10000,
    },
  });

  const treasuryBalance = treasuryQuery.data ? Number(formatUnits(treasuryQuery.data, USDC_DECIMALS)) : 0;
  const yieldBalance = yieldQuery.data ? Number(formatUnits(yieldQuery.data, USDC_DECIMALS)) : 0;

  const refreshBalances = () => {
    treasuryQuery.refetch();
    yieldQuery.refetch();
    setRecommendation(null);
  };

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
      <DepositForm onDeposit={refreshBalances} />

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
          onExecuted={refreshBalances}
        />
      )}
    </div>
  );
}
