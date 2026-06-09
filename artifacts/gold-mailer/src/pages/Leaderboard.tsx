import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { fmt as currencyFmt } from "@/lib/currency";
import { Trophy, TrendingUp, Medal, Crown, Star, Users } from "lucide-react";

const COUNTRY_FLAGS: Record<string, string> = {
  NG: "🇳🇬", US: "🇺🇸", UK: "🇬🇧", CA: "🇨🇦",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shrink-0"><Crown size={16} className="text-black" /></div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center shrink-0"><Medal size={16} className="text-black" /></div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center shrink-0"><Medal size={16} className="text-white" /></div>;
  return <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0 text-sm font-black text-muted-foreground">#{rank}</div>;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"earnings" | "stakes" | "referrals">("earnings");

  useEffect(() => {
    fetch("/api/leaderboard", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setEntries(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (tab === "earnings") return b.totalEarnings - a.totalEarnings;
    if (tab === "stakes") return b.stakeCount - a.stakeCount;
    return b.referralCount - a.referralCount;
  }).map((e, i) => ({ ...e, rank: i + 1 }));

  const myEntry = entries.find(e => e.id === user?.id);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-0 pt-0">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-r from-primary/10 to-amber-500/10">
          <div className="max-w-3xl mx-auto px-4 sm:pl-16 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-black">Leaderboard</h1>
                <p className="text-xs text-muted-foreground">Top investors on GoldMailer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:pl-16 py-6 space-y-6">
          {/* Tab filter */}
          <div className="flex gap-2 bg-card border border-border rounded-xl p-1">
            {[
              { key: "earnings", label: "Top Earners", icon: TrendingUp },
              { key: "stakes", label: "Most Stakes", icon: Star },
              { key: "referrals", label: "Top Referrers", icon: Users },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === t.key
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          {/* My position card */}
          {myEntry && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-4">
              <RankBadge rank={sorted.find(e => e.id === user?.id)?.rank ?? 99} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Your position</p>
                <p className="font-bold truncate">
                  {user?.firstName} {user?.lastName} {COUNTRY_FLAGS[user?.country ?? "NG"]}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="font-black text-primary text-sm">{currencyFmt(myEntry.totalEarnings, user?.country)}</p>
              </div>
            </div>
          )}

          {/* Rankings */}
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : sorted.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Trophy size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No data yet — be the first to stake!</p>
              </div>
            ) : (
              sorted.map((entry) => {
                const isMe = entry.id === user?.id;
                const displayValue = tab === "earnings"
                  ? currencyFmt(entry.totalEarnings, entry.country)
                  : tab === "stakes"
                  ? `${entry.stakeCount} stake${entry.stakeCount !== 1 ? "s" : ""}`
                  : `${entry.referralCount} referral${entry.referralCount !== 1 ? "s" : ""}`;

                const initials = `${entry.firstName?.[0] ?? ""}${entry.lastName?.[0] ?? ""}`.toUpperCase() || "?";
                const rankGlow = entry.rank === 1 ? "border-yellow-500/40 bg-yellow-500/5" : entry.rank === 2 ? "border-slate-400/30 bg-slate-400/5" : entry.rank === 3 ? "border-amber-700/30 bg-amber-700/5" : "border-border";

                return (
                  <div
                    key={entry.id}
                    className={`bg-card border rounded-xl p-4 flex items-center gap-3 transition-all ${rankGlow} ${isMe ? "ring-2 ring-primary/40" : ""}`}
                  >
                    <RankBadge rank={entry.rank} />

                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-border" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {initials}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`font-bold text-sm truncate ${isMe ? "text-primary" : ""}`}>
                          {entry.firstName ?? "Anonymous"} {entry.lastName?.[0] ? entry.lastName[0] + "." : ""}
                          {isMe && <span className="text-xs text-primary ml-1">(you)</span>}
                        </p>
                        <span className="text-sm">{COUNTRY_FLAGS[entry.country] ?? ""}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.stakeCount} stake{entry.stakeCount !== 1 ? "s" : ""} · {entry.referralCount} referral{entry.referralCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm ${entry.rank <= 3 ? "text-primary" : "text-foreground"}`}>
                        {displayValue}
                      </p>
                      {tab === "earnings" && (
                        <p className="text-xs text-green-400">+{currencyFmt(entry.totalProfit, entry.country)} profit</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground pb-4">Updated in real-time · Only verified users are ranked</p>
        </div>
      </main>
    </div>
  );
}
