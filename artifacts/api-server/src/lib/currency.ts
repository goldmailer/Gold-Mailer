// All platform amounts are denominated in USD ($)
export type CountryCode = string;

const USD = {
  symbol: "$",
  minStake: 3,
  maxStake: 100,
  signupBonus: 10,
  referralBonus: 0.5,
  baseProfit: 8,
  dailyReward: 0.1,
  firstWithdrawMin: 10,
};

export function getCountryConfig(_country?: string | null) {
  return USD;
}

export function fmtAmount(amount: number, _country?: string | null): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
