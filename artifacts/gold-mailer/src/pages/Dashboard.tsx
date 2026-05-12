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
import { TrendingUp, Wallet, Clock, Gift, ChevronRight, AlertCircle } from "lucide-react";
import { Link } from "wouter";

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysLabel(d: number) {
  if (d <= 0) return "Matured";
  return `${d} day${d === 1 ? "" : "s"} remaining`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dash, isLoading: dashLoading } = useGetDashboard();
  const { data: stakes, isLoading: stakesLoading } = useGetStakes();

  const claimMutation = useClaimDailyReward({
    mutation: {
      onSuccess: (data: any) => {
        toast({ title: "Daily reward claimed!", description: `${fmt(data.amount)} added to your balance.` });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStakesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Cannot claim", description: err?.response?.data?.error || "Already claimed today", variant: "destructive" });
      },
    },
  });

  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : "Welcome back";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pl-0 pt-0">
        {/* Header */}
        <div className="border-b border-border bg-card/30">
          <div className="max-w-5xl mx-auto px-4 pt-16 pb-6 pl-16">
            <p className="text-muted-foreground text-sm mb-1">{greeting}</p>
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
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
                    Daily reward available
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pl-16 py-8 space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Staked", value: fmt(dash?.totalStaked ?? 0), icon: TrendingUp, color: "text-primary" },
              { label: "Total Profit", value: fmt(dash?.totalProfit ?? 0), icon: Wallet, color: "text-green-400" },
              { label: "Active Stakes", value: String(dash?.activeStakes ?? 0), icon: Clock, color: "text-blue-400" },
              { label: "Pending Deposits", value: String(dash?.pendingDeposits ?? 0), icon: AlertCircle, color: "text-yellow-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                <div className={`${stat.color} mb-2`}><stat.icon size={20} /></div>
                {dashLoading ? (
                  <Skeleton className="h-7 w-24 mb-1" />
                ) : (
                  <p className="text-xl font-black text-foreground" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                    {stat.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/stake", label: "Stake Now", bg: "bg-primary text-primary-foreground" },
              { href: "/deposit", label: "Deposit", bg: "bg-card border border-border text-foreground hover:border-primary/50" },
              { href: "/withdraw", label: "Withdraw", bg: "bg-card border border-border text-foreground hover:border-primary/50" },
              { href: "/cards", label: "View Cards", bg: "bg-card border border-border text-foreground hover:border-primary/50" },
            ].map(action => (
              <Link key={action.href} href={action.href}>
                <button data-testid={`button-quick-${action.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${action.bg}`}>
                  {action.label}
                </button>
              </Link>
            ))}
          </div>

          {/* Active stakes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Active Stakes</h2>
              <Link href="/stake">
                <span className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1">
                  New Stake <ChevronRight size={14} />
                </span>
              </Link>
            </div>

            {stakesLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />
                ))}
              </div>
            ) : !stakes || stakes.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <TrendingUp size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No active stakes yet</p>
                <Link href="/stake">
                  <Button className="bg-primary text-primary-foreground hover:opacity-90" data-testid="button-create-first-stake">
                    Create Your First Stake
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stakes.map((stake: any) => (
                  <div key={stake.id} data-testid={`card-stake-${stake.id}`}
                    className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          stake.status === "active" ? "bg-green-500/15 text-green-400" :
                          stake.status === "completed" ? "bg-blue-500/15 text-blue-400" :
                          "bg-muted text-muted-foreground"
                        }`}>{stake.status.toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground">{daysLabel(stake.daysRemaining)}</span>
                      </div>
                      <p className="font-black text-xl text-foreground">{fmt(stake.amount)}</p>
                      <p className="text-sm text-green-400 font-medium">Profit: +{fmt(stake.profit)}</p>
                      <p className="text-xs text-muted-foreground">Daily claimed: {fmt(stake.totalDailyClaimed)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {stake.status === "active" && !stake.dailyClaimedToday && (
                        <Button
                          size="sm"
                          onClick={() => claimMutation.mutate({ id: stake.id })}
                          disabled={claimMutation.isPending}
                          data-testid={`button-claim-daily-${stake.id}`}
                          className="bg-primary text-primary-foreground hover:opacity-90 text-xs"
                        >
                          <Gift size={12} className="mr-1" /> Claim ₦100
                        </Button>
                      )}
                      {stake.status === "active" && stake.dailyClaimedToday && (
                        <span className="text-xs text-muted-foreground">Claimed today</span>
                      )}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Ends</p>
                        <p className="text-xs font-medium">{new Date(stake.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
