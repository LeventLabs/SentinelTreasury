"use client";

import { useState } from "react";
import { waitForTransactionReceipt } from "@wagmi/core";
import { parseUnits } from "viem";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import {
  CONTRACTS_CONFIGURED,
  ERC20_ABI,
  TREASURY_ABI,
  TREASURY_ADDRESS,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/config/contracts";
import { friendlyError } from "@/utils/errors";

interface Props {
  onDeposit: () => void;
}

export function DepositForm({ onDeposit }: Props) {
  const { isConnected } = useAccount();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<"idle" | "approving" | "depositing">("idle");
  const [error, setError] = useState<string | null>(null);

  const loading = phase !== "idle";

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !isConnected || !CONTRACTS_CONFIGURED) return;

    try {
      setError(null);
      const amountUnits = parseUnits(amount, USDC_DECIMALS);

      setPhase("approving");
      const approveHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [TREASURY_ADDRESS, amountUnits],
      });
      await waitForTransactionReceipt(config, { hash: approveHash });

      setPhase("depositing");
      const depositHash = await writeContractAsync({
        address: TREASURY_ADDRESS,
        abi: TREASURY_ABI,
        functionName: "deposit",
        args: [amountUnits],
      });
      await waitForTransactionReceipt(config, { hash: depositHash });

      setAmount("");
      onDeposit();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setPhase("idle");
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="font-semibold mb-3">Deposit to Treasury</h2>
      <div className="flex gap-3">
        <input
          type="number"
          placeholder="Amount (USDC)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        />
        <button
          onClick={handleDeposit}
          disabled={loading || !isConnected || !CONTRACTS_CONFIGURED}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg font-medium"
        >
          {phase === "approving" ? "Approving..." : phase === "depositing" ? "Depositing..." : "Deposit"}
        </button>
      </div>

      {!CONTRACTS_CONFIGURED && (
        <p className="text-xs text-yellow-400 mt-3">
          Set treasury, yield vault, and USDC addresses in frontend env before depositing.
        </p>
      )}

      {error && <p className="text-xs text-red-400 mt-3 break-words">{error}</p>}
    </div>
  );
}
