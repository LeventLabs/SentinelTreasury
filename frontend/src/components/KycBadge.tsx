"use client";

import { useReadContract } from "wagmi";
import { KYC_SBT_ABI, KYC_SBT_ADDRESS, KYC_SBT_CONFIGURED } from "@/config/contracts";

interface Props {
  address: `0x${string}` | undefined;
}

// Tier index matches IKycSBT.KycLevel: NONE=0, BASIC=1, ADVANCED=2, PREMIUM=3, ULTIMATE=4
const TIER_STYLES: Record<number, { label: string; className: string }> = {
  0: { label: "No KYC", className: "bg-gray-800 text-gray-400 border-gray-700" },
  1: { label: "BASIC", className: "bg-blue-900/60 text-blue-300 border-blue-700" },
  2: { label: "ADVANCED", className: "bg-green-900/60 text-green-300 border-green-700" },
  3: { label: "PREMIUM", className: "bg-purple-900/60 text-purple-300 border-purple-700" },
  4: { label: "ULTIMATE", className: "bg-yellow-900/60 text-yellow-300 border-yellow-700" },
};

export function KycBadge({ address }: Props) {
  const { data } = useReadContract({
    address: KYC_SBT_ADDRESS,
    abi: KYC_SBT_ABI,
    functionName: "isHuman",
    args: address ? [address] : undefined,
    query: {
      enabled: KYC_SBT_CONFIGURED && !!address,
      refetchInterval: 10000,
    },
  });

  if (!KYC_SBT_CONFIGURED) {
    return <span className="text-xs text-gray-500">KYC gating disabled</span>;
  }

  const tier = data && data[0] ? Number(data[1]) : 0;
  const style = TIER_STYLES[tier] ?? TIER_STYLES[0];

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase border ${style.className}`}>
      {style.label}
    </span>
  );
}
