import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Phone, RefreshCw } from "lucide-react";
import { Link } from "wouter";

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
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/sms/status", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data);
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
    if (!status?.phoneVerified) return;
    fetchMessages();
    const iv = setInterval(fetchMessages, 8000);
    return () => clearInterval(iv);
  }, [status?.phoneVerified]);

  useEffect(() => {
    if (status?.phoneVerified) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [messages.length, status?.phoneVerified]);

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
            <h1 className="text-2xl font-black">SMS Messages</h1>
            <p className="text-sm text-muted-foreground">
              {status?.phoneVerified && status.phone
                ? `Messages for ${status.phone}`
                : "Your GoldMailer SMS conversation"}
            </p>
          </div>
          {status?.phoneVerified && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={fetchMessages}>
              <RefreshCw size={14} />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : !status?.phoneVerified ? (
          /* Not verified — prompt to go to Settings */
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md mx-auto text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Phone size={24} className="text-primary" />
            </div>
            <h2 className="font-bold text-lg mb-2">Phone Not Verified</h2>
            <p className="text-sm text-muted-foreground mb-6">
              To use SMS messaging, add and verify your phone number in your profile settings. It works for any country worldwide.
            </p>
            <Link href="/settings">
              <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold">
                Go to Settings to Verify
              </Button>
            </Link>
          </div>
        ) : (
          /* Verified — show SMS chat */
          <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
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
