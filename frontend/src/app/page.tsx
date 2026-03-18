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
        <div className="text-center py-32 text-gray-500">
          Connect your wallet to get started.
        </div>
      )}
    </main>
  );
}
