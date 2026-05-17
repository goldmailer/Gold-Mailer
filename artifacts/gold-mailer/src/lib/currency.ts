export type CountryCode = "NG" | "US" | "UK" | "CA";

export const COUNTRY_CONFIG: Record<
  CountryCode,
  {
    symbol: string;
    name: string;
    flag: string;
    minStake: number;
    maxStake: number;
    signupBonus: number;
    referralBonus: number;
    baseProfit: number;
    dailyReward: number;
    firstWithdrawMin: number;
  }
> = {
  NG: { symbol: "₦", name: "Nigeria", flag: "🇳🇬", minStake: 2700, maxStake: 100000, signupBonus: 3000, referralBonus: 500, baseProfit: 8000, dailyReward: 100, firstWithdrawMin: 10700 },
  US: { symbol: "$", name: "United States", flag: "🇺🇸", minStake: 3, maxStake: 100, signupBonus: 3, referralBonus: 0.5, baseProfit: 8, dailyReward: 0.1, firstWithdrawMin: 10 },
  UK: { symbol: "£", name: "United Kingdom", flag: "🇬🇧", minStake: 3, maxStake: 100, signupBonus: 3, referralBonus: 0.5, baseProfit: 8, dailyReward: 0.1, firstWithdrawMin: 10 },
  CA: { symbol: "C$", name: "Canada", flag: "🇨🇦", minStake: 3, maxStake: 100, signupBonus: 3, referralBonus: 0.5, baseProfit: 8, dailyReward: 0.1, firstWithdrawMin: 10 },
};

export function getConfig(country?: string | null) {
  const code = (country?.toUpperCase() ?? "NG") as CountryCode;
  return COUNTRY_CONFIG[code] ?? COUNTRY_CONFIG.NG;
}

export function fmt(amount: number, country?: string | null): string {
  const cfg = getConfig(country);
  const isNGN = !country || country.toUpperCase() === "NG";
  if (isNGN) {
    return `₦${Math.round(amount).toLocaleString("en-NG")}`;
  }
  return `${cfg.symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
