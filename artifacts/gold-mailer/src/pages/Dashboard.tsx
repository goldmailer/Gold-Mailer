import { useEffect, useMemo, useState } from "react";
import { useGetDashboard } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LayoutGrid,
  Megaphone,
  PlusCircle,
  ReceiptText,
  Settings2,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { fmt as currencyFmt } from "@/lib/currency";

type DashboardRecord = {
  balance?: number;
  totalDeposited?: number;
  totalWithdrawn?: number;
  pendingDeposits?: number;
  pendingWithdrawals?: number;
};

type TransactionRecord = {
  id: number;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

type WalletRecord = {
  advertisingWallet?: number;
  earningWallet?: number;
};

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "gold",
  loading = false,
}: {
  label: string;
  value: string;
  icon: typeof WalletCards;
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
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={17} />
      </span>
      {loading ? <Skeleton className="mt-4 h-7 w-24" /> : <p className="mt-4 truncate text-xl font-black tracking-tight">{value}</p>}
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function RecentActivity({ country }: { country?: string }) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/transactions?limit=5", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: unknown) => {
        if (!mounted) return;
        setTransactions(Array.isArray(data) ? (data as TransactionRecord[]).slice(0, 5) : []);
        setLoading(false);
      })
      .catch(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const labels: Record<string, string> = { deposit: "Deposit", withdrawal: "Withdrawal" };
  return (
    <section className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm shadow-black/10">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold"><Activity size={16} className="text-sky-300" /> Recent activity</p>
          <p className="mt-1 text-xs text-muted-foreground">Your latest deposits and withdrawals</p>
        </div>
        <Link href="/transactions" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all <ArrowRight size={13} /></Link>
      </div>
      {loading ? (
        <div className="space-y-4">{[0, 1, 2].map((item) => <div key={item} className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-20" /></div><Skeleton className="h-4 w-16" /></div>)}</div>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background/30 p-7 text-center">
          <ReceiptText size={22} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">No activity yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Approved deposits and withdrawal requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map((transaction) => {
            const withdrawal = transaction.type === "withdrawal";
            const statusTone = transaction.status === "approved" ? "text-emerald-300 bg-emerald-300/10" : transaction.status === "declined" ? "text-rose-300 bg-rose-300/10" : "text-amber-300 bg-amber-300/10";
            return (
              <div key={transaction.id} className="flex items-center gap-3 border-b border-border/50 py-3 last:border-0">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${withdrawal ? "bg-orange-300/10 text-orange-300" : "bg-emerald-300/10 text-emerald-300"}`}>
                  {withdrawal ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                </span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{labels[transaction.type] ?? transaction.type}</span><span className="block text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleDateString()}</span></span>
                <span className="text-right"><span className={`block text-sm font-bold ${withdrawal ? "text-orange-300" : "text-emerald-300"}`}>{withdrawal ? "-" : "+"}{currencyFmt(transaction.amount, country)}</span><span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusTone}`}>{transaction.status}</span></span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function QuickActions() {
  const actions = [
    { href: "/deposit", label: "Deposit", icon: ArrowDownLeft },
    { href: "/withdraw", label: "Withdraw", icon: ArrowUpRight },
    { href: "/tasks", label: "Do tasks", icon: ClipboardList },
    { href: "/post-task", label: "Post a task", icon: PlusCircle },
    { href: "/transactions", label: "Transactions", icon: LayoutGrid },
    { href: "/referrals", label: "Referrals", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings2 },
  ];
  return (
    <section>
      <div className="mb-3"><p className="text-sm font-bold">Account actions</p><p className="mt-1 text-xs text-muted-foreground">Manage your wallet and account settings</p></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-20 flex-col items-start justify-between rounded-2xl border border-border/80 bg-card/80 p-3 text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={15} /></span><span className="text-xs font-semibold">{label}</span></Link>)}
      </div>
    </section>
  );
}

function AccountAnalysis({ country }: { country: string }) {
  const { data, isLoading } = useQuery<{ transactions: TransactionRecord[]; submissions: Array<{ status: string; amount?: number }> }>({
    queryKey: ["dashboard-analysis"],
    queryFn: async () => {
      const [transactionsResponse, submissionsResponse] = await Promise.all([
        fetch("/api/transactions", { credentials: "include" }),
        fetch("/api/marketplace/submissions", { credentials: "include" }),
      ]);
      return {
        transactions: transactionsResponse.ok ? await transactionsResponse.json() : [],
        submissions: submissionsResponse.ok ? await submissionsResponse.json() : [],
      };
    },
    staleTime: 30_000,
  });
  const transactions = data?.transactions ?? [];
  const approvedDeposits = transactions.filter((item) => item.type === "deposit" && item.status === "approved").reduce((sum, item) => sum + Number(item.amount), 0);
  const approvedWithdrawals = transactions.filter((item) => item.type === "withdrawal" && item.status === "approved").reduce((sum, item) => sum + Number(item.amount), 0);
  const approvedTasks = (data?.submissions ?? []).filter((item) => item.status === "approved");
  const taskIncome = approvedTasks.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const activity = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - index), 1);
    const value = transactions.filter((item) => {
      const date = new Date(item.createdAt);
      return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear() && item.status === "approved";
    }).reduce((sum, item) => sum + (item.type === "deposit" ? Number(item.amount) : -Number(item.amount)), 0);
    return { label: month.toLocaleDateString(undefined, { month: "short" }), value };
  });
  const maxValue = Math.max(1, ...activity.map((item) => Math.abs(item.value)));
  return (
    <section className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm shadow-black/10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="flex items-center gap-2 text-sm font-bold"><TrendingUp size={16} className="text-primary" /> Account analysis</p><p className="mt-1 text-xs text-muted-foreground">Based on your approved wallet and task activity.</p></div>
        <span className="text-xs text-muted-foreground">{transactions.length} wallet record{transactions.length === 1 ? "" : "s"}</span>
      </div>
      {isLoading ? <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted/40" /> : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-background/60 p-3"><p className="text-xs text-muted-foreground">Deposited</p><p className="mt-1 text-sm font-black text-emerald-300">{currencyFmt(approvedDeposits, country)}</p></div>
            <div className="rounded-xl bg-background/60 p-3"><p className="text-xs text-muted-foreground">Withdrawn</p><p className="mt-1 text-sm font-black text-orange-300">{currencyFmt(approvedWithdrawals, country)}</p></div>
            <div className="rounded-xl bg-background/60 p-3"><p className="text-xs text-muted-foreground">Task income</p><p className="mt-1 text-sm font-black text-primary">{currencyFmt(taskIncome, country)}</p></div>
          </div>
          <div className="mt-6 flex h-32 items-end gap-2 border-b border-border/70 pb-1">
            {activity.map((item) => <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className={`w-full max-w-10 rounded-t-md ${item.value >= 0 ? "bg-primary/70" : "bg-orange-400/70"}`} style={{ height: `${Math.max(8, Math.round((Math.abs(item.value) / maxValue) * 85))}%` }} title={`${item.label}: ${currencyFmt(item.value, country)}`} /><span className="text-[10px] text-muted-foreground">{item.label}</span></div>)}
          </div>
        </>
      )}
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: dashboardData, isLoading } = useGetDashboard();
  const { data: walletData } = useQuery<WalletRecord>({
    queryKey: ["marketplace-wallets"],
    queryFn: async () => {
      const response = await fetch("/api/marketplace/wallets", { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load wallets");
      return response.json();
    },
    staleTime: 15_000,
  });
  const dashboard = dashboardData as DashboardRecord | undefined;
  const country = user?.country ?? "NG";
  const fmt = (amount: number) => currencyFmt(amount, country);
  const breakdown = useMemo(() => [
    { label: "Available balance", value: fmt(dashboard?.balance ?? 0), icon: WalletCards, tone: "gold" as const },
    { label: "Total deposited", value: fmt(dashboard?.totalDeposited ?? 0), icon: ArrowDownLeft, tone: "green" as const },
    { label: "Total withdrawn", value: fmt(dashboard?.totalWithdrawn ?? 0), icon: ArrowUpRight, tone: "blue" as const },
    { label: "Pending requests", value: String((dashboard?.pendingDeposits ?? 0) + (dashboard?.pendingWithdrawals ?? 0)), icon: Clock3, tone: "slate" as const },
  ], [dashboard?.balance, dashboard?.totalDeposited, dashboard?.totalWithdrawn, dashboard?.pendingDeposits, dashboard?.pendingWithdrawals, country]);

  return (
    <div className="min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="min-h-[100dvh] pt-16 lg:pl-72 lg:pt-0">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pt-10">
          <header className="flex flex-col gap-6 border-b border-border/70 pb-7 md:flex-row md:items-end md:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Account overview</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{user?.firstName ? t("dash.welcomeBack", { name: user.firstName }) : "Welcome back"}</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Your wallet, account activity, and transfer options in one clear view.</p></div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300"><CheckCircle2 size={14} /> Account active</div>
          </header>

          <section className="mt-7 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/.2),transparent_42%),linear-gradient(145deg,hsl(var(--card)),hsl(var(--background)))] p-6 shadow-lg shadow-primary/5 sm:p-8">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-primary/10" />
              <div className="relative"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80"><WalletCards size={15} /> Available balance</div>{isLoading ? <Skeleton className="mt-5 h-12 w-52" /> : <p className="mt-4 text-4xl font-black tracking-tight sm:text-5xl" data-testid="text-balance">{fmt(dashboard?.balance ?? 0)}</p>}<p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">Your current available wallet balance. New funds remain pending until reviewed.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/deposit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"><ArrowDownLeft size={15} /> Deposit funds</Link><Link href="/withdraw" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/50"><ArrowUpRight size={15} /> Withdraw funds</Link></div></div>
            </div>
            <div className="rounded-3xl border border-border/80 bg-card/70 p-6"><p className="text-sm font-bold">Account status</p><p className="mt-1 text-xs text-muted-foreground">Your account is ready for deposits and withdrawals.</p><div className="mt-6 space-y-4"><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-300" size={18} /><span className="text-sm">Email verified</span></div><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-300" size={18} /><span className="text-sm">Profile available</span></div><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-300" size={18} /><span className="text-sm">No locked investment plans</span></div></div></div>
          </section>

          <section className="mt-8"><div className="mb-3 flex items-end justify-between"><div><p className="text-sm font-bold">Wallet summary</p><p className="mt-1 text-xs text-muted-foreground">Track your available funds and advertising budget separately.</p></div><p className="text-xs text-muted-foreground">{dashboard?.pendingDeposits ?? 0} pending deposit{dashboard?.pendingDeposits === 1 ? "" : "s"}</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{breakdown.map((metric) => <MetricCard key={metric.label} {...metric} loading={isLoading} />)}<MetricCard label="Advertising wallet" value={fmt(walletData?.advertisingWallet ?? 0)} icon={Megaphone} tone="blue" loading={!walletData} /></div></section>
          <div className="mt-8"><QuickActions /></div>
          <div className="mt-8"><AccountAnalysis country={country} /></div>
          <div className="mt-8"><RecentActivity country={country} /></div>
        </div>
      </main>
    </div>
  );
}