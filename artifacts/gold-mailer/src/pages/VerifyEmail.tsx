import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useVerifyEmail, useResendVerification } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, RefreshCw, Pencil, Check } from "lucide-react";
import { Link } from "wouter";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [email, setEmail] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const urlEmail = new URLSearchParams(window.location.search).get("email");
      if (urlEmail) return urlEmail.trim();
      return (sessionStorage.getItem("verify_email") || "").trim();
    }
    return "";
  });

  const [isEditingEmail, setIsEditingEmail] = useState(!email);
  const [editEmailVal, setEditEmailVal] = useState(email);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (email) {
      sessionStorage.setItem("verify_email", email);
      setEditEmailVal(email);
    }
  }, [email]);

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
        toast({
          title: "Verification failed",
          description: err?.data?.error || err?.message || "Invalid or expired code",
          variant: "destructive",
        });
      },
    },
  });

  const resendMutation = useResendVerification({
    mutation: {
      onSuccess: (data: any) => {
        toast({
          title: "Code resent!",
          description: data?.message || "A fresh 6-digit verification code has been sent. Check your inbox and spam folder.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to resend",
          description: err?.data?.error || err?.message || "Please try again later or check your email address.",
          variant: "destructive",
        });
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

  const handleResendClick = () => {
    const targetEmail = (email || editEmailVal).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      toast({
        title: "Valid email required",
        description: "Please enter your registered email address before requesting a new code.",
        variant: "destructive",
      });
      setIsEditingEmail(true);
      return;
    }
    setEmail(targetEmail);
    resendMutation.mutate({ data: { email: targetEmail } });
  };

  const handleSubmit = () => {
    const targetEmail = (email || editEmailVal).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      toast({ title: "Email required", description: "Please enter your registered email address.", variant: "destructive" });
      setIsEditingEmail(true);
      return;
    }
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    verifyMutation.mutate({ data: { email: targetEmail, code: fullCode } });
  };

  const saveEditedEmail = () => {
    const cleaned = editEmailVal.trim().toLowerCase();
    if (cleaned && cleaned.includes("@")) {
      setEmail(cleaned);
      sessionStorage.setItem("verify_email", cleaned);
      setIsEditingEmail(false);
      toast({ title: "Email updated", description: `Sending codes to ${cleaned}` });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="flex items-center justify-center gap-2.5 cursor-pointer">
              <img src="/favicon.svg" alt="Task Nest" className="w-8 h-8 rounded-lg" />
              <span className="text-white font-black text-2xl tracking-wide">
                Task <span className="text-primary">Nest</span>
              </span>
            </div>
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

          {isEditingEmail ? (
            <div className="flex items-center gap-2 mb-6 max-w-xs mx-auto">
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={editEmailVal}
                onChange={(e) => setEditEmailVal(e.target.value)}
                className="text-xs h-9 text-center"
              />
              <Button size="sm" onClick={saveEditedEmail} className="h-9 px-3 bg-primary text-black font-bold">
                <Check size={14} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 mb-6">
              <p className="text-primary font-medium text-sm truncate max-w-[260px]">
                {email || "your email address"}
              </p>
              <button
                onClick={() => setIsEditingEmail(true)}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
                title="Change email"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}

          <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                data-testid={`input-otp-${idx}`}
                className="w-12 h-14 text-center text-2xl font-bold bg-background border-2 border-input rounded-xl focus:border-primary focus:outline-none focus:ring-0 transition-colors"
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Code expires in <span className="text-primary font-semibold">10 minutes</span>
          </p>

          <Button
            className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold mb-4"
            onClick={handleSubmit}
            disabled={verifyMutation.isPending || code.join("").length !== 6}
            data-testid="button-verify-submit"
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
          </Button>

          <div className="bg-background/80 border border-border/60 rounded-xl p-3 mb-5 text-xs text-muted-foreground text-left flex items-start gap-2">
            <span className="text-primary font-bold text-sm leading-none mt-0.5">ℹ️</span>
            <span>
              <strong>Tip:</strong> Don&apos;t see the email in your inbox? Please check your <strong>Spam / Junk</strong> folder or Promotions tab.
            </span>
          </div>

          <button
            onClick={handleResendClick}
            disabled={resendMutation.isPending}
            data-testid="button-resend-code"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto font-medium"
          >
            <RefreshCw size={14} className={resendMutation.isPending ? "animate-spin" : ""} />
            {resendMutation.isPending ? "Resending..." : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}
