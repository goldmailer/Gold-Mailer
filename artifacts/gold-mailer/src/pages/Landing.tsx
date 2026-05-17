import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Zap, Star, ChevronRight, Lock, Globe, Award } from "lucide-react";

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
      <nav className="fixed top-0 left-0 right-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-primary font-bold text-xl tracking-widest">GOLDMAILER</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/login")} data-testid="button-nav-login">
              Login
            </Button>
            <Button size="sm" onClick={() => setLocation("/register")} data-testid="button-nav-register"
              className="bg-primary text-primary-foreground hover:opacity-90">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Star size={14} />
            <span>The Global Staking Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Grow Your{" "}
            <span className="text-primary">Wealth</span>{" "}
            with Confidence
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Stake your funds with Gold Mailer and earn guaranteed returns in 7 days.
            Available in Nigeria, USA, UK, and Canada. Professional, secure, and transparent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => setLocation("/register")}
              data-testid="button-hero-get-started"
              className="bg-primary text-primary-foreground hover:opacity-90 px-10 py-6 text-lg font-bold gold-glow"
            >
              Get Started <ChevronRight size={20} className="ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/login")}
              data-testid="button-hero-login"
              className="px-10 py-6 text-lg"
            >
              Sign In
            </Button>
          </div>
          <p className="mt-6 text-muted-foreground text-sm">
            Get a <span className="text-primary font-semibold">signup bonus</span> when you add your card
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border/50 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Minimum Stake", value: "From $3 / ₦2,700" },
            { label: "7-Day Profit", value: "Up to 3x+" },
            { label: "Countries", value: "4" },
            { label: "Daily Reward", value: "Claimed daily" },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-black text-primary">{stat.value}</p>
              <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Why Gold Mailer?</h2>
            <p className="text-muted-foreground text-lg">Built for serious investors who demand results</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Fully Secured",
                desc: "Your funds are protected with bank-grade security and encrypted storage.",
              },
              {
                icon: TrendingUp,
                title: "Guaranteed Returns",
                desc: "Stake your funds and earn guaranteed profit in just 7 days. Returns scale with your deposit.",
              },
              {
                icon: Zap,
                title: "Daily Rewards",
                desc: "Claim your daily reward on every active stake. Consistent earnings every single day.",
              },
              {
                icon: Lock,
                title: "Virtual Cards",
                desc: "Add your debit card once and manage it as a virtual card on your dashboard.",
              },
              {
                icon: Globe,
                title: "Global Platform",
                desc: "Available in Nigeria, USA, UK, and Canada. Withdraw to your local bank account.",
              },
              {
                icon: Award,
                title: "Signup Bonus",
                desc: "Receive a signup bonus instantly when you add your card. Start earning immediately.",
              },
            ].map(f => (
              <div key={f.title} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-card/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Register", desc: "Create your account in minutes with just email and password." },
              { step: "02", title: "Add Card", desc: "Add your debit card and claim your signup bonus instantly." },
              { step: "03", title: "Stake Funds", desc: "Deposit and stake in your local currency. Funds are locked for 7 days." },
              { step: "04", title: "Earn Profit", desc: "Collect profits after 7 days plus daily rewards, every day." },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-black text-lg">{item.step}</span>
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported countries */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-4">Available In</h2>
          <p className="text-muted-foreground mb-8">Stake and earn in your local currency</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { flag: "🇳🇬", name: "Nigeria", currency: "₦ Naira" },
              { flag: "🇺🇸", name: "United States", currency: "$ Dollar" },
              { flag: "🇬🇧", name: "United Kingdom", currency: "£ Pound" },
              { flag: "🇨🇦", name: "Canada", currency: "C$ Dollar" },
            ].map(c => (
              <div key={c.name} className="p-4 rounded-xl bg-card border border-border">
                <p className="text-3xl mb-2">{c.flag}</p>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.currency}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to Start Earning?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of investors growing their wealth with Gold Mailer.</p>
          <Button
            size="lg"
            onClick={() => setLocation("/register")}
            data-testid="button-cta-register"
            className="bg-primary text-primary-foreground hover:opacity-90 px-12 py-6 text-lg font-bold gold-glow"
          >
            Open Account Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            data-testid="button-footer-logo"
            onClick={handleLogoTap}
            className="text-muted-foreground text-sm font-medium tracking-widest select-none cursor-default"
          >
            GOLDMAILER
          </button>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Gold Mailer. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </footer>

      {/* Admin PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
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
