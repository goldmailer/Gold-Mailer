import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Zap, ChevronRight, Lock, Globe, Award, CheckCircle2, Star } from "lucide-react";

const p1 = "/people/person1.jpg";
const p2 = "/people/person2.jpg";
const p3 = "/people/person3.jpg";

const ADMIN_TAP_COUNT = 10;

export default function Landing() {
  const [, setLocation] = useLocation();
  const [tapCount, setTapCount] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= ADMIN_TAP_COUNT) {
      setTapCount(0);
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = async () => {
    try {
      const res = await fetch("/api/admin/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setShowPinModal(false);
        setPin("");
        setPinError("");
        setLocation("/admin");
      } else {
        setPinError("Incorrect PIN. Access denied.");
      }
    } catch {
      setPinError("Connection error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-30 border-b border-white/5 bg-background/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-primary font-black text-xl tracking-widest">GOLDMAILER</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/login")}
              className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
            <Button size="sm" onClick={() => setLocation("/register")}
              className="bg-primary text-primary-foreground hover:opacity-90 font-bold px-5">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-0 overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/4" />
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center min-h-[85vh]">
          {/* Left — text */}
          <div className="py-16 lg:py-24">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/10 text-primary text-sm font-semibold mb-8">
              <Star size={13} fill="currentColor" />
              The Global Staking Platform
            </div>

            <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6">
              Grow Your Money<br />
              <span className="text-primary">The Smart Way</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed mb-4 max-w-md">
              Stake your funds, earn guaranteed returns in 7 days, and collect daily rewards — all in your local currency.
            </p>

            {/* Trust bullets */}
            <ul className="space-y-2 mb-10">
              {[
                "Guaranteed returns in 7 days",
                "Daily rewards on every active stake",
                "Available in the USA, UK, Canada & Nigeria",
              ].map(point => (
                <li key={point} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  {point}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => setLocation("/register")}
                className="bg-primary text-primary-foreground hover:opacity-90 px-8 py-6 text-base font-black gold-glow"
              >
                Open Free Account <ChevronRight size={18} className="ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setLocation("/login")}
                className="px-8 py-6 text-base border-white/10 hover:bg-white/5"
              >
                Sign In
              </Button>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Get a <span className="text-primary font-semibold">free signup bonus</span> when you add your card — no credit check required.
            </p>
          </div>

          {/* Mobile hero image — shown only on small screens */}
          <div className="lg:hidden w-full mt-6 mb-4 flex items-start justify-center gap-4">
            <img
              src={p1}
              alt="Happy investor"
              className="w-[130px] h-[170px] object-cover object-top shadow-2xl"
              style={{ borderRadius: "55% 45% 55% 45% / 50% 60% 40% 50%" }}
            />
            <div className="flex flex-col gap-3 pt-8">
              <img
                src={p2}
                alt="Excited investor"
                className="w-[100px] h-[125px] object-cover object-top shadow-xl"
                style={{ transform: "rotate(3deg)", borderRadius: "50% 50% 45% 55% / 45% 55% 45% 55%" }}
              />
              <img
                src={p3}
                alt="Celebrating investor"
                className="w-[100px] h-[115px] object-cover object-top shadow-xl"
                style={{ transform: "rotate(-3deg)", borderRadius: "45% 55% 50% 50% / 55% 45% 55% 45%" }}
              />
            </div>
          </div>

          {/* Right — floating photo collage (desktop) */}
          <div className="relative hidden lg:block" style={{ minHeight: "580px" }}>

            {/* Soft background glow — behind everything */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[520px] rounded-full bg-primary/10 blur-[90px] pointer-events-none" />
            <div className="absolute top-1/4 right-0 w-[220px] h-[220px] rounded-full bg-blue-500/8 blur-[70px] pointer-events-none" />

            {/* Stat chips */}
            <div className="absolute top-16 right-2 bg-card/95 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 shadow-xl z-30">
              <p className="text-xs text-muted-foreground">7-Day Returns</p>
              <p className="text-xl font-black text-primary">Up to 3x+</p>
            </div>
            <div className="absolute bottom-24 left-2 bg-card/95 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 shadow-xl z-30">
              <p className="text-xs text-muted-foreground">Daily Reward</p>
              <p className="text-lg font-black text-green-400">+$0.10/day</p>
            </div>

            {/* Person 2 — top-left, smaller, slight tilt left */}
            <div
              className="absolute top-10 left-6 z-20 shadow-2xl"
              style={{ width: 195, height: 250, transform: "rotate(-4deg)" }}
            >
              <img
                src={p2}
                alt="Winning investor"
                className="w-full h-full object-cover object-top"
                style={{ borderRadius: "55% 45% 50% 50% / 40% 60% 40% 60%" }}
              />
            </div>

            {/* Person 1 — main centre, large organic blob */}
            <div
              className="absolute z-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              style={{
                width: 295,
                height: 415,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <img
                src={p1}
                alt="Excited investor"
                className="w-full h-full object-cover object-top"
                style={{ borderRadius: "42% 58% 60% 40% / 40% 42% 58% 60%" }}
              />
            </div>

            {/* Person 3 — bottom-right, smaller, slight tilt right */}
            <div
              className="absolute bottom-6 right-6 z-20 shadow-2xl"
              style={{ width: 190, height: 240, transform: "rotate(4deg)" }}
            >
              <img
                src={p3}
                alt="Happy investor"
                className="w-full h-full object-cover object-top"
                style={{ borderRadius: "50% 50% 45% 55% / 60% 60% 40% 40%" }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-card/40 py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "From $3", label: "Minimum Stake" },
            { value: "3x+", label: "7-Day Returns" },
            { value: "4", label: "Countries" },
            { value: "Daily", label: "Reward Claims" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-black text-primary mb-1">{s.value}</p>
              <p className="text-muted-foreground text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-3">Why Gold Mailer?</h2>
            <p className="text-muted-foreground text-lg">Built for serious investors who demand real results</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Shield, title: "Bank-Grade Security", desc: "Your funds and data are protected with end-to-end encryption and secure session management." },
              { icon: TrendingUp, title: "Guaranteed Returns", desc: "Stake any amount and earn guaranteed profit in just 7 days. Returns scale proportionally with your deposit." },
              { icon: Zap, title: "Daily Rewards", desc: "Claim ₦100 / $0.10 every day on each active stake. Consistent earnings from day one." },
              { icon: Lock, title: "Virtual Cards", desc: "Add your debit card once, manage it as a secure virtual card directly from your dashboard." },
              { icon: Globe, title: "Global Reach", desc: "Available in Nigeria, USA, UK, and Canada. Withdraw directly to your local bank or PayPal." },
              { icon: Award, title: "Instant Signup Bonus", desc: "Receive a signup bonus the moment you add your card. Start growing before you even stake." },
            ].map(f => (
              <div key={f.title} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-200 group">
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-24 px-6 bg-card/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-3">How It Works</h2>
            <p className="text-muted-foreground">Start earning in four simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Create Account", desc: "Sign up with just your email and password. Verify your email in seconds." },
              { step: "02", title: "Add Your Card", desc: "Add your debit card and instantly receive your signup bonus." },
              { step: "03", title: "Stake Funds", desc: "Deposit in your local currency. Funds are locked for 7 days and start earning immediately." },
              { step: "04", title: "Collect Profit", desc: "Withdraw your returns after 7 days plus daily rewards claimed every 24 hours." },
            ].map((item, i) => (
              <div key={item.step} className="text-center relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] right-[-calc(50%-28px)] h-px bg-border" />
                )}
                <div className="w-14 h-14 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-black text-sm">{item.step}</span>
                </div>
                <h3 className="font-bold mb-2 text-sm">{item.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COUNTRIES ─────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-3">Available In</h2>
          <p className="text-muted-foreground mb-8">Stake and earn in your local currency</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { flag: "🇺🇸", name: "United States", currency: "$ Dollar" },
              { flag: "🇬🇧", name: "United Kingdom", currency: "£ Pound" },
              { flag: "🇨🇦", name: "Canada", currency: "C$ Dollar" },
              { flag: "🇳🇬", name: "Nigeria", currency: "₦ Naira" },
            ].map(c => (
              <div key={c.name} className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <p className="text-3xl mb-2">{c.flag}</p>
                <p className="font-bold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.currency}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-blue-500/10 border border-primary/25 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Start Earning?</h2>
            <p className="text-muted-foreground mb-8 text-lg">Join thousands of investors growing their wealth with Gold Mailer. Free to join, no hidden fees.</p>
            <Button
              size="lg"
              onClick={() => setLocation("/register")}
              className="bg-primary text-primary-foreground hover:opacity-90 px-12 py-6 text-lg font-black gold-glow"
            >
              Open Free Account Now
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">No credit check · Instant signup bonus · Withdraw anytime</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            onClick={handleLogoTap}
            className="text-muted-foreground text-sm font-bold tracking-widest select-none cursor-default"
          >
            GOLDMAILER
          </button>
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} Gold Mailer. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </footer>

      {/* ── ADMIN PIN MODAL ────────────────────────────────────── */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-1 text-center">Admin Access</h2>
            <p className="text-muted-foreground text-sm text-center mb-6">Enter your PIN to continue</p>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError(""); }}
              placeholder="Enter PIN"
              data-testid="input-admin-pin"
              className="w-full px-4 py-3 rounded-lg bg-background border border-input text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary mb-3"
              onKeyDown={e => e.key === "Enter" && handlePinSubmit()}
            />
            {pinError && <p className="text-destructive text-sm text-center mb-3">{pinError}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowPinModal(false); setPin(""); setPinError(""); }}>
                Cancel
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={handlePinSubmit} data-testid="button-admin-pin-submit">
                Access
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
