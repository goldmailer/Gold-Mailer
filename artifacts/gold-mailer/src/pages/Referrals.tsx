import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, Check, Gift } from "lucide-react";

type ReferralEntry = { email: string; joinedAt: string };
type ReferralData = { referralCode: string | null; referrals: ReferralEntry[]; totalReferrals: number };

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, user.length - 2))}@${domain}`;
}

export default function Referrals() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ["user-referrals"],
    queryFn: async () => {
      const res = await fetch("/api/user/referrals", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load referrals");
      return res.json();
    },
  });

  const referralLink = data?.referralCode
    ? `${window.location.origin}/register?ref=${data.referralCode}`
    : "";

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16 pt-16 max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-1">Referrals</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Invite friends and earn when they join GoldMailer
        </p>

        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Your Referral Link
          </p>
          {isLoading ? (
            <div className="h-9 bg-background rounded-lg animate-pulse" />
          ) : (
            <div className="flex gap-2 items-center">
              <code className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2.5 text-muted-foreground truncate">
                {referralLink || "Loading..."}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0 border-border"
                disabled={!referralLink}
              >
                {copied ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} />
                )}
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Share this link — when a friend registers through it you're both tracked
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Referred</p>
            </div>
            <p className="text-2xl font-black text-primary">
              {isLoading ? "—" : (data?.totalReferrals ?? 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift size={16} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Code</p>
            </div>
            <p className="text-lg font-black text-foreground tracking-widest">
              {isLoading ? "—" : (data?.referralCode ?? "N/A")}
            </p>
          </div>
        </div>

        <h2 className="font-bold mb-3 text-xs text-muted-foreground uppercase tracking-wider">
          People You Referred ({data?.totalReferrals ?? 0})
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !data?.referrals.length ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <Users size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold mb-1">No referrals yet</p>
            <p className="text-muted-foreground text-sm">
              Share your referral link above to invite friends
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.referrals.map((r, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-sm">{maskEmail(r.email)}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined{" "}
                    {new Date(r.joinedAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-1 rounded-md">
                  Referred
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
