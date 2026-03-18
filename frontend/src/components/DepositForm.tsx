"use client";

import { useState } from "react";

interface Props {
  onDeposit: (amount: number) => void;
}

export function DepositForm({ onDeposit }: Props) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    setLoading(true);
    // TODO: call treasury contract deposit() via wagmi useWriteContract
    // For now, simulate:
    await new Promise((r) => setTimeout(r, 1000));
    onDeposit(val);
    setAmount("");
    setLoading(false);
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
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg font-medium"
        >
          {loading ? "..." : "Deposit"}
        </button>
      </div>
    </div>
  );
}
