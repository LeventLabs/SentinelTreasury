"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold">Sentinel Treasury</h1>
          <p className="text-gray-400 text-sm">AI copilot for compliant on-chain capital</p>
        </div>
        <ConnectButton />
      </header>

      {isConnected ? (
        <Dashboard />
      ) : (
        <div className="text-center py-24 space-y-4">
          <div className="text-5xl">🛡️</div>
          <h2 className="text-xl font-semibold text-white">Treasury Management, Simplified</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Deposit funds, get AI-powered allocation recommendations with explainable scores, and execute on-chain with one click.
          </p>
          <p className="text-gray-600 text-sm pt-4">Connect your wallet to get started.</p>
        </div>
      )}
    </main>
  );
}
