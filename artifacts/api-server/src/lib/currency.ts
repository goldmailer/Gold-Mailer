export type CountryCode = string;

export type StakePlan = {
  tier: number;
  entry: number;
  weeklyReturn: number;
};

// Nigeria investment plans: ₦1,000 to ₦10,000 — 15.8× weekly return
export const NG_PLANS: StakePlan[] = Array.from({ length: 10 }, (_, i) => ({
  tier: i + 1,
  entry: (i + 1) * 1000,
  weeklyReturn: (i + 1) * 15800,
}));

// Global (USD) investment plans: $10 to $1,000 evenly spaced — ~15× weekly return
const USD_ENTRIES = [10, 120, 230, 340, 450, 560, 670, 780, 890, 1000];
export const USD_PLANS: StakePlan[] = USD_ENTRIES.map((entry, i) => ({
  tier: i + 1,
  entry,
  weeklyReturn: Math.round(entry * 15),
}));

const NG = {
  symbol: "₦",
  minStake: 1000,
  maxStake: 10000,
  signupBonus: 3000,
  referralBonus: 500,
  baseProfit: 15800,
  dailyReward: 100,
  firstWithdrawMin: 10700,
  plans: NG_PLANS,
};

const USD = {
  symbol: "$",
  minStake: 10,
  maxStake: 1000,
  signupBonus: 10,
  referralBonus: 0.5,
  baseProfit: 150,
  dailyReward: 0.1,
  firstWithdrawMin: 10,
  plans: USD_PLANS,
};

export function getCountryConfig(country?: string | null) {
  if (country === "NG") return NG;
  return { ...USD };
}

export function fmtAmount(amount: number, country?: string | null): string {
  if (country === "NG") {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Find the plan profit for a given stake amount. Falls back to proportional. */
export function calcProfit(amount: number, country?: string | null): number {
  const cfg = getCountryConfig(country);
  // Find exact plan match first
  const plan = cfg.plans.find(p => p.entry === amount);
  if (plan) return plan.weeklyReturn;
  // Proportional fallback (for custom amounts within range)
  return Math.floor((amount / cfg.minStake) * cfg.baseProfit);
}
