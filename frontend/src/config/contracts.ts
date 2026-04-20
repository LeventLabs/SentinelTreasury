const envAddress = (value: string | undefined) => (value && value.startsWith("0x") ? value : "0x");

export const TREASURY_ADDRESS = envAddress(process.env.NEXT_PUBLIC_TREASURY_ADDRESS) as `0x${string}`;
export const YIELD_VAULT_ADDRESS = envAddress(process.env.NEXT_PUBLIC_YIELD_VAULT_ADDRESS) as `0x${string}`;
export const USDC_ADDRESS = envAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS) as `0x${string}`;
export const KYC_SBT_ADDRESS = envAddress(process.env.NEXT_PUBLIC_KYC_SBT_ADDRESS) as `0x${string}`;
export const USDC_DECIMALS = Number(process.env.NEXT_PUBLIC_USDC_DECIMALS || "6");
export const CONTRACTS_CONFIGURED =
  TREASURY_ADDRESS !== "0x" && YIELD_VAULT_ADDRESS !== "0x" && USDC_ADDRESS !== "0x";
export const KYC_SBT_CONFIGURED = KYC_SBT_ADDRESS !== "0x";

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

export const KYC_SBT_ABI = [
  { type: "function", name: "isHuman", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "bool" }, { name: "", type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "getTotalFee", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "requestKyc", inputs: [{ name: "ensName", type: "string" }], outputs: [], stateMutability: "payable" },
  { type: "event", name: "KycRequested", inputs: [{ name: "user", type: "address", indexed: true }, { name: "ensName", type: "string" }] },
] as const;

export const ERC20_ABI = [
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;
