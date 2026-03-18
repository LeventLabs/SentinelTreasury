export const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}` || "0x";
export const YIELD_VAULT_ADDRESS = process.env.NEXT_PUBLIC_YIELD_VAULT_ADDRESS as `0x${string}` || "0x";
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` || "0x";

export const TREASURY_ABI = [
  { type: "function", name: "deposit", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "withdraw", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "allocateToYield", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "withdrawFromYield", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "payout", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getBalance", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approvers", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "bool" }], stateMutability: "view" },
  { type: "event", name: "Deposited", inputs: [{ name: "user", type: "address", indexed: true }, { name: "amount", type: "uint256" }] },
  { type: "event", name: "AllocatedToYield", inputs: [{ name: "amount", type: "uint256" }] },
  { type: "event", name: "PayoutSent", inputs: [{ name: "to", type: "address", indexed: true }, { name: "amount", type: "uint256" }] },
] as const;

export const YIELD_VAULT_ABI = [
  { type: "function", name: "getBalance", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getAPY", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "pure" },
  { type: "function", name: "totalDeposits", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

export const ERC20_ABI = [
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;
