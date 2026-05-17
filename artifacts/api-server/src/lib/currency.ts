export type CountryCode = "NG" | "US" | "UK" | "CA";

export const COUNTRY_CONFIG: Record<
  CountryCode,
  {
    symbol: string;
    minStake: number;
    maxStake: number;
    signupBonus: number;
    referralBonus: number;
    baseProfit: number;
    dailyReward: number;
    firstWithdrawMin: number;
  }
> = {
  NG: { symbol: "₦", minStake: 2700, maxStake: 100000, signupBonus: 3000, referralBonus: 500, baseProfit: 8000, dailyReward: 100, firstWithdrawMin: 10700 },
  US: { symbol: "$", minStake: 3, maxStake: 100, signupBonus: 3, referralBonus: 0.5, baseProfit: 8, dailyReward: 0.1, firstWithdrawMin: 10 },
  UK: { symbol: "£", minStake: 3, maxStake: 100, signupBonus: 3, referralBonus: 0.5, baseProfit: 8, dailyReward: 0.1, firstWithdrawMin: 10 },
  CA: { symbol: "C$", minStake: 3, maxStake: 100, signupBonus: 3, referralBonus: 0.5, baseProfit: 8, dailyReward: 0.1, firstWithdrawMin: 10 },
};

export function getCountryConfig(country?: string | null) {
  const code = (country?.toUpperCase() ?? "NG") as CountryCode;
  return COUNTRY_CONFIG[code] ?? COUNTRY_CONFIG.NG;
}

export function fmtAmount(amount: number, country?: string | null): string {
  const cfg = getCountryConfig(country);
  return `${cfg.symbol}${amount.toLocaleString()}`;
}
