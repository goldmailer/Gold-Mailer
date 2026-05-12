import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useVerifyEmail, useResendVerification } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const email = sessionStorage.getItem("verify_email") || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [devCode, setDevCode] = useState<string | null>(
    sessionStorage.getItem("verify_dev_code") || null
  );
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyMutation = useVerifyEmail({
    mutation: {
      onSuccess: async () => {
        sessionStorage.removeItem("verify_dev_code");
        // Refresh auth state — server auto-logs in on verify
        try {
          const r = await fetch("/api/auth/me", { credentials: "include" });
          if (r.ok) {
            const user = await r.json();
            login(user);
          }
        } catch {}
        toast({ title: "Email verified", description: "Your account is now verified." });
        setLocation("/setup-profile");
      },
      onError: (err: any) => {
        toast({ title: "Verification failed", description: err?.data?.error || err?.message || "Invalid or expired code", variant: "destructive" });
      },
    },
  });

  const resendMutation = useResendVerification({
    mutation: {
      onSuccess: (data: any) => {
        if (data?.devCode) {
          setDevCode(data.devCode);
          sessionStorage.setItem("verify_dev_code", data.devCode);
          toast({ title: "New code generated", description: "Email delivery is unavailable — use the code shown below." });
        } else {
          toast({ title: "Code resent", description: "Check your email for a new verification code." });
        }
      },
      onError: () => {
        toast({ title: "Failed to resend", description: "Please try again later.", variant: "destructive" });
      },
    },
  });

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("").map((_, i) => text[i] || "");
    setCode(next);
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  const fillDevCode = () => {
    if (!devCode) return;
    const digits = devCode.split("");
    setCode(digits);
    inputs.current[5]?.focus();
  };

  const handleSubmit = () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    verifyMutation.mutate({ data: { email, code: fullCode } });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-5">
            <Mail size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
          <p className="text-muted-foreground text-sm mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-primary font-medium text-sm mb-6 truncate">{email || "your email address"}</p>

          {devCode && (
            <button
              onClick={fillDevCode}
              className="w-full mb-5 p-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-left flex items-start gap-3 hover:bg-yellow-500/15 transition-colors"
            >
              <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-yellow-500 text-xs font-semibold mb-1">Email delivery unavailable</p>
                <p className="text-muted-foreground text-xs">
                  Your verification code is{" "}
                  <span className="text-white font-bold text-sm tracking-widest">{devCode}</span>
                  {" "}— tap to fill automatically.
                </p>
              </div>
            </button>
          )}

          <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                data-testid={`input-otp-${idx}`}
                className="w-12 h-14 text-center text-2xl font-bold bg-background border-2 border-input rounded-xl focus:border-primary focus:outline-none focus:ring-0 transition-colors"
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Code expires in <span className="text-primary font-semibold">20 minutes</span>
          </p>

          <Button
            className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold mb-4"
            onClick={handleSubmit}
            disabled={verifyMutation.isPending || code.join("").length !== 6}
            data-testid="button-verify-submit"
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
          </Button>

          <button
            onClick={() => resendMutation.mutate({ data: { email } })}
            disabled={resendMutation.isPending}
            data-testid="button-resend-code"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto"
          >
            <RefreshCw size={14} className={resendMutation.isPending ? "animate-spin" : ""} />
            {resendMutation.isPending ? "Resending..." : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}
