import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, CheckCircle2, ChevronRight, Search, ShieldCheck, Sparkles, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdUnit } from "@/components/AdUnit";
import { PopunderAd } from "@/components/PopunderAd";
import { EarthGlobe } from "@/components/EarthGlobe";
import { categories } from "@/lib/marketplace";

const featured = [
  { type: "YouTube Watch & Subscribe", title: "Watch a short video and subscribe", pay: "$0.80" },
  { type: "Social Follow & Like", title: "Follow a creator and like their latest post", pay: "$0.55" },
  { type: "Survey & Feedback", title: "Share your opinion in a 3-minute survey", pay: "$1.25" },
];

export default function MarketplaceHome() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({ users: 0, payouts: 0, payoutAmount: 0 });

  useEffect(() => {
    let active = true;
    fetch("/api/public/stats")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data) {
          setStats({
            users: Number(data.users) || 0,
            payouts: Number(data.payouts) || 0,
            payoutAmount: Number(data.payoutAmount) || 0,
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const formatMetric = (value: number) => value.toLocaleString("en-US");
  const formatCurrency = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0a0a0a] text-white selection:bg-[#00ff88] selection:text-black">
      <PopunderAd />

      {/* Black Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1a1a1a]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-5 lg:px-8">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2.5">
            <img src="/favicon.svg" alt="Task Nest" className="h-9 w-9 rounded-xl" />
            <span className="truncate text-base font-black tracking-tight sm:text-lg text-white">
              Task <span className="text-[#00ff88]">Nest</span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              className="text-white hover:text-[#00ff88] hover:bg-[#1a1a1a] px-3 sm:px-4 font-semibold text-sm"
              onClick={() => setLocation("/login")}
            >
              Sign in
            </Button>
            <Button
              onClick={() => setLocation("/register")}
              className="bg-[#00ff88] hover:bg-[#00dd77] px-4 font-black text-black sm:px-5 rounded-xl shadow-lg shadow-[#00ff88]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Join free
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-w-0 border-b border-[#1a1a1a] px-4 pb-20 pt-12 sm:px-5 lg:px-8 lg:pb-28 lg:pt-20 bg-[#0a0a0a]">
          <div className="pointer-events-none absolute -left-40 -top-32 h-[460px] w-[460px] rounded-full bg-[#00ff88]/10 blur-[140px]" />
          <div className="pointer-events-none absolute right-0 top-20 h-[360px] w-[360px] rounded-full bg-[#00ff88]/5 blur-[140px]" />

          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00ff88]/30 bg-[#00ff88]/10 px-3 py-1.5 text-xs font-bold text-[#00ff88]">
                <Sparkles size={14} /> The task marketplace that pays
              </div>
              <h1 className="max-w-3xl text-[2.65rem] font-black leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-7xl text-white">
                Earn real money doing <span className="text-[#00ff88]">simple tasks.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[#888888] sm:text-lg">
                Find social, survey, review, and app tasks from advertisers around the world. Complete them, submit proof, and build your balance.
              </p>

              {/* Search Box */}
              <div className="mt-8 flex w-full max-w-xl flex-col gap-2 rounded-2xl border border-[#262626] bg-[#1a1a1a] p-2 shadow-2xl shadow-black sm:flex-row sm:items-center">
                <Search className="ml-3 hidden shrink-0 text-[#888888] sm:block" size={20} />
                <input
                  className="min-w-0 w-full flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-[#888888] outline-none"
                  placeholder="What do you want to earn from?"
                  onKeyDown={(event) => event.key === "Enter" && setLocation("/tasks")}
                />
                <Button
                  onClick={() => setLocation("/tasks")}
                  className="w-full shrink-0 bg-[#00ff88] hover:bg-[#00dd77] font-black text-black sm:w-auto px-5 rounded-xl shadow-md transition-all"
                >
                  Browse tasks
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#888888]">
                {["Free to join", "Proof-based approval", "Crypto withdrawals"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} className="text-[#00ff88]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-w-0 flex items-center justify-center">
              <EarthGlobe />
            </div>
          </div>

          <div className="relative mx-auto mt-10 flex min-w-0 justify-center">
            <AdUnit
              placement="heroPage"
              zoneId={import.meta.env.VITE_MONETAG_ZONE_HERO || "284203"}
              size="leaderboard"
              label="Sponsored"
            />
          </div>
        </section>

        {/* Categories Section */}
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 bg-[#0a0a0a]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00ff88]">
                Explore the marketplace
              </p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                Pick a lane. Get paid.
              </h2>
            </div>
            <Link href="/tasks" className="hidden items-center gap-1 text-sm font-bold text-[#00ff88] hover:underline sm:flex">
              All tasks <ChevronRight size={16} />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.label}
                href={`/tasks?type=${encodeURIComponent(category.type)}`}
                className="group min-w-0 rounded-2xl border border-[#262626] bg-[#1a1a1a] p-4 transition-all hover:-translate-y-1 hover:border-[#00ff88]/50 sm:p-5"
              >
                <span className="text-2xl text-[#00ff88]">{category.icon}</span>
                <p className="mt-4 text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors">
                  {category.label}
                </p>
                <p className="mt-1 text-xs text-[#888888]">
                  Browse tasks{" "}
                  <ArrowRight size={12} className="inline transition group-hover:translate-x-1" />
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Tasks Section */}
        <section className="bg-[#0f0f0f] border-y border-[#1a1a1a] px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00ff88]">
                  Fresh opportunities
                </p>
                <h2 className="mt-2 text-3xl font-black text-white">Featured tasks</h2>
              </div>
              <Link href="/tasks" className="flex items-center gap-1 text-sm font-bold text-[#00ff88] hover:underline">
                View all <ChevronRight size={16} />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {featured.map((task) => (
                <div
                  key={task.title}
                  className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-5 hover:border-[#00ff88]/40 transition-colors"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="rounded-full bg-[#0a0a0a] border border-[#262626] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#888888]">
                      {task.type}
                    </span>
                    <span className="text-lg font-black text-[#00ff88]">{task.pay}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{task.title}</h3>
                  <p className="mt-2 text-sm text-[#888888]">Proof required · Fast review</p>
                  <Link
                    href="/register"
                    className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#00ff88] hover:underline"
                  >
                    View task <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Three Steps Section */}
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 bg-[#0a0a0a]">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00ff88]">
                Simple by design
              </p>
              <h2 className="mt-2 text-4xl font-black text-white">
                From signup to payout in three steps.
              </h2>
              <p className="mt-4 text-[#888888] leading-relaxed">
                Advertisers fund tasks. Workers complete them. Our review flow keeps both sides accountable and rewards instant.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Users, title: "Create an account", copy: "Join free and set up your worker profile in seconds." },
                { icon: WalletCards, title: "Complete tasks", copy: "Follow instructions carefully and upload proof." },
                { icon: ShieldCheck, title: "Get paid", copy: "Approved earnings go directly to your verified balance." },
              ].map(({ icon: Icon, title, copy }, index) => (
                <div key={title} className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-5">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#00ff88]/15 text-[#00ff88]">
                    <Icon size={19} />
                  </div>
                  <span className="text-xs font-black text-[#00ff88]">0{index + 1}</span>
                  <h3 className="mt-2 font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#888888]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sponsor Banner */}
        <section className="px-5 pb-16 lg:px-8 bg-[#0a0a0a]">
          <div className="mx-auto max-w-7xl">
            <AdUnit
              placement="general"
              zoneId={import.meta.env.VITE_MONETAG_ZONE_FOOTER || "284731"}
              label="Sponsored"
            />
          </div>
        </section>
      </main>

      {/* Black Footer */}
      <footer className="border-t border-[#1a1a1a] bg-[#0a0a0a] px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#888888] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Task Nest</span>
          <div className="flex flex-wrap gap-5">
            <Link href="/about" className="hover:text-white transition-colors">
              About us
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span className="text-zinc-500">Simple tasks. Clear proof. Real payouts.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
