import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Zap, ChevronRight, Lock, Globe, Award, CheckCircle2, Star, Quote, Users, Handshake, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const p1 = "/people/person1.jpg";
const p2 = "/people/person2.jpg";
const p3 = "/people/person3.jpg";

const ADMIN_TAP_COUNT = 10;

export default function Landing() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
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

  const features = [
    { icon: Shield, titleKey: "landing.feature1title", descKey: "landing.feature1desc" },
    { icon: TrendingUp, titleKey: "landing.feature2title", descKey: "landing.feature2desc" },
    { icon: Zap, titleKey: "landing.feature3title", descKey: "landing.feature3desc" },
    { icon: Lock, titleKey: "landing.feature4title", descKey: "landing.feature4desc" },
    { icon: Globe, titleKey: "landing.feature5title", descKey: "landing.feature5desc" },
    { icon: Award, titleKey: "landing.feature6title", descKey: "landing.feature6desc" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-30 border-b border-white/5 bg-background/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-primary font-black text-xl tracking-widest">GOLDMAILER</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/login")}
              className="text-muted-foreground hover:text-foreground">
              {t("landing.signIn")}
            </Button>
            <Button size="sm" onClick={() => setLocation("/register")}
              className="bg-primary text-primary-foreground hover:opacity-90 font-bold px-5">
              {t("landing.openAccount")}
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-0 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/4" />
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center min-h-[85vh]">
          {/* Left — text */}
          <div className="py-16 lg:py-24">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/10 text-primary text-sm font-semibold mb-8">
              <Star size={13} fill="currentColor" />
              {t("landing.badge")}
            </div>

            <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6">
              {t("landing.title1")}<br />
              <span className="text-primary">{t("landing.title2")}</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed mb-4 max-w-md">
              {t("landing.subtitle")}
            </p>

            <ul className="space-y-2 mb-10">
              {(["landing.bullet1", "landing.bullet2", "landing.bullet3"] as const).map(key => (
                <li key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  {t(key)}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => setLocation("/register")}
                className="bg-primary text-primary-foreground hover:opacity-90 px-8 py-6 text-base font-black gold-glow"
              >
                {t("landing.openAccount")} <ChevronRight size={18} className="ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setLocation("/login")}
                className="px-8 py-6 text-base border-white/10 hover:bg-white/5"
              >
                {t("landing.signIn")}
              </Button>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              {t("landing.signupBonus")}
            </p>
          </div>

          {/* Mobile hero image */}
          <div className="lg:hidden w-full mt-6 mb-4 flex items-start justify-center gap-4">
            <img
              src={p1}
              alt="Happy investor"
              className="w-[155px] h-[205px] object-cover object-top shadow-2xl"
              style={{ borderRadius: "55% 45% 55% 45% / 50% 60% 40% 50%" }}
            />
            <div className="flex flex-col gap-3 pt-10">
              <img
                src={p2}
                alt="Excited investor"
                className="w-[118px] h-[148px] object-cover object-top shadow-xl"
                style={{ transform: "rotate(3deg)", borderRadius: "50% 50% 45% 55% / 45% 55% 45% 55%" }}
              />
              <img
                src={p3}
                alt="Celebrating investor"
                className="w-[118px] h-[138px] object-cover object-top shadow-xl"
                style={{ transform: "rotate(-3deg)", borderRadius: "45% 55% 50% 50% / 55% 45% 55% 45%" }}
              />
            </div>
          </div>

          {/* Right — floating photo collage (desktop) */}
          <div className="relative hidden lg:block" style={{ minHeight: "640px" }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[580px] rounded-full bg-primary/10 blur-[90px] pointer-events-none" />
            <div className="absolute top-1/4 right-0 w-[250px] h-[250px] rounded-full bg-blue-500/8 blur-[70px] pointer-events-none" />

            <div className="absolute top-16 right-2 bg-card/95 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 shadow-xl z-30">
              <p className="text-xs text-muted-foreground">7-Day Returns</p>
              <p className="text-xl font-black text-primary">Up to 3x+</p>
            </div>
            <div className="absolute bottom-24 left-2 bg-card/95 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 shadow-xl z-30">
              <p className="text-xs text-muted-foreground">Daily Reward</p>
              <p className="text-lg font-black text-green-400">+$0.10/day</p>
            </div>

            <div className="absolute top-8 left-4 z-20 shadow-2xl"
              style={{ width: 228, height: 292, transform: "rotate(-4deg)" }}>
              <img src={p2} alt="Winning investor" className="w-full h-full object-cover object-top"
                style={{ borderRadius: "55% 45% 50% 50% / 40% 60% 40% 60%" }} />
            </div>

            <div className="absolute z-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              style={{ width: 340, height: 480, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
              <img src={p1} alt="Excited investor" className="w-full h-full object-cover object-top"
                style={{ borderRadius: "42% 58% 60% 40% / 40% 42% 58% 60%" }} />
            </div>

            <div className="absolute bottom-4 right-4 z-20 shadow-2xl"
              style={{ width: 222, height: 278, transform: "rotate(4deg)" }}>
              <img src={p3} alt="Happy investor" className="w-full h-full object-cover object-top"
                style={{ borderRadius: "50% 50% 45% 55% / 60% 60% 40% 40%" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-card/40 py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { valKey: "landing.stat1val", labelKey: "landing.stat1label" },
            { valKey: "landing.stat2val", labelKey: "landing.stat2label" },
            { valKey: "landing.stat3val", labelKey: "landing.stat3label" },
            { valKey: "landing.stat4val", labelKey: "landing.stat4label" },
          ].map(s => (
            <div key={s.labelKey}>
              <p className="text-2xl md:text-3xl font-black text-primary mb-1">{t(s.valKey)}</p>
              <p className="text-muted-foreground text-sm">{t(s.labelKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-3">{t("landing.featuresTitle")}</h2>
            <p className="text-muted-foreground text-lg">{t("landing.featuresSubtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.titleKey} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-200 group">
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-bold text-base mb-2">{t(f.titleKey)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COLLABORATION / PARTNERS ─────────────────────────── */}
      <section className="py-20 px-6 bg-card/10 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Handshake size={14} />
              Trusted Collaboration Network
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-3">Backed by Industry Leaders</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              GoldMailer operates within a verified network of financial collaborators — ensuring your investments are safe, traceable, and profitable.
            </p>
          </div>

          {/* Collaboration pillars */}
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {[
              {
                icon: BadgeCheck,
                color: "text-green-400",
                bg: "bg-green-500/10",
                border: "border-green-500/20",
                title: "Verified Partners Only",
                desc: "Every financial partner in our network is independently audited and holds valid operating licenses across supported jurisdictions.",
              },
              {
                icon: Shield,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
                title: "Escrow-Protected Funds",
                desc: "All staked funds are held in escrow accounts with multiple co-signatories. No single party can move funds unilaterally.",
              },
              {
                icon: Globe,
                color: "text-primary",
                bg: "bg-primary/10",
                border: "border-primary/20",
                title: "Global Compliance",
                desc: "Compliant with CBN guidelines (Nigeria), FCA standards (UK), and SEC regulations (US) through our licensed partner institutions.",
              },
            ].map(item => (
              <div key={item.title} className={`p-6 rounded-2xl bg-card border ${item.border} hover:shadow-lg transition-all group`}>
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                  <item.icon size={22} className={item.color} />
                </div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="mb-4 text-center">
            <h3 className="text-xl font-black mb-2 flex items-center justify-center gap-2">
              <Users size={18} className="text-primary" /> What Our Investors Say
            </h3>
            <p className="text-muted-foreground text-sm">Real stories from verified GoldMailer members</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: "Marcus D.",
                location: "New York, United States",
                rating: 5,
                text: "I've tried a dozen investment platforms and GoldMailer is the only one that delivers exactly what it promises. My first 7-day stake returned every cent of profit. Already told my whole network.",
                initials: "MD",
                color: "bg-amber-500/20 text-amber-400",
              },
              {
                name: "Priya S.",
                location: "Houston, United States",
                rating: 5,
                text: "The daily reward claim is a game-changer. I earn every single day while my stake matures. Withdrawals hit my account within hours. This platform is the real deal.",
                initials: "PS",
                color: "bg-green-500/20 text-green-400",
              },
              {
                name: "Jordan K.",
                location: "Los Angeles, United States",
                rating: 5,
                text: "Clean interface, transparent returns, fast withdrawals. I was expecting another scam but GoldMailer proved me wrong on every level. I've now staked four times and counting.",
                initials: "JK",
                color: "bg-blue-500/20 text-blue-400",
              },
            ].map(t => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-6 relative flex flex-col">
                <Quote size={24} className="text-primary/30 mb-3 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center font-bold text-sm shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.location}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={12} className="text-primary fill-primary" />
                    ))}
                  </div>
                </div>
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

      {/* ── MORE WAYS TO EARN ─────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Zap size={14} />
              Multiple Income Streams
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-3">More Ways to Earn</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              GoldMailer isn't just staking. Stack income from multiple sources every day.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: TrendingUp,
                color: "text-primary",
                bg: "bg-primary/10",
                border: "border-primary/20",
                title: "7-Day Staking",
                badge: "Core",
                badgeColor: "bg-primary/20 text-primary",
                desc: "Deposit funds and earn guaranteed profit after 7 days. Stake ₦2,700 and receive ₦8,000 profit — that's nearly 3× your money.",
                highlight: "Up to 3× returns",
              },
              {
                icon: Zap,
                color: "text-yellow-400",
                bg: "bg-yellow-500/10",
                border: "border-yellow-500/20",
                title: "Daily Reward Claims",
                badge: "Every 24h",
                badgeColor: "bg-yellow-500/20 text-yellow-400",
                desc: "Claim ₦100 (or $0.10) on each active stake, every single day. The more stakes you run, the more you earn daily without waiting.",
                highlight: "Claim daily",
              },
              {
                icon: Award,
                color: "text-orange-400",
                bg: "bg-orange-500/10",
                border: "border-orange-500/20",
                title: "Partner Surveys & Tasks",
                badge: "New Tasks Daily",
                badgeColor: "bg-orange-500/20 text-orange-400",
                desc: "Complete surveys, sign-up offers, and micro-tasks from 20+ partner platforms like Toluna, ySense, and more. Earn $0.70 per approved task.",
                highlight: "$0.70 per task",
              },
              {
                icon: Globe,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
                title: "Referral Bonuses",
                badge: "Unlimited",
                badgeColor: "bg-blue-500/20 text-blue-400",
                desc: "Share your unique referral link. Earn ₦500 automatically every time a friend signs up and completes verification. No cap on referrals.",
                highlight: "₦500 per friend",
              },
              {
                icon: Shield,
                color: "text-green-400",
                bg: "bg-green-500/10",
                border: "border-green-500/20",
                title: "KYC Verification Bonus",
                badge: "One-Time",
                badgeColor: "bg-green-500/20 text-green-400",
                desc: "Complete your KYC identity check and receive a $20 cash bonus automatically credited to your account. Unlocks all platform features too.",
                highlight: "$20 free bonus",
              },
              {
                icon: CheckCircle2,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20",
                title: "Card Signup Bonus",
                badge: "Instant",
                badgeColor: "bg-purple-500/20 text-purple-400",
                desc: "Add your bank card and instantly receive your signup bonus — credited automatically the moment your card is verified. No deposit required.",
                highlight: "Instant credit",
              },
            ].map(item => (
              <div key={item.title} className={`p-6 rounded-2xl bg-card border ${item.border} hover:shadow-lg transition-all group flex flex-col`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">{item.desc}</p>
                <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${item.bg} ${item.color} inline-flex items-center gap-1 w-fit`}>
                  <CheckCircle2 size={11} /> {item.highlight}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              size="lg"
              onClick={() => setLocation("/register")}
              className="bg-primary text-primary-foreground hover:opacity-90 px-10 py-6 text-base font-black gold-glow"
            >
              Start Earning Today <ChevronRight size={18} className="ml-1" />
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">Free to join · No hidden fees · Withdraw anytime after maturity</p>
          </div>
        </div>
      </section>

      {/* ── GLOBE / COUNTRIES ─────────────────────────────────── */}
      <section className="py-20 px-6">
        <style>{`
          @keyframes flagScrollL {
            from { transform: translateX(0); }
            to   { transform: translateX(-33.33%); }
          }
          @keyframes flagScrollR {
            from { transform: translateX(-33.33%); }
            to   { transform: translateX(0); }
          }
        `}</style>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-3">{t("landing.globeTitle")}</h2>
          <p className="text-muted-foreground mb-10">{t("landing.globeSubtitle")}</p>

          <div className="flex justify-center">
            <div className="relative">
              <div
                className="relative w-64 h-64 rounded-full overflow-hidden"
                style={{ border: "1.5px solid rgba(255,255,255,0.10)" }}
              >
                {[
                  { flags: "🇺🇸 🇬🇧 🇨🇦 🇳🇬 🇦🇺 🇩🇪 🇫🇷 🇯🇵 🇧🇷 🇮🇳 🇰🇷 🇿🇦 🇲🇽 🇮🇹 🇪🇸", dir: "L", speed: 14 },
                  { flags: "🇷🇺 🇸🇦 🇦🇪 🇸🇬 🇹🇷 🇳🇱 🇸🇪 🇨🇭 🇦🇷 🇵🇭 🇮🇩 🇵🇰 🇧🇩 🇪🇬 🇲🇾", dir: "R", speed: 18 },
                  { flags: "🇹🇭 🇻🇳 🇨🇴 🇵🇱 🇺🇦 🇰🇪 🇬🇭 🇸🇳 🇪🇹 🇹🇿 🇨🇮 🇨🇲 🇿🇼 🇲🇦 🇹🇳", dir: "L", speed: 16 },
                  { flags: "🇩🇿 🇮🇶 🇨🇱 🇵🇪 🇻🇪 🇪🇨 🇧🇴 🇬🇹 🇭🇳 🇨🇷 🇵🇦 🇩🇰 🇫🇮 🇳🇴 🇮🇸", dir: "R", speed: 20 },
                  { flags: "🇮🇪 🇵🇹 🇬🇷 🇦🇹 🇧🇪 🇨🇿 🇭🇺 🇷🇴 🇯🇲 🇹🇹 🇧🇧 🇩🇴 🇨🇺 🇱🇰 🇲🇲", dir: "L", speed: 13 },
                  { flags: "🇰🇭 🇧🇳 🇲🇻 🇧🇹 🇳🇿 🇫🇯 🇵🇬 🇮🇱 🇯🇴 🇱🇧 🇸🇾 🇶🇦 🇰🇼 🇧🇭 🇴🇲", dir: "R", speed: 17 },
                  { flags: "🇦🇿 🇬🇪 🇦🇲 🇰🇿 🇺🇿 🇹🇲 🇰🇬 🇹🇯 🇲🇳 🇦🇫 🇳🇵 🇸🇱 🇱🇷 🇬🇳 🇬🇦", dir: "L", speed: 15 },
                  { flags: "🇧🇫 🇲🇱 🇳🇪 🇨🇩 🇦🇴 🇿🇲 🇲🇿 🇲🇼 🇧🇮 🇷🇼 🇺🇬 🇸🇸 🇸🇴 🇩🇯 🇪🇷", dir: "R", speed: 19 },
                ].map((row, i) => {
                  const repeated = `${row.flags}   ${row.flags}   ${row.flags}   `;
                  return (
                    <div key={i} className="whitespace-nowrap"
                      style={{ fontSize: "22px", lineHeight: "32px", animation: `flagScroll${row.dir} ${row.speed}s linear infinite` }}>
                      {repeated}
                    </div>
                  );
                })}
                <div className="absolute inset-0 pointer-events-none rounded-full"
                  style={{ background: "radial-gradient(ellipse at 38% 32%, rgba(255,255,255,0.07) 0%, transparent 45%, rgba(0,0,0,0.55) 100%)" }} />
                <div className="absolute inset-0 pointer-events-none rounded-full"
                  style={{ boxShadow: "inset 0 0 55px rgba(0,0,0,0.65), inset 0 0 20px rgba(0,0,0,0.4)" }} />
              </div>
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: "0 0 45px rgba(245,197,24,0.18), 0 0 90px rgba(245,197,24,0.07)" }} />
            </div>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">{t("landing.globeCaption")}</p>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-blue-500/10 border border-primary/25 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">{t("landing.ctaTitle")}</h2>
            <p className="text-muted-foreground mb-8 text-lg">{t("landing.ctaSubtitle")}</p>
            <Button
              size="lg"
              onClick={() => setLocation("/register")}
              className="bg-primary text-primary-foreground hover:opacity-90 px-12 py-6 text-lg font-black gold-glow"
            >
              {t("landing.ctaButton")}
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">{t("landing.ctaFooter")}</p>
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
