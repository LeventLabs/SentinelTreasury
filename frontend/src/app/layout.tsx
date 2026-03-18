import type { Metadata } from "next";
import { Web3Provider } from "@/providers/Web3Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentinel Treasury",
  description: "AI copilot for compliant on-chain treasury management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
