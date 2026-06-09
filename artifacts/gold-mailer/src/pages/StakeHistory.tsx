import { useState } from "react";
import { useGetStakes } from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { fmt as currencyFmt } from "@/lib/currency";
import {
  TrendingUp, Clock, CheckCircle2, History, ArrowUpCircle,
  ChevronLeft, Filter, Search
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function StatusPill({ status, isMatured }: { status: string; isMatured: boolean }) {
  if (isMatured) return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/15 text-green-400">MATURED</span>;
  if (status === "active") return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-400">ACTIVE</span>;
  if (status === "completed") return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-400">COMPLETED</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{status.toUpperCase()}</span>;
}

export default function StakeHistory() {
  const { user } = useAuth();
  const { data: stakes, isLoading } = useGetStakes();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [search, setSearch] = useState("");

  const fmt = (n: number) => currencyFmt(n, user?.country);

  const allStakes = Array.isArray(stakes) ? stakes : [];

  const filtered = allStakes.filter((s: any) => {
    if (filter === "active" && s.status !== "active") return false;
    if (filter === "completed" && s.status !== "completed") return false;
    return true;
  });

  const totalStaked = allStakes.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
  const totalProfit = allStakes.reduce((sum: number, s: any) => sum + Number(s.profit), 0);
  const totalDailyClaimed = allStakes.reduce((sum: number, s: any) => sum + Number(s.totalDailyClaimed ?? 0), 0);
  const activeCount = allStakes.filter((s: any) => s.status === "active").length;
  const completedCount = allStakes.filter((s: any) => s.status === "completed").length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-4 max-w-4xl mx-auto px-4 sm:pl-16 py-8">

        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard">
            <button className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <ChevronLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <History size={22} className="text-primary" /> Stake History
            </h1>
            <p className="text-sm text-muted-foreground">All your staking activity in one place</p>
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Staked", value: fmt(totalStaked), icon: TrendingUp, color: "text-primary" },
              { label: "Total Profit", value: fmt(totalProfit), icon: ArrowUpCircle, color: "text-green-400" },
              { label: "Daily Claimed", value: fmt(totalDailyClaimed), icon: CheckCircle2, color: "text-blue-400" },
              { label: "Total Stakes", value: String(allStakes.length), icon: Clock, color: "text-amber-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                <div className={`${stat.color} mb-2`}><stat.icon size={18} /></div>
                <p className="text-xl font-black text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex gap-1.5">
            {([
              { key: "all", label: `All (${allStakes.length})` },
              { key: "active", label: `Active (${activeCount})` },
              { key: "completed", label: `Completed (${completedCount})` },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f.key
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Filter size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{filtered.length} records</span>
          </div>
        </div>

        {/* Stakes List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <History size={44} className="text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm mb-4">
              {filter === "all" ? "No stakes yet. Start staking to see your history here." : `No ${filter} stakes found.`}
            </p>
            {filter === "all" && (
              <Link href="/stake">
                <Button className="bg-primary text-primary-foreground hover:opacity-90">
                  <TrendingUp size={14} className="mr-2" /> Create Your First Stake
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((stake: any) => {
              const isMatured = stake.daysRemaining === 0 && stake.status === "active";
              const profit = Number(stake.profit ?? 0);
              const amount = Number(stake.amount ?? 0);
              const roi = amount > 0 ? ((profit / amount) * 100).toFixed(0) : "0";
              return (
                <div
                  key={stake.id}
                  className={`bg-card border rounded-xl p-5 ${
                    isMatured ? "border-green-500/40 bg-green-500/5" :
                    stake.status === "completed" ? "border-emerald-500/20" :
                    "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusPill status={stake.status} isMatured={isMatured} />
                        <span className="text-xs text-muted-foreground font-mono">#{stake.id}</span>
                      </div>
                      <p className="font-black text-xl text-foreground">{fmt(amount)}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-green-400 font-medium">+{fmt(profit)} profit</span>
                        <span className="text-xs text-muted-foreground bg-green-500/10 px-2 py-0.5 rounded-full">{roi}% ROI</span>
                        {Number(stake.totalDailyClaimed) > 0 && (
                          <span className="text-xs text-blue-400 font-medium">+{fmt(Number(stake.totalDailyClaimed))} daily</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span>Started: {new Date(stake.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span className="text-border">·</span>
                        <span>Ended: {new Date(stake.endDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                      <p className="text-lg font-black text-primary">{fmt(amount + profit)}</p>
                      {stake.status === "completed" && (
                        <span className="text-xs text-emerald-400 font-medium">Withdrawn</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && allStakes.length > 0 && (
          <div className="mt-8 text-center">
            <Link href="/stake">
              <Button className="bg-primary text-primary-foreground hover:opacity-90 gap-2">
                <TrendingUp size={14} /> Create New Stake
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
