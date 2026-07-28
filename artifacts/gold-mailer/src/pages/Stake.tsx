import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateStake, getGetStakesQueryKey, getGetDashboardQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getConfig, fmt as currencyFmt } from "@/lib/currency";
import { TrendingUp, AlertTriangle, Check, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Stake() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const cfg = getConfig(user?.country);
  const fmt = (n: number) => currencyFmt(n, user?.country);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const selectedPlanData = selectedPlan !== null ? cfg.plans[selectedPlan] : null;
  const isValid =
    selectedPlanData !== null &&
    selectedPlanData !== undefined &&
    (user?.hasDeposited ?? false) &&
    (user?.balance ?? 0) >= (selectedPlanData?.entry ?? 0);

  const mutation = useCreateStake({
    mutation: {
      onSuccess: () => {
        toast({ title: "Stake created!", description: `${selectedPlanData ? fmt(selectedPlanData.entry) : ""} is now staking for 7 days.` });
        queryClient.invalidateQueries({ queryKey: getGetStakesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setSelectedPlan(null);
      },
      onError: (err: any) => {
        toast({ title: "Stake failed", description: err?.data?.error || err?.message || "Something went wrong", variant: "destructive" });
      },
    },
  });

  const planLabels = ["Starter", "Basic", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite", "Master", "Legend"];
  const popularTier = 4; // Plan 5 (index 4) is "popular"

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 max-w-3xl mx-auto px-4 sm:pl-16 py-8">
        <h1 className="text-2xl font-black mb-1">{t("stake.title")}</h1>
        <p className="text-muted-foreground text-sm mb-6">Choose a plan and grow your money in 7 days</p>

        {/* Deposit-first gate */}
        {!user?.hasDeposited && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-5 mb-6 flex gap-4 items-start">
            <AlertTriangle size={20} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">{t("stake.depositRequired")}</p>
              <p className="text-sm text-muted-foreground mb-3">{t("stake.depositRequiredDesc")}</p>
              <Link href="/deposit">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                  {t("stake.makeDeposit")}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Balance card */}
        <div className="glass-card rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Balance</p>
            <p className="text-2xl font-black text-primary mt-1" data-testid="text-balance">
              {fmt(user?.balance ?? 0)}
            </p>
          </div>
          <TrendingUp size={32} className="text-primary/30" />
        </div>

        {/* Plan grid */}
        <div className={`mb-6 ${!user?.hasDeposited ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Select Your Plan</h2>
            <span className="text-xs text-muted-foreground">7-day lock period</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cfg.plans.map((plan, idx) => {
              const isSelected = selectedPlan === idx;
              const isPopular = idx === popularTier;
              const canAfford = (user?.balance ?? 0) >= plan.entry;

              return (
                <button
                  key={plan.tier}
                  onClick={() => setSelectedPlan(isSelected ? null : idx)}
                  disabled={!canAfford}
                  className={`relative text-left rounded-xl p-4 border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                      : canAfford
                      ? "border-border glass-card hover:border-primary/40 hover:bg-white/3"
                      : "border-border/50 bg-card/50 opacity-40 cursor-not-allowed"
                  }`}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      <Star size={8} fill="currentColor" /> Popular
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check size={10} className="text-primary-foreground" />
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Plan {plan.tier} · {planLabels[idx]}
                    </span>
                  </div>
                  <p className="text-base font-black text-foreground">{fmt(plan.entry)}</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <Zap size={11} className="text-green-400" />
                    <span className="text-xs font-bold text-green-400">+{fmt(plan.weeklyReturn)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">weekly return</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        {selectedPlanData && user?.hasDeposited && (
          <div className="glass-card border border-primary/30 rounded-xl p-5 mb-6 space-y-3">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <Zap size={14} /> Plan {selectedPlanData.tier} — {planLabels[selectedPlan!]} Preview
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">You stake</p>
                <p className="font-black text-lg">{fmt(selectedPlanData.entry)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Profit</p>
                <p className="font-black text-lg text-green-400">+{fmt(selectedPlanData.weeklyReturn)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Daily reward</p>
                <p className="font-black text-lg text-primary">+{fmt(cfg.dailyReward)}/day</p>
              </div>
            </div>
            <div className="border-t border-primary/20 pt-3 flex justify-between">
              <span className="text-sm font-medium">Total after 7 days</span>
              <span className="font-black text-lg text-green-400">
                {fmt(selectedPlanData.entry + selectedPlanData.weeklyReturn + cfg.dailyReward * 7)}
              </span>
            </div>

            {selectedPlanData.entry > (user?.balance ?? 0) && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm">
                Insufficient balance — need {fmt(selectedPlanData.entry - (user?.balance ?? 0))} more.
              </div>
            )}
          </div>
        )}

        <Button
          className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold text-base"
          disabled={!isValid || mutation.isPending}
          onClick={() => {
            if (selectedPlanData) {
              mutation.mutate({ data: { amount: selectedPlanData.entry } });
            }
          }}
          data-testid="button-stake-submit"
        >
          {mutation.isPending
            ? t("stake.creating")
            : selectedPlanData
            ? `Stake ${fmt(selectedPlanData.entry)} Now`
            : "Select a Plan"}
        </Button>

        {/* How it works */}
        <div className="mt-6 glass-card rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3">{t("stake.howItWorks")}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-primary">1.</span> Choose a plan above and tap "Stake Now"</li>
            <li className="flex gap-2"><span className="text-primary">2.</span> Your funds are locked for 7 days</li>
            <li className="flex gap-2"><span className="text-primary">3.</span> Claim your daily diamond reward every 24 hours (+{fmt(cfg.dailyReward)}/day)</li>
            <li className="flex gap-2"><span className="text-primary">4.</span> After 7 days, withdraw principal + profit to your balance</li>
            <li className="flex gap-2"><span className="text-primary">5.</span> Withdraw to your bank or reinvest</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
