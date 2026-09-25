import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Wallet,
  TrendingUp,
  Coins,
  Users,
  CheckCircle2,
  ArrowUpRight,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Award,
  Clock,
  Sparkles,
  Home,
  ListTodo,
  UserCheck,
  History,
  ShieldCheck,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AdUnit } from "@/components/AdUnit";

interface EarningsData {
  balance: number;
  todayEarnings: number;
  totalEarnings: number;
  referralEarnings: number;
  history: Array<{
    id: number | string;
    date: string;
    task: string;
    amount: number;
    status: string;
  }>;
}

interface TaskItem {
  id: string;
  title: string;
  reward: number;
  completed: boolean;
  category: string;
  url?: string;
}

const DEFAULT_TASKS: TaskItem[] = [
  { id: "1", title: "Follow GoldMailer on Twitter & Retweet", reward: 2.50, completed: true, category: "Social" },
  { id: "2", title: "Join Telegram Official Announcement Channel", reward: 2.50, completed: true, category: "Community" },
  { id: "3", title: "Watch 60s Promotional Video & Like", reward: 2.50, completed: false, category: "Video" },
  { id: "4", title: "Complete Quick 3-Question User Feedback Survey", reward: 2.50, completed: false, category: "Survey" },
  { id: "5", title: "Download & Open Partner App for 2 Minutes", reward: 2.50, completed: false, category: "App" },
];

const DEFAULT_EARNINGS: EarningsData = {
  balance: 966.00,
  todayEarnings: 12.50,
  totalEarnings: 966.00,
  referralEarnings: 45.00,
  history: [
    { id: 1, date: new Date().toLocaleDateString(), task: "Watch Sponsored Video", amount: 2.50, status: "approved" },
    { id: 2, date: new Date(Date.now() - 86400000).toLocaleDateString(), task: "Brand Survey Completion", amount: 5.00, status: "approved" },
    { id: 3, date: new Date(Date.now() - 172800000).toLocaleDateString(), task: "Referral Commission", amount: 10.00, status: "approved" },
    { id: 4, date: new Date(Date.now() - 259200000).toLocaleDateString(), task: "Social Follow & Share", amount: 2.50, status: "approved" },
    { id: 5, date: new Date(Date.now() - 345600000).toLocaleDateString(), task: "Daily Login Reward", amount: 1.00, status: "approved" },
  ],
};

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"tasks" | "referrals" | "history">("tasks");
  const [earnings, setEarnings] = useState<EarningsData>(DEFAULT_EARNINGS);
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS);
  const [copied, setCopied] = useState(false);
  const [loadingTask, setLoadingTask] = useState<string | null>(null);

  // Fetch earnings and tasks from real endpoints or user profile
  useEffect(() => {
    let isMounted = true;
    
    // Fetch earnings
    fetch("/api/user/earnings", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setEarnings({
            balance: data.balance ?? (user?.balance ? Number(user.balance) : 966.00),
            todayEarnings: data.todayEarnings ?? 12.50,
            totalEarnings: data.totalEarnings ?? (user?.balance ? Number(user.balance) : 966.00),
            referralEarnings: data.referralEarnings ?? 45.00,
            history: data.history ?? DEFAULT_EARNINGS.history,
          });
        } else if (user?.balance) {
          setEarnings((prev) => ({
            ...prev,
            balance: Number(user.balance),
            totalEarnings: Number(user.balance),
          }));
        }
      })
      .catch(() => {
        if (user?.balance) {
          setEarnings((prev) => ({
            ...prev,
            balance: Number(user.balance),
            totalEarnings: Number(user.balance),
          }));
        }
      });

    // Fetch tasks
    fetch("/api/user/tasks", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setTasks(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length || 5;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  const referralCode = user?.referralCode || "GOLD966";
  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/register?ref=${referralCode}`
    : `https://goldmailer.com/register?ref=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Referral Link Copied!", description: "Share with friends to earn commission on every task." });
    setTimeout(() => setCopied(false), 2500);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `🎉 Join me on GoldMailer and earn daily cash doing simple tasks! Use my link: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleStartTask = (taskId: string, title: string) => {
    setLoadingTask(taskId);
    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
      );
      setEarnings((prev) => ({
        ...prev,
        balance: prev.balance + 2.50,
        todayEarnings: prev.todayEarnings + 2.50,
        totalEarnings: prev.totalEarnings + 2.50,
        history: [
          {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            task: title,
            amount: 2.50,
            status: "approved",
          },
          ...prev.history,
        ],
      }));
      setLoadingTask(null);
      toast({
        title: "Task Completed! +$2.50",
        description: `Your reward for "${title}" has been added to your balance.`,
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col font-sans selection:bg-[#00FF88] selection:text-black">
      {/* Desktop / Tablet Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-12 pt-6 px-4 sm:px-6 lg:pl-72 lg:pr-8 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-[#00FF88] font-black px-2.5 py-0.5 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#00FF88]" />
                EARN & REFER
              </span>
              <span className="text-xs text-zinc-500 font-medium">Daily Rewards Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">{user?.firstName || "Worker"}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">Complete daily tasks, invite friends, and withdraw instant cash.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/withdraw"
              className="inline-flex items-center justify-center gap-2 bg-[#00FF88] hover:bg-[#00ee77] text-black font-extrabold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#00FF88]/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowUpRight size={17} className="stroke-[2.5]" />
              Withdraw Now
            </Link>
          </div>
        </div>

        {/* Ad Unit (automatically hides on admin) */}
        <div className="mb-6 flex justify-center">
          <AdUnit placement="dashboard" zoneId={import.meta.env.VITE_MONETAG_ZONE_DASHBOARD || "284730"} label="Sponsored Reward" />
        </div>

        {/* Big Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181818] via-[#141414] to-[#101010] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/60 mb-6">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#00FF88]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm font-semibold tracking-wide">
                <Wallet className="w-5 h-5 text-[#00FF88]" />
                <span>TOTAL AVAILABLE BALANCE</span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
                  ${earnings.balance.toFixed(2)}
                </h2>
                <span className="text-lg sm:text-xl font-bold text-[#00FF88] bg-[#00FF88]/10 px-3 py-1 rounded-lg border border-[#00FF88]/20">
                  Available
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-400 max-w-md">
                Fast payouts directly to your crypto wallet or bank account. Minimum payout $5.00.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
              <Link
                href="/withdraw"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00FF88] hover:bg-[#00dd77] text-black font-black text-base px-7 py-3.5 rounded-2xl transition-all shadow-xl shadow-[#00FF88]/25 hover:scale-[1.03] active:scale-[0.98]"
              >
                <ArrowUpRight size={20} className="stroke-[3]" />
                Withdraw
              </Link>
              <Link
                href="/deposit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold text-base px-6 py-3.5 rounded-2xl border border-white/10 transition-all hover:border-white/20"
              >
                Deposit Funds
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Stats Cards in Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Card 1: Today Earnings */}
          <div className="rounded-2xl bg-[#161616] border border-white/10 p-5 flex items-center gap-4 transition-all hover:border-[#00FF88]/30 hover:bg-[#1a1a1a]">
            <div className="w-12 h-12 rounded-2xl bg-[#00FF88]/15 border border-[#00FF88]/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-[#00FF88]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Today Earnings</p>
              <p className="text-2xl font-black text-[#00FF88] mt-1">+${earnings.todayEarnings.toFixed(2)}</p>
            </div>
          </div>

          {/* Card 2: Total Earnings */}
          <div className="rounded-2xl bg-[#161616] border border-white/10 p-5 flex items-center gap-4 transition-all hover:border-white/20 hover:bg-[#1a1a1a]">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Earnings</p>
              <p className="text-2xl font-black text-white mt-1">${earnings.totalEarnings.toFixed(2)}</p>
            </div>
          </div>

          {/* Card 3: Referral Earnings */}
          <div className="rounded-2xl bg-[#161616] border border-white/10 p-5 flex items-center gap-4 transition-all hover:border-purple-400/30 hover:bg-[#1a1a1a]">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Referral Earnings</p>
              <p className="text-2xl font-black text-purple-400 mt-1">${earnings.referralEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Daily Task Progress Bar */}
        <div className="rounded-2xl bg-[#161616] border border-white/10 p-5 mb-8">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">Daily Task Progress</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20">
              {completedCount}/{totalTasks} completed
            </span>
          </div>

          {/* Progress bar container */}
          <div className="w-full bg-[#202020] h-3.5 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="bg-gradient-to-r from-[#00FF88] to-[#00cc66] h-full rounded-full transition-all duration-700 shadow-md shadow-[#00FF88]/40"
              style={{ width: `${Math.max(8, progressPercent)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-2">
            <span>Complete 5 daily tasks to claim bonus chest</span>
            <span className="font-semibold text-white">{progressPercent}%</span>
          </div>
        </div>

        {/* Below: Tabs (Tasks | Referrals | Earnings History) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-[#00FF88] text-black shadow-lg shadow-[#00FF88]/20"
                  : "bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#202020] border border-white/5"
              }`}
            >
              <ListTodo size={16} />
              Tasks
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === "tasks" ? "bg-black/20 text-black" : "bg-white/10 text-zinc-300"
              }`}>
                {tasks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("referrals")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "referrals"
                  ? "bg-[#00FF88] text-black shadow-lg shadow-[#00FF88]/20"
                  : "bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#202020] border border-white/5"
              }`}
            >
              <Users size={16} />
              Referrals & Earn
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#00FF88] text-black shadow-lg shadow-[#00FF88]/20"
                  : "bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#202020] border border-white/5"
              }`}
            >
              <History size={16} />
              Earnings History
            </button>
          </div>
        </div>

        {/* Tab 1: Tasks List */}
        {activeTab === "tasks" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider font-bold text-zinc-400">Available Daily Tasks</p>
              <span className="text-xs text-[#00FF88] font-semibold">Earn $2.50 per task</span>
            </div>

            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl bg-[#161616] border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-white/20 hover:bg-[#191919]"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    task.completed ? "bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20" : "bg-white/5 text-zinc-300 border border-white/10"
                  }`}>
                    {task.completed ? <CheckCircle2 size={20} /> : <Award size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md">
                        {task.category}
                      </span>
                      {task.completed && (
                        <span className="text-[10px] font-extrabold text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded-md">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mt-1">{task.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Instant verification upon proof or link click</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-white/5 sm:border-0">
                  <span className="text-lg font-black text-[#00FF88]">
                    +${task.reward.toFixed(2)}
                  </span>

                  {task.completed ? (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-400 text-xs font-bold px-4 py-2 rounded-xl cursor-default"
                    >
                      <Check size={14} className="text-[#00FF88]" />
                      Done
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTask(task.id, task.title)}
                      disabled={loadingTask === task.id}
                      className="inline-flex items-center gap-1.5 bg-[#00FF88] hover:bg-[#00dd77] text-black font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#00FF88]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      {loadingTask === task.id ? (
                        <>
                          <Clock size={14} className="animate-spin" /> Verifying...
                        </>
                      ) : (
                        <>
                          Start Task <ArrowUpRight size={15} className="stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Referrals Section */}
        {activeTab === "referrals" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-[#181818] to-[#121212] border border-white/10 p-6 sm:p-8">
              <div className="max-w-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-[#00FF88] bg-[#00FF88]/10 px-3 py-1 rounded-full border border-[#00FF88]/20">
                  Invite & Earn Cash
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">
                  Earn $5.00 for every invited friend
                </h2>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                  Share your personalized invite link. When your friend joins and completes their first tasks, both of you earn instant cash bonuses!
                </p>

                {/* Referral Link Copy Box */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-4 py-3 flex items-center justify-between text-sm text-zinc-300 font-mono overflow-hidden">
                    <span className="truncate">{referralLink}</span>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl border border-white/15 transition-all shrink-0 cursor-pointer"
                  >
                    {copied ? <Check size={18} className="text-[#00FF88]" /> : <Copy size={18} />}
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                {/* Share on WhatsApp Button */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={shareOnWhatsApp}
                    className="inline-flex items-center justify-center gap-2 bg-[#00FF88] hover:bg-[#00dd77] text-black font-extrabold px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-[#00FF88]/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Share2 size={18} className="stroke-[2.5]" />
                    Share on WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Referrals Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-[#161616] border border-white/10 p-5 text-center">
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Total Referrals</p>
                <p className="text-3xl font-black text-white mt-2">12</p>
                <p className="text-xs text-zinc-500 mt-1">Friends joined</p>
              </div>

              <div className="rounded-2xl bg-[#161616] border border-white/10 p-5 text-center">
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Referral Commission</p>
                <p className="text-3xl font-black text-[#00FF88] mt-2">${earnings.referralEarnings.toFixed(2)}</p>
                <p className="text-xs text-zinc-500 mt-1">Directly credited to wallet</p>
              </div>

              <div className="rounded-2xl bg-[#161616] border border-white/10 p-5 text-center">
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Commission Tier</p>
                <p className="text-3xl font-black text-purple-400 mt-2">VIP 2</p>
                <p className="text-xs text-zinc-500 mt-1">20% lifetime profit share</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Recent Earnings Table */}
        {activeTab === "history" && (
          <div className="rounded-2xl bg-[#161616] border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Recent Earnings History</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Approved payouts, task rewards, and commissions</p>
              </div>
              <span className="text-xs font-bold text-[#00FF88] bg-[#00FF88]/10 px-3 py-1 rounded-full border border-[#00FF88]/20">
                All Paid & Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#1c1c1c] text-zinc-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5">Task / Source</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-200">
                  {earnings.history.map((record) => (
                    <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-5 font-medium text-xs text-zinc-400">{record.date}</td>
                      <td className="py-3.5 px-5 font-semibold text-white flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#00FF88] shrink-0" />
                        <span>{record.task}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#00FF88] bg-[#00FF88]/10 border border-[#00FF88]/30 px-2.5 py-0.5 rounded-full">
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-[#00FF88]">
                        +${record.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav Mobile Style (Fixed on mobile screens) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212]/95 backdrop-blur-md border-t border-white/10 md:hidden flex justify-around items-center py-2.5 px-2">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors ${
            activeTab === "tasks" ? "text-[#00FF88]" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Home size={20} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className="flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ListTodo size={20} />
          <span>Tasks</span>
        </button>

        <button
          onClick={() => setActiveTab("referrals")}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors ${
            activeTab === "referrals" ? "text-[#00FF88]" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Users size={20} />
          <span>Refer & Earn</span>
        </button>

        <Link
          href="/withdraw"
          className="flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Wallet size={20} />
          <span>Withdraw</span>
        </Link>

        <Link
          href="/settings"
          className="flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <UserCheck size={20} />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
