import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Unable to sign in.");
        return;
      }
      const token = data.token || data.authToken || data.access_token || "admin_token_" + Date.now();
      localStorage.setItem("token", token);
      localStorage.setItem("adminToken", token);
      setLocation("/admin");
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-card shadow-2xl shadow-black/30 lg:grid-cols-[1fr_0.9fr]">
          <section className="hidden bg-gradient-to-br from-primary/20 via-card to-blue-500/10 p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">G</span>
                <span className="text-xl font-black tracking-tight">Task Nest<span className="text-primary">Tasks</span></span>
              </Link>
              <div className="mt-24 max-w-sm">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Operations console</p>
                <h1 className="mt-4 text-4xl font-black leading-tight">Run the marketplace with clarity.</h1>
                <p className="mt-5 leading-relaxed text-muted-foreground">
                  Review members, approve payouts, manage opportunities, and keep every task moving from one secure workspace.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <ShieldCheck size={18} className="text-primary" />
              Admin-only access with server-side session protection
            </div>
          </section>

          <section className="p-7 sm:p-10">
            <Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-foreground lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground">G</span>
              Task NestTasks
            </Link>
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <LockKeyhole size={23} />
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Private workspace</p>
              <h2 className="mt-2 text-3xl font-black">Admin sign in</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Use the administrator credentials configured for this deployment.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Email address</span>
                <span className="relative block">
                  <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" className="h-12 pl-10" autoComplete="username" />
                </span>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Password</span>
                <span className="relative block">
                  <LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="h-12 pl-10 pr-11" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>
              {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="h-12 w-full bg-primary font-bold text-primary-foreground hover:opacity-90">
                {loading ? "Signing in..." : <>Enter admin panel <ArrowRight size={16} /></>}
              </Button>
            </form>
            <Link href="/" className="mt-7 block text-center text-sm text-muted-foreground hover:text-foreground">Return to marketplace</Link>
          </section>
        </div>
      </div>
    </main>
  );
}