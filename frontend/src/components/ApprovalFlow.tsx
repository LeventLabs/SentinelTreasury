"use client";

import { useState } from "react";

interface Props {
  recommendation: any;
  onExecuted: () => void;
}

export function ApprovalFlow({ recommendation, onExecuted }: Props) {
  const [status, setStatus] = useState<"pending" | "approved" | "executing" | "done">("pending");

  const handleApprove = async () => {
    setStatus("approved");
    setStatus("executing");
    // TODO: call contract allocateToYield() or withdrawFromYield() via wagmi
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("done");
    setTimeout(onExecuted, 1000);
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
    </div>
  );
}
