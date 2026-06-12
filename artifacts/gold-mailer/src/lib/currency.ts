export type CountryCode = string;

const USD = {
  symbol: "$",
  name: "Global",
  flag: "🌍",
  minStake: 3,
  maxStake: 100,
  minDeposit: 1,
  signupBonus: 10,
  referralBonus: 0.5,
  baseProfit: 8,
  dailyReward: 0.1,
  firstWithdrawMin: 10,
};

const NGN = {
  symbol: "₦",
  name: "Nigeria",
  flag: "🇳🇬",
  minStake: 1000,
  maxStake: 5000000,
  minDeposit: 1000,
  signupBonus: 10,
  referralBonus: 500,
  baseProfit: 2700,
  dailyReward: 50,
  firstWithdrawMin: 5000,
};

export function getConfig(country?: string | null) {
  if (!country || country === "NG") return NGN;
  return USD;
}

export function fmt(amount: number, country?: string | null): string {
  if (!country || country === "NG") {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export { getLocalCurrency } from "./countries";
