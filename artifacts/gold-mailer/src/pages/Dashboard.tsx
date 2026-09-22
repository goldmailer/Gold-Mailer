import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardQueryKey,
  getGetMeQueryKey,
  getGetStakesQueryKey,
  useClaimDailyReward,
  useGetDashboard,
  useGetStakes,
} from "@workspace/api-client-react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gift,
  LayoutGrid,
  LockKeyhole,
  RefreshCw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { DailyDiamond } from "@/components/DailyDiamond";
import { WalletSummary } from "@/components/WalletSummary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { fmt as currencyFmt, getConfig } from "@/lib/currency";

type DashboardRecord = {
  balance?: number;
  totalStaked?: number;
  totalProfit?: number;
  activeStakes?: number;
  completedStakes?: number;
  totalDeposited?: number;
  totalWithdrawn?: number;
  pendingDeposits?: number;
  pendingWithdrawals?: number;
  dailyRewardAvailable?: boolean;
};

type TransactionRecord = {
  id: number;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

function Countdown({ endDate }: { endDate: string }) {
  const [remaining, setRemaining] = useState("—");

  useEffect(() => {
    const update = () => {
      const difference = new Date(endDate).getTime() - Date.now();
      if (difference <= 0) {
        setRemaining("Ready");
        return;
      }
      const days = Math.floor(difference / 86_400_000);
      const hours = Math.floor((difference % 86_400_000) / 3_600_000);
      const minutes = Math.floor((difference % 3_600_000) / 60_000);
      setRemaining(days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`);
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [endDate]);

  return <span className="font-mono text-xs font-semibold text-primary">{remaining}</span>;
}

function KycBanner({ status }: { status: string }) {
  if (status === "approved") return null;
  const pending = status === "pending";
  const declined = status === "declined";
  return (
    <div className="mx-auto mt-5 max-w-6xl px-4 lg:px-8">
      <Link
        href={pending ? "/kyc" : "/kyc"}
        data-testid="link-kyc-banner"
        className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
          pending
            ? "border-sky-400/25 bg-sky-400/10 hover:bg-sky-400/15"
            : declined
              ? "border-rose-400/25 bg-rose-400/10 hover:bg-rose-400/15"
              : "border-primary/30 bg-primary/10 hover:bg-primary/15"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            pending ? "bg-sky-400/15 text-sky-300" : declined ? "bg-rose-400/15 text-rose-300" : "bg-primary/15 text-primary"
          }`}
        >
          {pending ? <Clock3 size={19} /> : declined ? <ShieldCheck size={19} /> : <ShieldCheck size={19} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-bold ${pending ? "text-sky-300" : declined ? "text-rose-300" : "text-primary"}`}>
            {pending ? "Verification is under review" : declined ? "Verification needs another look" : "Complete verification to unlock your account"}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {pending ? "We will notify you when your documents have been reviewed." : declined ? "Upload a clearer document to continue." : "A verified account gives you access to all account actions."}
          </span>
        </span>
        <ArrowRight size={16} className="shrink-0 text-primary" />
      </Link>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "gold",
  loading = false,
}: {
  label: string;
  value: string;
  note?: string;
  icon: typeof TrendingUp;
  tone?: "gold" | "green" | "blue" | "slate";
  loading?: boolean;
}) {
  const tones = {
    gold: "bg-primary/10 text-primary",
    green: "bg-emerald-400/10 text-emerald-300",
    blue: "bg-sky-400/10 text-sky-300",
    slate: "bg-slate-300/10 text-slate-200",
  };
  return (
    <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={17} />
        </span>
        {note && <span className="text-right text-[11px] text-muted-foreground">{note}</span>}
      </div>
      {loading ? <Skeleton className="mt-4 h-7 w-24" /> : <p className="mt-4 truncate text-xl font-black tracking-tight">{value}</p>}
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function RecentActivity({ country }: { country?: string }) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/transactions?limit=5", { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load transactions");
        return response.json();
      })
      .then((data: unknown) => {
        if (!mounted) return;
        setTransactions(Array.isArray(data) ? (data as TransactionRecord[]).slice(0, 5) : []);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const labels: Record<string, string> = {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    stake: "Stake",
    daily_reward: "Daily reward",
    bonus: "Bonus",
    referral_bonus: "Referral bonus",
  };

  return (
    <section className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm shadow-black/10" data-testid="section-recent-activity">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold"><Activity size={16} className="text-sky-300" /> Recent activity</p>
          <p className="mt-1 text-xs text-muted-foreground">Your latest account movements</p>
        </div>
        <Link href="/transactions" data-testid="link-view-transactions" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          View all <ChevronRight size={13} />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((item) => <div key={item} className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-20" /></div><Skeleton className="h-4 w-16" /></div>)}
        </div>
      ) : failed ? (
        <div className="rounded-xl border border-border bg-background/40 p-5 text-center text-xs text-muted-foreground">Activity is temporarily unavailable.</div>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background/30 p-7 text-center">
          <Activity size={22} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">No activity yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Your deposits, withdrawals, and rewards will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map((transaction) => {
            const withdrawal = transaction.type === "withdrawal";
            const statusTone = transaction.status === "approved" ? "text-emerald-300 bg-emerald-300/10" : transaction.status === "declined" ? "text-rose-300 bg-rose-300/10" : "text-amber-300 bg-amber-300/10";
            return (
              <div key={transaction.id} className="flex items-center gap-3 border-b border-border/50 py-3 last:border-0" data-testid={`row-activity-${transaction.id}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${withdrawal ? "bg-orange-300/10 text-orange-300" : "bg-emerald-300/10 text-emerald-300"}`}>
                  {withdrawal ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{labels[transaction.type] ?? transaction.type}</span>
                  <span className="block text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleDateString()}</span>
                </span>
                <span className="text-right">
                  <span className={`block text-sm font-bold ${withdrawal ? "text-orange-300" : "text-emerald-300"}`}>{withdrawal ? "-" : "+"}{currencyFmt(transaction.amount, country)}</span>
                  <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusTone}`}>{transaction.status}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PerformanceBreakdown({ dashboard, country }: { dashboard?: DashboardRecord; country?: string }) {
  const deposited = Number(dashboard?.totalDeposited ?? 0);
  const profit = Number(dashboard?.totalProfit ?? 0);
  const total = deposited + profit;
  const depositedPercent = total > 0 ? Math.round((deposited / total) * 100) : 0;
  const profitPercent = total > 0 ? 100 - depositedPercent : 0;
  return (
    <section className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm shadow-black/10" data-testid="section-performance">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><BarChart3 size={17} /></span>
        <div><p className="text-sm font-bold">Performance breakdown</p><p className="mt-1 text-xs text-muted-foreground">A view of your recorded account activity</p></div>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {depositedPercent > 0 && <span className="bg-sky-300 transition-all" style={{ width: `${depositedPercent}%` }} />}
        {profitPercent > 0 && <span className="bg-primary transition-all" style={{ width: `${profitPercent}%` }} />}
      </div>
      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-sky-300" /> Deposited capital</span>
          <span className="text-sm font-bold">{currencyFmt(deposited, country)} <span className="ml-1 text-xs font-medium text-muted-foreground">{depositedPercent}%</span></span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Recorded profit</span>
          <span className="text-sm font-bold">{currencyFmt(profit, country)} <span className="ml-1 text-xs font-medium text-muted-foreground">{profitPercent}%</span></span>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs font-medium text-muted-foreground">Total activity</span>
        <span className="text-base font-black">{currencyFmt(total, country)}</span>
      </div>
    </section>
  );
}

function AccountHealth({ user, hasStakes, isNigeria }: { user: any; hasStakes: boolean; isNigeria: boolean }) {
  const checks = [
    { label: "Email verified", complete: Boolean(user?.isVerified) },
    { label: "Profile complete", complete: Boolean(user?.profileComplete) },
    ...(isNigeria ? [{ label: "KYC approved", complete: user?.kycStatus === "approved" }] : []),
    { label: "First stake made", complete: hasStakes },
  ];
  const score = checks.length ? Math.round((checks.filter((item) => item.complete).length / checks.length) * 100) : 0;
  return (
    <section className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div><p className="flex items-center gap-2 text-sm font-bold"><SlidersHorizontal size={16} className="text-emerald-300" /> Account readiness</p><p className="mt-1 text-xs text-muted-foreground">A quick check of your account setup</p></div>
        <span className="text-2xl font-black text-primary">{score}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${score}%` }} /></div>
      <div className="mt-5 space-y-3">
        {checks.map((check) => <div key={check.label} className="flex items-center gap-2.5 text-sm"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${check.complete ? "bg-emerald-400/15 text-emerald-300" : "bg-muted text-muted-foreground"}`}>{check.complete ? <Check size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span><span className={check.complete ? "text-foreground" : "text-muted-foreground"}>{check.label}</span></div>)}
      </div>
    </section>
  );
}

function QuickActions({ locked }: { locked: boolean }) {
  const actions = [
    { href: "/deposit", label: "Deposit", icon: ArrowDownLeft },
    { href: "/withdraw", label: "Withdraw", icon: ArrowUpRight },
    { href: "/exchange", label: "Exchange", icon: RefreshCw },
    { href: "/transactions", label: "Transactions", icon: LayoutGrid },
    { href: "/referrals", label: "Referrals", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings2 },
  ];
  return (
    <section>
      <div className="mb-3 flex items-end justify-between"><div><p className="text-sm font-bold">Useful options</p><p className="mt-1 text-xs text-muted-foreground">Move around your account quickly</p></div></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {actions.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={locked ? "/kyc" : href} data-testid={`link-action-${label.toLowerCase()}`} className={`flex min-h-20 flex-col items-start justify-between rounded-2xl border p-3 transition-colors ${locked ? "border-border/50 bg-card/50 text-muted-foreground" : "border-border/80 bg-card/80 text-foreground hover:border-primary/50 hover:bg-primary/5"}`}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${locked ? "bg-muted" : "bg-primary/10 text-primary"}`}>{locked ? <LockKeyhole size={15} /> : <Icon size={15} />}</span>
            <span className="text-xs font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: dashboardData, isLoading: dashboardLoading } = useGetDashboard();
  const { data: stakes, isLoading: stakesLoading, refetch: refetchStakes } = useGetStakes();
  const dashboard = dashboardData as DashboardRecord | undefined;
  const country = user?.country;
  const fmt = (amount: number) => currencyFmt(amount, country);
  const config = getConfig(country);
  const userRecord = user as any;
  const isNigeria = (country ?? "NG") === "NG";
  const kycStatus = userRecord?.kycStatus ?? "none";
  const locked = isNigeria && kycStatus !== "approved";
  const stakeList = Array.isArray(stakes) ? (stakes as any[]) : [];
  const activeStakes = stakeList.filter((stake) => stake.status === "active");
  const completedStakes = dashboard?.completedStakes ?? stakeList.filter((stake) => stake.status === "completed").length;

  const autoRenewMutation = useMutation({
    mutationFn: async (stakeId: number) => {
      const response = await fetch(`/api/stakes/${stakeId}/toggle-auto-renew`, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Unable to update auto-renew");
      return response.json();
    },
    onSuccess: () => refetchStakes(),
    onError: () => toast({ title: "Auto-renew could not be updated", variant: "destructive" }),
  });

  const claimMutation = useClaimDailyReward({
    mutation: {
      onSuccess: (data: any) => {
        toast({ title: "Daily reward claimed", description: `${fmt(data.amount)} was added to your balance.` });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStakesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (error: any) => toast({ title: "Reward unavailable", description: error?.data?.error ?? error?.message ?? "Please try again later.", variant: "destructive" }),
    },
  });

  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const handleWithdrawToBalance = async (stakeId: number) => {
    setWithdrawingId(stakeId);
    try {
      const response = await fetch(`/api/stakes/${stakeId}/withdraw-to-balance`, { method: "POST", credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to withdraw stake");
      toast({ title: "Stake withdrawn", description: `${fmt(data.amount)} was added to your balance.` });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStakesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (error: any) {
      toast({ title: "Withdrawal failed", description: error.message, variant: "destructive" });
    } finally {
      setWithdrawingId(null);
    }
  };

  const greeting = user?.firstName ? t("dash.welcomeBack", { name: user.firstName }) : "Welcome back";
  const statusLabel = isNigeria && kycStatus === "approved" ? "Verified account" : isNigeria ? "Verification required" : "Account in good standing";
  const statusIcon = isNigeria && kycStatus !== "approved" ? LockKeyhole : BadgeCheck;
  const StatusIcon = statusIcon;
  const breakdown = useMemo(() => [
    { label: "Total staked", value: fmt(dashboard?.totalStaked ?? 0), tone: "gold" as const, icon: TrendingUp },
    { label: "Total profit", value: fmt(dashboard?.totalProfit ?? 0), tone: "green" as const, icon: WalletCards },
    { label: "Active stakes", value: String(dashboard?.activeStakes ?? activeStakes.length), tone: "blue" as const, icon: Clock3 },
    { label: "Completed stakes", value: String(completedStakes), tone: "slate" as const, icon: CheckCircle2 },
  ], [dashboard?.totalStaked, dashboard?.totalProfit, dashboard?.activeStakes, activeStakes.length, completedStakes, country]);

  return (
    <div className="min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="min-h-[100dvh] pt-16 lg:pl-72 lg:pt-0">
        {isNigeria && <KycBanner status={kycStatus} />}
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pt-10">
          <header className="flex flex-col gap-6 border-b border-border/70 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Account overview</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{greeting}</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">Your balances, activity, and investment progress in one clear view.</p>
            </div>
            <div className={`flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${locked ? "border-primary/25 bg-primary/10 text-primary" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"}`} data-testid="status-account">
              <StatusIcon size={14} /> {statusLabel}
            </div>
          </header>

          <section className="mt-7 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/.2),transparent_42%),linear-gradient(145deg,hsl(var(--card)),hsl(var(--background)))] p-6 shadow-lg shadow-primary/5 sm:p-8">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-primary/10" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80"><WalletCards size={15} /> Available main balance</div>
                {dashboardLoading ? <Skeleton className="mt-5 h-12 w-52" /> : <p className="mt-4 text-4xl font-black tracking-tight sm:text-5xl" data-testid="text-balance">{fmt(dashboard?.balance ?? 0)}</p>}
                <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">Your available balance is ready for the account actions allowed on your profile.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href={locked ? "/kyc" : "/deposit"} data-testid="link-primary-deposit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">{locked ? <LockKeyhole size={15} /> : <ArrowDownLeft size={15} />} {locked ? "Verify to continue" : "Deposit funds"}</Link>
                  <Link href="/transactions" data-testid="link-balance-transactions" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/50"><LayoutGrid size={15} /> View transactions</Link>
                </div>
              </div>
            </div>
            <WalletSummary />
          </section>

          <section className="mt-8">
            <div className="mb-3 flex items-end justify-between"><div><p className="text-sm font-bold">Account analysis</p><p className="mt-1 text-xs text-muted-foreground">Performance from your recorded account history</p></div><p className="text-xs text-muted-foreground">{dashboard?.pendingDeposits ?? 0} pending deposit{dashboard?.pendingDeposits === 1 ? "" : "s"}</p></div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {breakdown.map((metric) => <MetricCard key={metric.label} {...metric} loading={dashboardLoading} />)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard label="Total deposited" value={fmt(dashboard?.totalDeposited ?? 0)} icon={ArrowDownLeft} tone="green" loading={dashboardLoading} />
              <MetricCard label="Total withdrawn" value={fmt(dashboard?.totalWithdrawn ?? 0)} icon={ArrowUpRight} tone="gold" loading={dashboardLoading} />
              <MetricCard label="Pending withdrawals" value={String(dashboard?.pendingWithdrawals ?? 0)} icon={Clock3} tone="blue" loading={dashboardLoading} />
              <MetricCard label="Net recorded profit" value={fmt(dashboard?.totalProfit ?? 0)} icon={TrendingUp} tone="slate" loading={dashboardLoading} />
            </div>
          </section>

          <div className="mt-8"><QuickActions locked={locked} /></div>

          {dashboard?.dailyRewardAvailable && (
            <section className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Gift size={18} /></span><div><p className="text-sm font-bold">Your daily reward is ready</p><p className="mt-1 text-xs text-muted-foreground">Claim it from an active stake before the day ends.</p></div></div>
                <span className="text-xs font-semibold text-primary">Available on an active stake below</span>
              </div>
            </section>
          )}

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <RecentActivity country={country ?? undefined} />
            <PerformanceBreakdown dashboard={dashboard} country={country ?? undefined} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <AccountHealth user={userRecord} hasStakes={stakeList.length > 0} isNigeria={isNigeria} />
            <DailyDiamond />
          </div>

          <section className="mt-8" data-testid="section-active-stakes">
            <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-sm font-bold">Active stake management</p><p className="mt-1 text-xs text-muted-foreground">Monitor maturity and daily reward eligibility</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{activeStakes.length} active</span></div>
            {locked ? (
              <div className="rounded-2xl border border-primary/20 bg-card/70 p-8 text-center"><LockKeyhole size={25} className="mx-auto mb-3 text-primary" /><p className="text-sm font-semibold">Verification is required before staking</p><p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">Complete account verification to unlock stake management and related actions.</p><Link href="/kyc" data-testid="link-stakes-kyc" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"><ShieldCheck size={14} /> Review verification</Link></div>
            ) : stakesLoading ? (
              <div className="space-y-3">{[0, 1].map((item) => <Skeleton key={item} className="h-32 rounded-2xl" />)}</div>
            ) : activeStakes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center"><TrendingUp size={26} className="mx-auto mb-3 text-muted-foreground" /><p className="text-sm font-semibold">No active stakes</p><p className="mt-1 text-xs text-muted-foreground">When you have an active stake, its progress and daily reward actions will appear here.</p></div>
            ) : (
              <div className="space-y-3">
                {activeStakes.map((stake: any) => {
                  const matured = stake.daysRemaining === 0;
                  return (
                    <div key={stake.id} className={`rounded-2xl border bg-card/80 p-5 ${matured ? "border-emerald-400/40" : "border-border/80"}`} data-testid={`card-stake-${stake.id}`}>
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${matured ? "bg-emerald-400/10 text-emerald-300" : "bg-sky-400/10 text-sky-300"}`}>{matured ? "Matured" : "Active"}</span>{!matured && <Countdown endDate={stake.endDate} />}</div>
                          <p className="mt-3 text-2xl font-black">{fmt(stake.amount)}</p>
                          <p className="mt-1 text-sm font-semibold text-emerald-300">Projected profit +{fmt(stake.profit)}</p>
                          <p className="mt-3 text-xs text-muted-foreground">Started {new Date(stake.startDate).toLocaleDateString()} · Ends {new Date(stake.endDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          {matured && <Button size="sm" onClick={() => handleWithdrawToBalance(stake.id)} disabled={withdrawingId === stake.id} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"><ArrowUpRight size={14} className="mr-1" />{withdrawingId === stake.id ? "Processing..." : `Withdraw ${fmt(stake.amount + stake.profit)}`}</Button>}
                          {!matured && !stake.dailyClaimedToday && <Button size="sm" onClick={() => claimMutation.mutate({ id: stake.id })} disabled={claimMutation.isPending} className="bg-primary text-primary-foreground"><Gift size={14} className="mr-1" />Claim {fmt(config.dailyReward)}</Button>}
                          {!matured && stake.dailyClaimedToday && <span className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">Reward claimed today</span>}
                          <button type="button" onClick={() => autoRenewMutation.mutate(stake.id)} disabled={autoRenewMutation.isPending} data-testid={`button-auto-renew-${stake.id}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${stake.autoRenew ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}><RefreshCw size={12} />{stake.autoRenew ? "Auto-renew on" : "Auto-renew off"}</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}