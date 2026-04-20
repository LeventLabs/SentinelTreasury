export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("User rejected") || msg.includes("user rejected")) return "Transaction rejected by user.";
  if (msg.includes("insufficient funds")) return "Insufficient funds for gas.";
  if (msg.includes("not approver")) return "This wallet is not an approved operator.";
  if (msg.includes("not owner")) return "Only the contract owner can do this.";
  if (msg.includes("insufficient balance")) return "Insufficient balance in vault.";
  if (msg.includes("KYC required")) return "KYC verification required.";
  if (msg.includes("approver KYC insufficient")) return "Approver tier is insufficient (ADVANCED+ required).";
  if (msg.includes("payout KYC insufficient")) return "Payout tier is insufficient (PREMIUM+ required).";
  if (msg.includes("insufficient fee")) return "KYC fee too low. Try again.";
  if (msg.includes("already registered")) return "This wallet already has a KYC record.";
  if (msg.includes("peg deviation")) return "USDC peg deviation exceeds safe threshold. Allocation blocked.";
  if (msg.includes("bad feed")) return "Oracle feed returned an invalid value.";
  if (msg.includes("exceeds balance")) return "Amount exceeds your token balance.";
  if (msg.includes("exceeds allowance")) return "Token allowance too low. Try again.";
  return "Transaction failed. Please try again.";
}
