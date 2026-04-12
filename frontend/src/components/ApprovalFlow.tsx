"use client";

import { useState } from "react";
import { waitForTransactionReceipt } from "@wagmi/core";
import { parseUnits } from "viem";
import { useConfig, useWriteContract } from "wagmi";
import {
  CONTRACTS_CONFIGURED,
  TREASURY_ABI,
  TREASURY_ADDRESS,
  USDC_DECIMALS,
} from "@/config/contracts";
import { friendlyError } from "@/utils/errors";

interface Props {
  recommendation: any;
  onExecuted: () => void;
}

export function ApprovalFlow({ recommendation, onExecuted }: Props) {
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<"pending" | "approved" | "executing" | "done">("pending");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!CONTRACTS_CONFIGURED) return;

    try {
      setError(null);
      setStatus("approved");
      setStatus("executing");

      const amountUnits = parseUnits(String(recommendation.amount_abs ?? 0), USDC_DECIMALS);

      let hash: `0x${string}`;
      if (recommendation.action === "allocate_to_yield") {
        hash = await writeContractAsync({
          address: TREASURY_ADDRESS,
          abi: TREASURY_ABI,
          functionName: "allocateToYield",
          args: [amountUnits],
        });
      } else if (recommendation.action === "withdraw_from_yield") {
        hash = await writeContractAsync({
          address: TREASURY_ADDRESS,
          abi: TREASURY_ABI,
          functionName: "withdrawFromYield",
          args: [amountUnits],
        });
      } else {
        throw new Error(`Unsupported action: ${recommendation.action}`);
      }

      await waitForTransactionReceipt(config, { hash });
      setStatus("done");
      setTimeout(onExecuted, 1000);
    } catch (err) {
      setError(friendlyError(err));
      setStatus("pending");
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-yellow-800">
      <h2 className="font-semibold mb-3 text-yellow-400">⚡ Action Required</h2>
      <p className="text-sm text-gray-300 mb-4">
        AI recommends: <strong>{recommendation.action}</strong> — ${recommendation.amount_abs}
      </p>

      {status === "pending" && (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={!CONTRACTS_CONFIGURED}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium"
          >
            Approve & Execute
          </button>
          <button
            onClick={onExecuted}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-medium"
          >
            Reject
          </button>
        </div>
      )}

      {status === "executing" && <p className="text-yellow-400 text-sm">Executing on-chain...</p>}
      {status === "done" && <p className="text-green-400 text-sm">✓ Transaction confirmed</p>}
      {!CONTRACTS_CONFIGURED && (
        <p className="text-xs text-yellow-400 mt-3">
          Set treasury, yield vault, and USDC addresses in frontend env before execution.
        </p>
      )}
      {error && <p className="text-xs text-red-400 mt-3 break-words">{error}</p>}
    </div>
  );
}
