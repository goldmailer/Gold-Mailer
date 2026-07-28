import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetStakes, useClaimDailyReward,
  getGetDashboardQueryKey, getGetStakesQueryKey, getGetMeQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fmt as currencyFmt } from "@/lib/currency";

function DiamondSVG({ spinning }: { spinning: boolean }) {
  return (
    <div
      className={`relative select-none ${spinning ? "animate-diamond-spin" : "animate-diamond-float"}`}
      style={{ width: 96, height: 96 }}
    >
      {/* Glow ring */}
      <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl scale-150" />
      {/* Diamond shape */}
      <svg viewBox="0 0 100 100" className="relative z-10 drop-shadow-[0_0_16px_rgba(103,232,249,0.7)]" style={{ width: 96, height: 96 }}>
        <defs>
          <linearGradient id="dg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="30%" stopColor="#7dd3fc" />
            <stop offset="65%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="dg2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0fdff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.7" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Main diamond hex */}
        <polygon points="50,8 88,30 88,70 50,92 12,70 12,30" fill="url(#dg1)" filter="url(#glow)" opacity="0.95" />
        {/* Top highlight facet */}
        <polygon points="50,8 88,30 50,42" fill="url(#dg2)" opacity="0.6" />
        {/* Left facet */}
        <polygon points="12,30 50,42 50,92 12,70" fill="#0ea5e9" opacity="0.25" />
        {/* Right facet */}
        <polygon points="88,30 50,42 50,92 88,70" fill="#818cf8" opacity="0.2" />
        {/* Center sparkle */}
        <circle cx="50" cy="38" r="3" fill="white" opacity="0.9" />
        <line x1="50" y1="33" x2="50" y2="43" stroke="white" strokeWidth="1" opacity="0.7" />
        <line x1="45" y1="38" x2="55" y2="38" stroke="white" strokeWidth="1" opacity="0.7" />
      </svg>
      {/* Sparkle particles */}
      <div className="absolute top-0 right-2 w-2 h-2 rounded-full bg-cyan-200 blur-sm opacity-80 animate-ping" style={{ animationDelay: "0.3s" }} />
      <div className="absolute bottom-2 left-1 w-1.5 h-1.5 rounded-full bg-sky-300 blur-sm opacity-60 animate-ping" style={{ animationDelay: "0.9s" }} />
    </div>
  );
}

/** Time until next midnight */
function useNextMidnight() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    function calc() {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${h}h ${m}m ${s}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return label;
}

export function DailyDiamond() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [spinning, setSpinning] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const nextReset = useNextMidnight();

  const { data: stakes } = useGetStakes();
  const fmt = (n: number) => currencyFmt(n, user?.country);

  // Find first claimable active stake
  const claimableStake = Array.isArray(stakes)
    ? stakes.find((s: any) => s.status === "active" && !s.dailyClaimedToday)
    : null;

  const claimMutation = useClaimDailyReward({
    mutation: {
      onSuccess: (data: any) => {
        setJustClaimed(true);
        toast({
          title: "💎 Diamond Reward Claimed!",
          description: `+${fmt(data.amount)} added to your balance.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStakesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setTimeout(() => setSpinning(false), 700);
      },
      onError: (err: any) => {
        toast({
          title: "Already claimed",
          description: err?.data?.error || "Come back tomorrow for your next diamond reward.",
          variant: "destructive",
        });
        setSpinning(false);
      },
    },
  });

  const handleTap = () => {
    if (spinning || claimMutation.isPending) return;
    setSpinning(true);
    if (claimableStake) {
      setTimeout(() => {
        claimMutation.mutate({ id: (claimableStake as any).id });
      }, 300);
    } else {
      setTimeout(() => setSpinning(false), 700);
      if (!Array.isArray(stakes) || stakes.length === 0) {
        toast({ title: "No active stake", description: "Start a stake to earn daily diamond rewards." });
      } else {
        toast({ title: "Already claimed", description: `Come back in ${nextReset}` });
      }
    }
  };

  const allClaimed = Array.isArray(stakes) && stakes.length > 0 && !claimableStake;
  const noStakes = !Array.isArray(stakes) || stakes.length === 0;

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 via-sky-500/5 to-indigo-500/8 rounded-2xl" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent rounded-full" />

      <div className="relative z-10 text-center">
        <p className="text-xs text-cyan-400 font-semibold uppercase tracking-widest mb-1">Daily Diamond</p>
        <p className="text-sm text-muted-foreground">
          {noStakes
            ? "Start a stake to unlock"
            : allClaimed || justClaimed
            ? `Next in ${nextReset}`
            : "Tap to claim your reward"}
        </p>
      </div>

      {/* Diamond */}
      <button
        onClick={handleTap}
        disabled={spinning || claimMutation.isPending || noStakes || (allClaimed && !claimableStake)}
        className={`relative z-10 transition-transform active:scale-90 ${
          noStakes || (allClaimed && !claimableStake)
            ? "opacity-40 cursor-not-allowed"
            : "cursor-pointer hover:scale-105"
        }`}
        aria-label="Claim daily diamond reward"
      >
        <DiamondSVG spinning={spinning} />
      </button>

      {/* Status */}
      <div className="relative z-10 text-center">
        {noStakes ? (
          <p className="text-xs text-muted-foreground">Requires an active stake</p>
        ) : allClaimed && !justClaimed ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
            Resets at midnight
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Reward available
          </div>
        )}
      </div>
    </div>
  );
}
