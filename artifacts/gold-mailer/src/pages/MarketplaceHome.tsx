import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, CheckCircle2, ChevronRight, CircleDollarSign, Search, ShieldCheck, Sparkles, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonetagAd } from "@/components/MonetagAd";
import { PopunderAd } from "@/components/PopunderAd";
import { categories } from "@/lib/marketplace";

const featured = [
  { type: "YouTube Watch & Subscribe", title: "Watch a short video and subscribe", pay: "$0.80", color: "from-red-500/20" },
  { type: "Instagram Follow/Like/Comment", title: "Follow a creator and like their latest post", pay: "$0.55", color: "from-pink-500/20" },
  { type: "Survey/Questionnaire", title: "Share your opinion in a 3-minute survey", pay: "$1.25", color: "from-blue-500/20" },
];

export default function MarketplaceHome() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({ users: 0, payouts: 0, payoutAmount: 0 });

  useEffect(() => {
    let active = true;
    fetch("/api/public/stats")
      .then((response) => response.ok ? response.json() : null)
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
    return () => { active = false; };
  }, []);

  const formatMetric = (value: number) => value.toLocaleString("en-US");
  const formatCurrency = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <PopunderAd />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">G</span>
          <span className="text-lg font-black tracking-tight">GoldMailer<span className="text-primary">Tasks</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setLocation("/login")}>Sign in</Button>
          <Button onClick={() => setLocation("/register")} className="bg-primary text-primary-foreground font-bold">Join free</Button>
        </div>
      </nav>

      <main>
        <section className="relative border-b border-white/5 px-5 pb-20 pt-12 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="pointer-events-none absolute -left-40 -top-32 h-[460px] w-[460px] rounded-full bg-primary/10 blur-[130px]" />
          <div className="pointer-events-none absolute right-0 top-20 h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                <Sparkles size={14} /> The task marketplace that pays
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Earn real money doing <span className="text-primary">simple tasks.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Find social, survey, review, and app tasks from advertisers around the world. Complete them, submit proof, and build your balance.
              </p>
              <div className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-card p-2 shadow-2xl shadow-black/20">
                <Search className="ml-3 text-muted-foreground" size={20} />
                <input className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none" placeholder="What do you want to earn from?" onKeyDown={(event) => event.key === "Enter" && setLocation("/tasks")} />
                <Button onClick={() => setLocation("/tasks")} className="bg-primary text-primary-foreground font-bold">Browse tasks</Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {["Free to join", "Proof-based approval", "Crypto withdrawals"].map((item) => <span key={item} className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" />{item}</span>)}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-8 rounded-[3rem] bg-primary/15 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-card/90 p-5 shadow-2xl backdrop-blur">
                <div className="mb-5 flex items-center justify-between">
                  <div><p className="text-xs text-muted-foreground">Your potential today</p><p className="text-3xl font-black">$24.80</p></div>
                  <div className="rounded-xl bg-green-500/10 p-3 text-green-400"><CircleDollarSign size={24} /></div>
                </div>
                {[["Website Visit & Click", "Complete a 60-second visit", "$0.45"], ["Review on Google/Trustpilot", "Share an honest experience", "$1.10"], ["App Install & Review", "Try a new productivity app", "$2.40"]].map(([type, title, pay], index) => (
                  <div key={type} className="mb-3 flex items-center gap-3 rounded-xl border border-white/5 bg-background/70 p-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${["from-primary/30", "from-blue-500/30", "from-purple-500/30"][index]} to-transparent`} />
                    <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold text-primary">{type}</p><p className="truncate text-sm font-semibold">{title}</p></div>
                    <span className="font-black text-green-400">{pay}</span>
                  </div>
                ))}
                <Button onClick={() => setLocation("/register")} className="mt-2 w-full bg-primary text-primary-foreground font-bold">Start earning <ArrowRight size={15} /></Button>
              </div>
            </div>
          </div>
          <div className="relative mx-auto mt-10 flex justify-center"><MonetagAd zoneId={import.meta.env.VITE_MONETAG_ZONE_HERO} size="leaderboard" label="Sponsored" /></div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Explore the marketplace</p><h2 className="mt-2 text-3xl font-black">Pick a lane. Get paid.</h2></div><Link href="/tasks" className="hidden items-center gap-1 text-sm font-bold text-primary sm:flex">All tasks <ChevronRight size={16} /></Link></div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => <Link key={category.label} href={`/tasks?type=${encodeURIComponent(category.type)}`} className="group rounded-2xl border border-white/5 bg-card p-5 transition hover:-translate-y-1 hover:border-primary/35"><span className="text-2xl text-primary">{category.icon}</span><p className="mt-4 text-sm font-bold">{category.label}</p><p className="mt-1 text-xs text-muted-foreground">Browse tasks <ArrowRight size={12} className="inline transition group-hover:translate-x-1" /></p></Link>)}
          </div>
        </section>

        <section className="bg-card/30 px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl"><div className="flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Fresh opportunities</p><h2 className="mt-2 text-3xl font-black">Featured tasks</h2></div><Link href="/tasks" className="flex items-center gap-1 text-sm font-bold text-primary">View all <ChevronRight size={16} /></Link></div><div className="mt-8 grid gap-4 md:grid-cols-3">{featured.map((task) => <div key={task.title} className={`rounded-2xl border border-white/5 bg-gradient-to-br ${task.color} to-card p-5`}><div className="mb-8 flex items-center justify-between"><span className="rounded-full bg-background/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{task.type}</span><span className="text-lg font-black text-green-400">{task.pay}</span></div><h3 className="text-lg font-bold">{task.title}</h3><p className="mt-2 text-sm text-muted-foreground">Proof required · 24 spots left</p><Link href="/register" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">View task <ArrowRight size={14} /></Link></div>)}</div></div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Simple by design</p><h2 className="mt-2 text-4xl font-black">From signup to payout in three steps.</h2><p className="mt-4 text-muted-foreground">Advertisers fund tasks. Workers complete them. Our review flow keeps both sides accountable.</p></div><div className="grid gap-4 sm:grid-cols-3">{[{icon: Users, title: "Create an account", copy: "Join free and set up your profile."}, {icon: WalletCards, title: "Complete tasks", copy: "Follow instructions and upload proof."}, {icon: ShieldCheck, title: "Get paid", copy: "Approved earnings go to your wallet."}].map(({ icon: Icon, title, copy }, index) => <div key={title} className="rounded-2xl border border-white/5 bg-card p-5"><div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon size={19} /></div><span className="text-xs font-black text-primary">0{index + 1}</span><h3 className="mt-2 font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p></div>)}</div></div>
        </section>

        <section className="px-5 pb-20 lg:px-8"><div className="mx-auto max-w-7xl"><MonetagAd zoneId={import.meta.env.VITE_MONETAG_ZONE_FOOTER} label="Sponsored" /><div className="mt-16 grid gap-5 md:grid-cols-3">{[[formatMetric(stats.users), "registered workers"], [formatMetric(stats.payouts), "approved payouts"], [formatCurrency(stats.payoutAmount), "paid to workers"]].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/5 bg-card p-6 text-center"><p className="text-3xl font-black text-primary">{value}</p><p className="mt-2 text-sm text-muted-foreground">{label}</p></div>)}</div></div></section>
      </main>
       <footer className="border-t border-white/5 px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>© 2026 GoldMailerTasks</span><div className="flex gap-4"><Link href="/privacy" className="hover:text-foreground">Privacy</Link><Link href="/terms" className="hover:text-foreground">Terms</Link><span>Simple tasks. Clear proof. Real payouts.</span></div></div></footer>
    </div>
  );
}