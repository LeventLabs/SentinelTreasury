"use client";

import { useState } from "react";
import { waitForTransactionReceipt } from "@wagmi/core";
import { useConfig, useReadContract, useWriteContract } from "wagmi";
import {
  KYC_SBT_ABI,
  KYC_SBT_ADDRESS,
  KYC_SBT_CONFIGURED,
} from "@/config/contracts";
import { friendlyError } from "@/utils/errors";

interface Props {
  address: `0x${string}` | undefined;
  onSuccess: () => void;
}

export function RequestKycButton({ address, onSuccess }: Props) {
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHumanQuery = useReadContract({
    address: KYC_SBT_ADDRESS,
    abi: KYC_SBT_ABI,
    functionName: "isHuman",
    args: address ? [address] : undefined,
    query: {
      enabled: KYC_SBT_CONFIGURED && !!address,
      refetchInterval: 10000,
    },
  });

  const feeQuery = useReadContract({
    address: KYC_SBT_ADDRESS,
    abi: KYC_SBT_ABI,
    functionName: "getTotalFee",
    query: { enabled: KYC_SBT_CONFIGURED },
  });

  if (!KYC_SBT_CONFIGURED || !address) return null;
  if (isHumanQuery.data && isHumanQuery.data[0]) return null;

  const handleRequest = async () => {
    if (feeQuery.data === undefined) return;
    setError(null);
    setPending(true);
    try {
      const ensName = `${address.slice(2, 8).toLowerCase()}.sentinel`;
      const hash = await writeContractAsync({
        address: KYC_SBT_ADDRESS,
        abi: KYC_SBT_ABI,
        functionName: "requestKyc",
        args: [ensName],
        value: feeQuery.data,
      });
      await waitForTransactionReceipt(config, { hash });
      await isHumanQuery.refetch();
      onSuccess();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRequest}
        disabled={pending || feeQuery.data === undefined}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-1.5 rounded-lg text-sm font-medium"
      >
        {pending ? "Requesting KYC..." : "Request KYC"}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}
