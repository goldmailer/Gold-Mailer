import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Phone, ShieldCheck, RefreshCw } from "lucide-react";

type SmsMessage = {
  id: number;
  direction: "inbound" | "outbound";
  body: string;
  createdAt: string;
};

function timeStr(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SmsInbox() {
  const [status, setStatus] = useState<{ phoneVerified: boolean; phone: string | null } | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"idle" | "otp_sent" | "verified">("idle");
  const [sending, setSending] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/sms/status", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data);
      if (data.phoneVerified) setStep("verified");
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/sms/messages", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);
    } catch {}
  };

  useEffect(() => {
    fetchStatus().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (step === "verified") {
      fetchMessages();
      const iv = setInterval(fetchMessages, 8000);
      return () => clearInterval(iv);
    }
  }, [step]);

  useEffect(() => {
    if (step === "verified") {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [messages.length, step]);

  const requestOtp = async () => {
    setError("");
    setInfo("");
    if (!phone.trim()) { setError("Enter your phone number with country code, e.g. +2348012345678"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/sms/verify/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send OTP"); return; }
      setStep("otp_sent");
      setInfo("A 6-digit code was sent to your phone. Enter it below.");
    } catch { setError("Network error. Please try again."); }
    finally { setSending(false); }
  };

  const confirmOtp = async () => {
    setError("");
    if (!otp.trim()) { setError("Enter the code you received."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/sms/verify/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Invalid code"); return; }
      setStep("verified");
      setStatus({ phoneVerified: true, phone: data.phone });
      setInfo("");
      fetchMessages();
    } catch { setError("Network error. Please try again."); }
    finally { setSending(false); }
  };

  const sendReply = async () => {
    if (!replyBody.trim() || replying) return;
    setReplying(true);
    try {
      const res = await fetch("/api/sms/messages/reply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      if (res.ok) {
        setReplyBody("");
        await fetchMessages();
      }
    } finally { setReplying(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 max-w-2xl mx-auto px-4 sm:pl-16 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <MessageSquare size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black">SMS Inbox</h1>
            <p className="text-sm text-muted-foreground">
              {step === "verified" && status?.phone
                ? `Verified: ${status.phone}`
                : "Verify your phone to enable 2-way messaging"}
            </p>
          </div>
          {step === "verified" && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={fetchMessages}>
              <RefreshCw size={14} />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : step !== "verified" ? (
          /* Phone verification flow */
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Phone size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-bold">Verify Your Phone Number</p>
                <p className="text-xs text-muted-foreground">We'll send a one-time code via SMS</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}
            {info && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                {info}
              </div>
            )}

            {step === "idle" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+2348012345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") requestOtp(); }}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Include country code, e.g. +234 for Nigeria</p>
                </div>
                <Button className="w-full" onClick={requestOtp} disabled={sending}>
                  {sending ? "Sending..." : "Send Verification Code"}
                </Button>
              </div>
            )}

            {step === "otp_sent" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">6-Digit Code</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={e => { if (e.key === "Enter") confirmOtp(); }}
                    className="font-mono text-center text-xl tracking-widest"
                    autoFocus
                  />
                </div>
                <Button className="w-full" onClick={confirmOtp} disabled={sending}>
                  <ShieldCheck size={16} className="mr-2" />
                  {sending ? "Verifying..." : "Verify Code"}
                </Button>
                <button
                  className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => { setStep("idle"); setOtp(""); setInfo(""); setError(""); }}
                >
                  Use a different number
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Verified: show SMS chat */
          <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <MessageSquare size={40} className="text-muted-foreground mb-3" />
                  <p className="font-semibold text-sm mb-1">No messages yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    When GoldMailer sends you an SMS or you reply from here, messages will appear in this thread.
                  </p>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      m.direction === "outbound"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm border border-border"
                    }`}>
                      {m.direction === "inbound" && (
                        <p className="text-xs font-bold mb-0.5 opacity-60">GoldMailer</p>
                      )}
                      <p className="break-words leading-relaxed">{m.body}</p>
                      <p className={`text-xs mt-1 ${m.direction === "outbound" ? "opacity-60 text-right" : "opacity-40"}`}>
                        {timeStr(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            <div className="border-t border-border p-3 flex gap-2 shrink-0">
              <Input
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Type your reply..."
                className="flex-1 text-sm"
              />
              <Button
                size="sm"
                onClick={sendReply}
                disabled={!replyBody.trim() || replying}
                className="bg-primary text-primary-foreground shrink-0"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
