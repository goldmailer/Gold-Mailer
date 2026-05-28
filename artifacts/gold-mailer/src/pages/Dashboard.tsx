import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboard, useGetStakes, useClaimDailyReward,
  getGetDashboardQueryKey, getGetStakesQueryKey, getGetMeQueryKey
} from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fmt as currencyFmt, getConfig } from "@/lib/currency";
import {
  TrendingUp, Wallet, Clock, Gift, ChevronRight, AlertCircle,
  CheckCircle2, Star, ArrowUpCircle, BarChart3, Zap
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/i18n/LanguageContext";

const STRIPS_TO_CLAIM = 50;
const STRIP_VALUE = 2;

function Countdown({ endDate }: { endDate: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function calc() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Ready"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setRemaining(`${d}d ${h}h ${m}m`);
      else if (h > 0) setRemaining(`${h}h ${m}m ${s}s`);
      else setRemaining(`${m}m ${s}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const isReady = remaining === "Ready";
  return (
    <span className={`text-xs font-mono font-bold ${isReady ? "text-green-400" : "text-primary"}`}>
      {remaining}
    </span>
  );
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const cfg = getConfig(user?.country);

  const fmt = (n: number) => currencyFmt(n, user?.country);

  const { data: dash, isLoading: dashLoading } = useGetDashboard();
  const { data: stakes, isLoading: stakesLoading } = useGetStakes();

  const claimMutation = useClaimDailyReward({
    mutation: {
      onSuccess: (data: any) => {
        toast({ title: t("dash.dailyRewardAvailable"), description: `${fmt(data.amount)} added to your balance.` });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStakesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Cannot claim", description: err?.data?.error || err?.message || "Already claimed today", variant: "destructive" });
      },
    },
  });

  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const handleWithdrawToBalance = async (stakeId: number) => {
    setWithdrawingId(stakeId);
    try {
      const res = await fetch(`/api/stakes/${stakeId}/withdraw-to-balance`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Withdrawn to balance!", description: `${fmt(data.amount)} added to your balance.` });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStakesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      toast({ title: "Withdrawal failed", description: e.message, variant: "destructive" });
    } finally {
      setWithdrawingId(null);
    }
  };

  const [claimingStrips, setClaimingStrips] = useState(false);
  const handleClaimStrips = async () => {
    setClaimingStrips(true);
    try {
      const res = await fetch("/api/user/claim-strips", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Strips claimed!", description: `$${STRIP_VALUE.toFixed(2)} added to your balance.` });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      // Update local user state
      const me = await fetch("/api/auth/me", { credentials: "include" }).then(r => r.json());
      if (me?.id) updateUser(me);
    } catch (e: any) {
      toast({ title: "Claim failed", description: e.message, variant: "destructive" });
    } finally {
      setClaimingStrips(false);
    }
  };

  const greeting = user?.firstName
    ? t("dash.welcomeBack", { name: user.firstName })
    : "Welcome back";

  const totalStrips = (dash as any)?.totalStrips ?? user?.totalStrips ?? 0;
  const loginStreak = (dash as any)?.loginStreak ?? user?.loginStreak ?? 0;
  const stripsProgress = Math.min(totalStrips % STRIPS_TO_CLAIM, STRIPS_TO_CLAIM);
  const canClaim = totalStrips >= STRIPS_TO_CLAIM;

  function daysLabel(d: number) {
    if (d <= 0) return t("dash.matured");
    return t("dash.daysRemaining", { d: String(d), s: d === 1 ? "" : "s", e: d === 1 ? "" : "e" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pl-0 pt-0">
        {/* ── Login Strip Banner ─────────────────────────────── */}
        <div className="border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="max-w-5xl mx-auto px-4 sm:pl-16 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Star size={14} className="text-primary" fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-foreground">Daily Login Strips</span>
                    <span className="text-xs text-muted-foreground">
                      {totalStrips} strip{totalStrips !== 1 ? "s" : ""} · {loginStreak} day streak
                    </span>
                    {canClaim && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium animate-pulse">
                        Claimable!
                      </span>
                    )}
                  </div>
                  <div className="relative h-2 bg-background/50 rounded-full overflow-hidden w-full max-w-xs">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${(stripsProgress / STRIPS_TO_CLAIM) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stripsProgress}/{STRIPS_TO_CLAIM} — {STRIPS_TO_CLAIM} strips = ${STRIP_VALUE} balance
                  </p>
                </div>
              </div>
              {canClaim && (
                <Button
                  size="sm"
                  onClick={handleClaimStrips}
                  disabled={claimingStrips}
                  className="bg-primary text-primary-foreground hover:opacity-90 text-xs font-bold shrink-0"
                >
                  <Zap size={12} className="mr-1" />
                  {claimingStrips ? "Claiming..." : `Claim $${STRIP_VALUE}`}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Header / Balance ───────────────────────────────── */}
        <div className="border-b border-border bg-card/30">
          <div className="max-w-5xl mx-auto px-4 sm:pl-16 pt-6 pb-6">
            <p className="text-muted-foreground text-sm mb-1">{greeting}</p>
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("dash.availableBalance")}</p>
                {dashLoading ? (
                  <Skeleton className="h-10 w-44 mt-1" />
                ) : (
                  <p className="text-4xl font-black text-primary" data-testid="text-balance">
                    {fmt(dash?.balance ?? 0)}
                  </p>
                )}
              </div>
              {!dashLoading && dash?.dailyRewardAvailable && (
                <div className="mb-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium animate-pulse">
                    <Gift size={12} />
                    {t("dash.dailyRewardAvailable")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:pl-16 py-8 space-y-8">
          {/* ── Stats grid ──────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("dash.totalStaked"), value: fmt(dash?.totalStaked ?? 0), icon: TrendingUp, color: "text-primary" },
              { label: t("dash.totalProfit"), value: fmt(dash?.totalProfit ?? 0), icon: Wallet, color: "text-green-400" },
              { label: t("dash.activeStakes"), value: String(dash?.activeStakes ?? 0), icon: Clock, color: "text-blue-400" },
              { label: "Completed Stakes", value: String((dash as any)?.completedStakes ?? 0), icon: CheckCircle2, color: "text-emerald-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                <div className={`${stat.color} mb-2`}><stat.icon size={20} /></div>
                {dashLoading ? <Skeleton className="h-7 w-24 mb-1" /> : (
                  <p className="text-xl font-black text-foreground">{stat.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Extended analytics ──────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Total Deposited", value: fmt((dash as any)?.totalDeposited ?? 0), icon: ArrowUpCircle, color: "text-green-400" },
              { label: "Total Withdrawn", value: fmt((dash as any)?.totalWithdrawn ?? 0), icon: ArrowUpCircle, color: "text-orange-400" },
              { label: t("dash.pendingDeposits"), value: String(dash?.pendingDeposits ?? 0), icon: AlertCircle, color: "text-yellow-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                <div className={`${stat.color} mb-2`}><stat.icon size={18} /></div>
                {dashLoading ? <Skeleton className="h-6 w-20 mb-1" /> : (
                  <p className="text-lg font-black text-foreground">{stat.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Quick actions ────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/stake", label: t("dash.stakeNow"), bg: "bg-primary text-primary-foreground" },
              { href: "/deposit", label: t("dash.deposit"), bg: "bg-card border border-border text-foreground hover:border-primary/50" },
              { href: "/withdraw", label: t("dash.withdraw"), bg: "bg-card border border-border text-foreground hover:border-primary/50" },
              { href: "/exchange", label: "Exchange", bg: "bg-card border border-border text-foreground hover:border-primary/50" },
            ].map(action => (
              <Link key={action.href} href={action.href}>
                <button className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${action.bg}`}>
                  {action.label}
                </button>
              </Link>
            ))}
          </div>

          {/* ── Active stakes ────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{t("dash.activeStakesTitle")}</h2>
              <Link href="/stake">
                <span className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1">
                  {t("dash.newStake")} <ChevronRight size={14} />
                </span>
              </Link>
            </div>

            {stakesLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />
                ))}
              </div>
            ) : !stakes || stakes.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <TrendingUp size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">{t("dash.noActiveStakes")}</p>
                <Link href="/stake">
                  <Button className="bg-primary text-primary-foreground hover:opacity-90" data-testid="button-create-first-stake">
                    {t("dash.createFirstStake")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stakes.map((stake: any) => {
                  const isMatured = stake.daysRemaining === 0 && stake.status === "active";
                  return (
                    <div key={stake.id} data-testid={`card-stake-${stake.id}`}
                      className={`bg-card border rounded-xl p-5 flex items-start justify-between gap-4 flex-wrap ${isMatured ? "border-green-500/40 bg-green-500/5" : "border-border"}`}>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            stake.status === "active" && !isMatured ? "bg-blue-500/15 text-blue-400" :
                            isMatured ? "bg-green-500/15 text-green-400" :
                            stake.status === "completed" ? "bg-muted text-muted-foreground" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {isMatured ? "MATURED" : stake.status.toUpperCase()}
                          </span>
                          {stake.status === "active" && (
                            <Countdown endDate={stake.endDate} />
                          )}
                        </div>
                        <p className="font-black text-xl text-foreground">{fmt(stake.amount)}</p>
                        <p className="text-sm text-green-400 font-medium">{t("dash.profit")} +{fmt(stake.profit)}</p>
                        <p className="text-xs text-muted-foreground">{t("dash.dailyClaimed")} {fmt(stake.totalDailyClaimed)}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>Start: {new Date(stake.startDate).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>End: {new Date(stake.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isMatured && (
                          <Button
                            size="sm"
                            onClick={() => handleWithdrawToBalance(stake.id)}
                            disabled={withdrawingId === stake.id}
                            className="bg-green-500 hover:bg-green-400 text-black font-bold text-xs"
                          >
                            <ArrowUpCircle size={12} className="mr-1" />
                            {withdrawingId === stake.id ? "Withdrawing..." : `Withdraw ${fmt(stake.amount + stake.profit)}`}
                          </Button>
                        )}
                        {stake.status === "active" && !stake.dailyClaimedToday && !isMatured && (
                          <Button
                            size="sm"
                            onClick={() => claimMutation.mutate({ id: stake.id })}
                            disabled={claimMutation.isPending}
                            data-testid={`button-claim-daily-${stake.id}`}
                            className="bg-primary text-primary-foreground hover:opacity-90 text-xs"
                          >
                            <Gift size={12} className="mr-1" /> {t("dash.claim", { amount: fmt(cfg.dailyReward) })}
                          </Button>
                        )}
                        {stake.status === "active" && stake.dailyClaimedToday && !isMatured && (
                          <span className="text-xs text-muted-foreground">{t("dash.claimedToday")}</span>
                        )}
                        {stake.status !== "completed" && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{t("dash.ends")}</p>
                            <p className="text-xs font-medium">{new Date(stake.endDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
