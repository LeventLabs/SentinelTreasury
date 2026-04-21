"use client";

import { useEffect, useRef, useState } from "react";
import { formatEther, formatUnits } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { keepPreviousData } from "@tanstack/react-query";
import { DepositForm } from "./DepositForm";
import { RecommendationCard } from "./RecommendationCard";
import { ApprovalFlow } from "./ApprovalFlow";
import { KycBadge } from "./KycBadge";
import { RequestKycButton } from "./RequestKycButton";
import {
  CONTRACTS_CONFIGURED,
  KYC_SBT_CONFIGURED,
  TREASURY_ABI,
  TREASURY_ADDRESS,
  USDC_DECIMALS,
  YIELD_VAULT_ABI,
  YIELD_VAULT_ADDRESS,
} from "@/config/contracts";

// HashKey testnet Blockscout + reference ZKID deployment from hashkey-core/design.md §Phase 2 Roadmap.
const EXPLORER_URL = "https://testnet-explorer.hsk.xyz";
const KYC_TIER_PROOF_VERIFIER = "0x3b395F1920fddEB3aB0BCD5a1eab9F4B393c4bbc";

export function Dashboard() {
  const [recommendation, setRecommendation] = useState<any>(null);
  const { address } = useAccount();

  const treasuryQuery = useReadContract({
    address: TREASURY_ADDRESS,
    abi: TREASURY_ABI,
    functionName: "getBalance",
    query: {
      enabled: CONTRACTS_CONFIGURED,
      refetchInterval: 10000,
      placeholderData: keepPreviousData,
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
      placeholderData: keepPreviousData,
    },
  });

  const apyQuery = useReadContract({
    address: YIELD_VAULT_ADDRESS,
    abi: YIELD_VAULT_ABI,
    functionName: "getAPY",
    query: {
      enabled: CONTRACTS_CONFIGURED,
      placeholderData: keepPreviousData,
    },
  });

  const treasuryHskQuery = useBalance({
    address: TREASURY_ADDRESS,
    query: {
      enabled: CONTRACTS_CONFIGURED,
      refetchInterval: 10000,
      placeholderData: keepPreviousData,
    },
  });

  const treasuryBalance = treasuryQuery.data ? Number(formatUnits(treasuryQuery.data, USDC_DECIMALS)) : 0;
  const yieldBalance = yieldQuery.data ? Number(formatUnits(yieldQuery.data, USDC_DECIMALS)) : 0;
  const yieldApy = apyQuery.data ? Number(apyQuery.data) / 100 : 8.0;
  const treasuryHsk = treasuryHskQuery.data ? parseFloat(formatEther(treasuryHskQuery.data.value)) : 0;

  // Staleness invalidation: clear recommendation when balances change.
  // Guarded against transient undefined from useReadContract during account
  // switch — only compare once both queries have settled data.
  const prevBalances = useRef({ treasury: treasuryBalance, yield: yieldBalance });
  useEffect(() => {
    if (treasuryQuery.data === undefined || yieldQuery.data === undefined) return;
    const prev = prevBalances.current;
    if (prev.treasury !== treasuryBalance || prev.yield !== yieldBalance) {
      setRecommendation(null);
    }
    prevBalances.current = { treasury: treasuryBalance, yield: yieldBalance };
  }, [treasuryBalance, yieldBalance, treasuryQuery.data, yieldQuery.data]);

  const refreshBalances = () => {
    treasuryQuery.refetch();
    yieldQuery.refetch();
    treasuryHskQuery.refetch();
    setRecommendation(null);
  };

  return (
    <div className="space-y-6">
      {/* KYC row */}
      <div className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3 border border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300 font-medium">Your KYC status:</span>
          <KycBadge address={address} />
        </div>
        <RequestKycButton address={address} onSuccess={refreshBalances} />
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-300 text-sm font-medium">Treasury Reserve</p>
          <p className="text-2xl font-bold mt-1">${treasuryBalance.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-300 text-sm font-medium">Yield Vault</p>
          <p className="text-2xl font-bold mt-1">${yieldBalance.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-300 text-sm font-medium">Total</p>
          <p className="text-2xl font-bold mt-1">${(treasuryBalance + yieldBalance).toLocaleString()}</p>
        </div>
      </div>

      <p className="text-sm text-gray-300 -mt-3 pl-1">
        <span className="font-medium">Treasury HSK:</span>{" "}
        <span className="font-mono font-semibold text-white">{treasuryHsk.toFixed(3)} HSK</span>
        <span className="ml-2 text-gray-400">(gas reserve for on-chain operations)</span>
      </p>

      {/* Deposit */}
      <DepositForm onDeposit={refreshBalances} />

      {/* AI Recommendation */}
      <RecommendationCard
        treasuryBalance={treasuryBalance}
        yieldBalance={yieldBalance}
        yieldApy={yieldApy}
        treasuryHsk={treasuryHsk}
        onRecommendation={setRecommendation}
      />

      {/* Approve & Execute */}
      {recommendation && recommendation.action !== "hold" && (
        <ApprovalFlow
          recommendation={recommendation}
          onExecuted={refreshBalances}
        />
      )}

      {/* Phase 2 Roadmap — ZKID visibility without shipping ZK code (R21). */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/80 text-sm">
        <p className="font-semibold text-gray-200 mb-2">Phase 2 Roadmap</p>
        <ul className="space-y-1 text-gray-300">
          <li>
            • <span className="font-semibold text-gray-100">Privacy-preserving tier checks</span> — prove operator ≥ ADVANCED without revealing identity (verifier{" "}
            <a
              href={`${EXPLORER_URL}/address/${KYC_TIER_PROOF_VERIFIER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline font-mono text-xs"
            >
              {KYC_TIER_PROOF_VERIFIER.slice(0, 6)}…{KYC_TIER_PROOF_VERIFIER.slice(-4)}
            </a>)
          </li>
          <li>
            • <span className="font-semibold text-gray-100">zkFabric identity reuse</span> — honor KYC attestations from HashKey&apos;s zkFabric Registry, so users don&apos;t re-KYC per app
          </li>
          <li>
            • <span className="font-semibold text-gray-100">Canonical HashKey KYC SBT</span> — drop-in upgrade to the official HashKey identity contract when it ships
          </li>
        </ul>
        {!KYC_SBT_CONFIGURED && (
          <p className="mt-3 text-xs text-gray-400">
            Note: KYC gating is currently disabled (no KYC SBT address configured).
          </p>
        )}
      </div>
    </div>
  );
}
