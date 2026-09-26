import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, Sparkles, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

const principles = [
  { icon: ShieldCheck, title: "Clear processes", copy: "Every task includes instructions, proof requirements, and a review status so you always know what happens next." },
  { icon: Users, title: "Built for real people", copy: "We make earning online approachable for workers while giving advertisers a practical way to reach an active audience." },
  { icon: WalletCards, title: "Useful access", copy: "Approved balances can move through the payment routes available in your country, including crypto checkout where supported." },
];

export default function About() {
  useEffect(() => {
    document.title = "About Task NestTasks";
    const description = "Learn how Task NestTasks connects people with simple online tasks and transparent earning opportunities.";
    let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = description;
    return () => { document.title = "Gold Mailer"; };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="border-b border-white/5">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">G</span>
            <span className="text-base font-black tracking-tight sm:text-lg">Task Nest<span className="text-primary">Tasks</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link href="/register"><Button className="bg-primary font-bold text-primary-foreground">Join free</Button></Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative border-b border-white/5 px-5 py-20 sm:py-28 lg:px-8">
          <div className="pointer-events-none absolute -left-32 -top-24 h-80 w-80 rounded-full bg-primary/15 blur-[110px]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary"><Sparkles size={14} /> About Task NestTasks</div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-6xl">A simpler way to turn small actions into opportunity.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Task NestTasks is a task marketplace that connects people who want to earn with advertisers who need genuine actions completed online.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/register"><Button className="w-full bg-primary px-6 font-bold text-primary-foreground sm:w-auto">Start earning <ArrowRight size={16} /></Button></Link><Link href="/"><Button variant="outline" className="w-full border-primary/30 px-6 text-primary sm:w-auto">Explore the marketplace</Button></Link></div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Our mission</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Make online earning clearer, fairer, and more useful.</h2></div>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground"><p>Online work should not require a complicated process to get started. We are building a focused place where tasks are easy to understand, proof is reviewed, and approved earnings are visible in one account.</p><p>We also help businesses and creators reach people through structured campaigns. Advertisers can post a brief, fund the required work, and review submissions in a single workflow.</p></div>
        </section>

        <section className="bg-card/30 px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Why people trust us</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Designed around clarity and accountability.</h2><p className="mt-4 leading-relaxed text-muted-foreground">Trust is earned through consistent details: honest task descriptions, visible statuses, secure account access, and support when something needs attention.</p></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">{principles.map(({ icon: Icon, title, copy }) => <article key={title} className="rounded-2xl border border-white/5 bg-card p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon size={20} /></span><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p></article>)}</div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-2 lg:px-8">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-7 sm:p-9"><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Why we show ads</p><h2 className="mt-3 text-3xl font-black">Ads help keep the core experience free.</h2><p className="mt-4 leading-relaxed text-muted-foreground">Running secure accounts, task reviews, payment integrations, and support takes real infrastructure. Carefully placed advertising helps us cover those costs without charging people just to join or browse opportunities.</p><div className="mt-6 space-y-3 text-sm font-semibold"><p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary" /> Ads are controlled by placement.</p><p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary" /> Ads never appear inside the admin panel.</p><p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary" /> You can continue using the marketplace for free.</p></div></div>
          <div className="rounded-3xl border border-white/5 bg-card p-7 sm:p-9"><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Contact us</p><h2 className="mt-3 text-3xl font-black">Questions? We’re here to help.</h2><p className="mt-4 leading-relaxed text-muted-foreground">For account, payment, or partnership questions, contact our support team. Include the email on your account and a clear description so we can help quickly.</p><a href="mailto:1xemailsupportbox@gmail.com" className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-background p-4 transition hover:border-primary/40"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Mail size={18} /></span><span><span className="block text-xs text-muted-foreground">Email support</span><span className="font-bold">1xemailsupportbox@gmail.com</span></span></a><p className="mt-4 text-xs text-muted-foreground">Support hours: Monday–Friday, 9:00–17:00 WAT.</p></div>
        </section>
      </main>

      <footer className="border-t border-white/5 px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>© 2026 Task NestTasks</span><div className="flex gap-4"><Link href="/" className="hover:text-foreground">Home</Link><Link href="/privacy" className="hover:text-foreground">Privacy</Link><Link href="/terms" className="hover:text-foreground">Terms</Link></div></div></footer>
    </div>
  );
}