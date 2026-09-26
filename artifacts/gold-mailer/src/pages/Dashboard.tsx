import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Wallet,
  Users,
  CheckCircle2,
  ArrowUpRight,
  Share2,
  Copy,
  Check,
  Sparkles,
  Home,
  UserCheck,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AdUnit } from "@/components/AdUnit";

interface DashboardStats {
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  totalEarned: number;
}

interface TransactionItem {
  id: number | string;
  type: string;
  amount: string | number;
  status: string;
  createdAt?: string;
  date?: string;
}

interface SubmissionItem {
  id: number;
  websiteName: string;
  websiteUrl: string;
  proofText: string;
  status: string;
  earnedAmount: number;
  createdAt: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "referrals">("overview");
  const [copied, setCopied] = useState(false);

  // Real stats states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    balance: Number(user?.balance) || 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  });
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    referralCode: user?.referralCode || null,
    totalReferrals: 0,
    totalEarned: 0,
  });
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fetch real dashboard stats
    fetch("/api/user/dashboard", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        setDashboardStats({
          balance: typeof data.balance === "number" ? data.balance : Number(user?.balance) || 0,
          totalDeposited: data.totalDeposited || 0,
          totalWithdrawn: data.totalWithdrawn || 0,
          pendingDeposits: data.pendingDeposits || 0,
          pendingWithdrawals: data.pendingWithdrawals || 0,
        });
      })
      .catch(() => {});

    // Fetch real referral stats
    fetch("/api/user/referral", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        setReferralStats({
          referralCode: data.referralCode || user?.referralCode || null,
          totalReferrals: data.totalReferrals || 0,
          totalEarned: data.totalEarned || 0,
        });
      })
      .catch(() => {});

    // Fetch real transactions
    fetch("/api/transactions", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      })
      .catch(() => {});

    // Fetch real submissions
    fetch("/api/tasks/my", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        if (Array.isArray(data)) {
          setSubmissions(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const liveBalance = Number(user?.balance ?? dashboardStats.balance ?? 0);
  const referralCode = referralStats.referralCode || user?.referralCode || "GM" + (user?.id || "");
  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `https://goldmailer.com/register?ref=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Referral Link Copied!",
      description: "Share with friends to earn commission on their activity.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `Join me on Task Nest to complete simple tasks and earn payouts! Register here: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-[#00ff88] selection:text-black">
      {/* Desktop / Tablet Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-12 pt-6 px-4 sm:px-6 lg:pl-72 lg:pr-8 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-[#00ff88] font-black px-2.5 py-0.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#00ff88]" />
                DASHBOARD
              </span>
              <span className="text-xs text-[#888888] font-medium">Real-Time Stats</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
              Welcome back, <span className="text-white">{user?.firstName || "Worker"}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#888888] mt-1">
              Live account statistics, deposit & withdrawal tracking, and referral activity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/tasks"
              className="inline-flex items-center justify-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] text-black font-extrabold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#00ff88]/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse Tasks
              <ArrowUpRight size={17} className="stroke-[2.5]" />
            </Link>
          </div>
        </div>

        {user && !user.isVerified && (
          <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-amber-300">Account Verification Required</h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Complete your email verification to unlock all paid tasks, bonus rewards, and instant withdrawals. Check the bell icon above or click below.
                </p>
              </div>
            </div>
            <Link
              href="/verify-email"
              className="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow shrink-0"
            >
              Verify My Account &rarr;
            </Link>
          </div>
        )}
        {/* Featured Partner Offerwall Direct Card */}
        <div className="mb-6 rounded-2xl border border-[#00ff88]/30 bg-gradient-to-r from-[#00ff88]/10 via-[#141414] to-[#141414] p-5 sm:p-6 transition hover:border-[#00ff88]/50 shadow-lg shadow-[#00ff88]/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#00ff88] text-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  Partner Offerwall
                </span>
                <span className="text-xs font-semibold text-[#00ff88]">
                  Earn Extra Cash
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Complete Special Partner Tasks & Surveys
              </h3>
              <p className="text-xs sm:text-sm text-[#888888] max-w-xl">
                Unlock extra earnings by browsing interactive sponsor offers, quizzes, and micro-tasks directly on our official partner network.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href="/dashboard/surveys"
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#00ff88] px-4 py-3 text-sm font-black text-black hover:bg-[#00dd77] transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                CPX Surveys <ExternalLink size={15} />
              </Link>
              <Link
                href="/dashboard/bitlabs"
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#262626] border border-[#00ff88]/40 px-4 py-3 text-sm font-black text-[#00ff88] hover:bg-[#333333] transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                BitLabs Offers <ExternalLink size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* Ad Unit */}
        <div className="mb-6 flex justify-center">
          <AdUnit placement="dashboard" zoneId={import.meta.env.VITE_MONETAG_ZONE_DASHBOARD || "284730"} label="Sponsored" />
        </div>

        {/* Real Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Account Balance */}
          <div className="rounded-2xl bg-[#1a1a1a] border border-[#262626] p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Account Balance</span>
                <div className="w-8 h-8 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">
                  <Wallet size={16} className="text-[#00ff88]" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-2 tracking-tight">
                ${liveBalance.toFixed(2)}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#262626] flex items-center justify-between text-xs">
              <Link href="/withdraw" className="text-[#00ff88] hover:underline font-bold inline-flex items-center gap-1">
                Withdraw <ArrowUpRight size={12} />
              </Link>
              <Link href="/deposit" className="text-[#888888] hover:text-white font-medium">
                Deposit
              </Link>
            </div>
          </div>

          {/* Card 2: Total Deposited */}
          <div className="rounded-2xl bg-[#1a1a1a] border border-[#262626] p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Total Deposited</span>
                <div className="w-8 h-8 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">
                  <ArrowDownCircle size={16} className="text-[#00ff88]" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-2 tracking-tight">
                ${Number(dashboardStats.totalDeposited).toFixed(2)}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#262626] text-xs text-[#888888]">
              {dashboardStats.pendingDeposits > 0 ? (
                <span className="text-[#00ff88] font-medium">{dashboardStats.pendingDeposits} pending</span>
              ) : (
                <span>All approved</span>
              )}
            </div>
          </div>

          {/* Card 3: Total Withdrawn */}
          <div className="rounded-2xl bg-[#1a1a1a] border border-[#262626] p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Total Withdrawn</span>
                <div className="w-8 h-8 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">
                  <ArrowUpCircle size={16} className="text-[#00ff88]" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-2 tracking-tight">
                ${Number(dashboardStats.totalWithdrawn).toFixed(2)}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#262626] text-xs text-[#888888]">
              {dashboardStats.pendingWithdrawals > 0 ? (
                <span className="text-[#00ff88] font-medium">{dashboardStats.pendingWithdrawals} pending review</span>
              ) : (
                <span>Processed directly</span>
              )}
            </div>
          </div>

          {/* Card 4: Referrals */}
          <div className="rounded-2xl bg-[#1a1a1a] border border-[#262626] p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Referrals</span>
                <div className="w-8 h-8 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">
                  <Users size={16} className="text-[#00ff88]" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-2 tracking-tight">
                {referralStats.totalReferrals}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#262626] text-xs text-[#888888] truncate">
              Code: <span className="font-mono text-white font-bold">{referralCode}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#262626] pb-3">
          {[
            { key: "overview", label: "Overview & Submissions" },
            { key: "transactions", label: `Transactions (${transactions.length})` },
            { key: "referrals", label: "Referral Link" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? "bg-[#00ff88] text-black"
                  : "text-[#888888] hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview & Submissions */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Actions Bar */}
            <div className="rounded-2xl bg-[#1a1a1a] border border-[#262626] p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base">Quick Actions</h3>
                <p className="text-xs text-[#888888] mt-0.5">Manage your balance and explore opportunities</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href="/tasks"
                  className="inline-flex items-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  Browse Tasks <ArrowUpRight size={14} />
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 bg-[#1f1f1f] hover:bg-[#262626] border border-[#333333] hover:border-[#00ff88]/50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  <Share2 size={14} className="text-[#00ff88]" /> Link Social Accounts
                </Link>
                <Link
                  href="/post-task"
                  className="inline-flex items-center gap-2 bg-[#262626] hover:bg-[#333333] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  Post a Task
                </Link>
                <Link
                  href="/deposit"
                  className="inline-flex items-center gap-2 bg-[#262626] hover:bg-[#333333] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  Deposit Funds
                </Link>
                <Link
                  href="/withdraw"
                  className="inline-flex items-center gap-2 bg-[#262626] hover:bg-[#333333] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  Withdraw
                </Link>
              </div>
            </div>

            {/* Real Submissions Table */}
            <div className="rounded-2xl bg-[#1a1a1a] border border-[#262626] overflow-hidden">
              <div className="p-5 border-b border-[#262626] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">My Task Submissions</h3>
                  <p className="text-xs text-[#888888] mt-0.5">Tasks submitted for review and approval</p>
                </div>
                <Link href="/tasks" className="text-xs font-bold text-[#00ff88] hover:underline">
                  View Available Tasks →
                </Link>
              </div>

              {submissions.length === 0 ? (
                <div className="p-12 text-center">
                  <ClipboardList size={36} className="text-[#888888] mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white">No task submissions yet</p>
                  <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto">
                    Complete tasks from the marketplace and submit proof to earn real payouts.
                  </p>
                  <Link
                    href="/tasks"
                    className="inline-flex items-center gap-2 mt-4 bg-[#00ff88] hover:bg-[#00dd77] text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-all"
                  >
                    Explore Tasks
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#141414] text-[#888888] text-xs uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-5">Task</th>
                        <th className="py-3 px-5">Submitted Date</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626] text-white">
                      {submissions.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-5 font-semibold text-white">
                            {item.websiteName}
                          </td>
                          <td className="py-3.5 px-5 text-xs text-[#888888]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                          </td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                item.status === "approved"
                                  ? "text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/30"
                                  : item.status === "declined"
                                  ? "text-red-400 bg-red-500/10 border border-red-500/30"
                                  : "text-zinc-400 bg-zinc-800 border border-zinc-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right font-black text-[#00ff88]">
                            ${Number(item.earnedAmount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Real Transactions */}
        {activeTab === "transactions" && (
          <div className="rounded-2xl bg-[#1a1a1a] border border-[#262626] overflow-hidden">
            <div className="p-5 border-b border-[#262626] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Transactions History</h3>
                <p className="text-xs text-[#888888] mt-0.5">Approved and pending deposits and withdrawals</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/deposit"
                  className="bg-[#00ff88] text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg hover:bg-[#00dd77] transition-colors"
                >
                  Deposit
                </Link>
                <Link
                  href="/withdraw"
                  className="bg-[#262626] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-[#333333] transition-colors"
                >
                  Withdraw
                </Link>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <Clock size={36} className="text-[#888888] mx-auto mb-3" />
                <p className="text-sm font-semibold text-white">No transactions recorded yet</p>
                <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto">
                  Your deposits and withdrawals will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#141414] text-[#888888] text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-5">Date</th>
                      <th className="py-3 px-5">Type</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626] text-white">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-5 font-medium text-xs text-[#888888]">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : tx.date || "Recent"}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-white capitalize">
                          {tx.type}
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              tx.status === "approved"
                                ? "text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/30"
                                : tx.status === "rejected" || tx.status === "declined"
                                ? "text-red-400 bg-red-500/10 border border-red-500/30"
                                : "text-zinc-400 bg-zinc-800 border border-zinc-700"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-5 text-right font-black ${
                            tx.type === "deposit" ? "text-[#00ff88]" : "text-white"
                          }`}
                        >
                          ${Number(tx.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Referrals Section */}
        {activeTab === "referrals" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#1a1a1a] border border-[#262626] p-6 sm:p-8">
              <div className="max-w-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-[#00ff88] bg-[#00ff88]/10 px-3 py-1 rounded-full border border-[#00ff88]/20">
                  Referral Network
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">
                  Invite Workers & Advertisers
                </h2>
                <p className="text-sm text-[#888888] mt-2 leading-relaxed">
                  Share your unique referral link. When new users register with your link, they are automatically linked to your referral network.
                </p>

                {/* Referral Link Copy Box */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-2xl px-4 py-3 flex items-center justify-between text-sm text-zinc-300 font-mono overflow-hidden">
                    <span className="truncate">{referralLink}</span>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="inline-flex items-center justify-center gap-2 bg-[#262626] hover:bg-[#333333] text-white font-bold px-6 py-3 rounded-2xl border border-white/10 transition-all shrink-0 cursor-pointer"
                  >
                    {copied ? <Check size={18} className="text-[#00ff88]" /> : <Copy size={18} />}
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                {/* Share on WhatsApp Button */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={shareOnWhatsApp}
                    className="inline-flex items-center justify-center gap-2 bg-[#00ff88] hover:bg-[#00dd77] text-black font-extrabold px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-[#00ff88]/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Share2 size={18} className="stroke-[2.5]" />
                    Share on WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Referrals Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#1a1a1a] border border-[#262626] p-5 text-center">
                <p className="text-xs uppercase tracking-wider text-[#888888] font-semibold">Total Referrals</p>
                <p className="text-3xl font-black text-white mt-2">{referralStats.totalReferrals}</p>
                <p className="text-xs text-[#888888] mt-1">Users registered with your code</p>
              </div>
              <div className="rounded-2xl bg-[#1a1a1a] border border-[#262626] p-5 text-center">
                <p className="text-xs uppercase tracking-wider text-[#888888] font-semibold">Referral Code</p>
                <p className="text-3xl font-mono font-black text-[#00ff88] mt-2">{referralCode}</p>
                <p className="text-xs text-[#888888] mt-1">Active referral identifier</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation (Only Dashboard and Profile - Tasks, Refer & Earn, Withdraw removed as instructed) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#262626] md:hidden flex justify-around items-center py-2.5 px-2">
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer text-[#00ff88] transition-colors"
        >
          <Home size={20} />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/settings"
          className="flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer text-[#888888] hover:text-white transition-colors"
        >
          <UserCheck size={20} />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
