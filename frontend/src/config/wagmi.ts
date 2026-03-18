import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const hashkeyTestnet = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.hsk.xyz"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://testnet-explorer.hsk.xyz" },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: "Sentinel Treasury",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "demo",
  chains: [hashkeyTestnet],
  ssr: true,
});
