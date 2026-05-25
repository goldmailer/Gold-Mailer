import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUPPORT_EMAIL = "1xemailsupportbox@gmail.com";

type SupportMessage = {
  id: number;
  message: string;
  sender: "user" | "admin";
  createdAt: string;
};

export function SupportChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevAdminCount = useRef(0);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/support/messages", { credentials: "include" });
      if (!res.ok) return;
      const data: SupportMessage[] = await res.json();
      setMessages(data);
      const adminCount = data.filter(m => m.sender === "admin").length;
      if (!open && adminCount > prevAdminCount.current) {
        setUnread(prev => prev + (adminCount - prevAdminCount.current));
      }
      prevAdminCount.current = adminCount;
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    const iv = setInterval(fetchMessages, 5000);
    return () => clearInterval(iv);
  }, [user]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [open, messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });
      if (res.ok) {
        setInput("");
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary/10 border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <p className="font-bold text-sm">Live Support</p>
              <p className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle size={36} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold mb-1">How can we help?</p>
                <p className="text-xs text-muted-foreground px-4">Send us a message and we'll reply as soon as possible.</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Email: <span className="text-primary">{SUPPORT_EMAIL}</span>
                </p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    m.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm border border-border"
                  }`}>
                    {m.sender === "admin" && (
                      <p className="text-xs font-bold mb-0.5 opacity-60">Support</p>
                    )}
                    <p className="break-words">{m.message}</p>
                    <p className={`text-xs mt-1 ${m.sender === "user" ? "opacity-60 text-right" : "opacity-40"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2 shrink-0">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your message..."
              className="flex-1 text-sm"
            />
            <Button
              size="sm"
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="bg-primary text-primary-foreground shrink-0"
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-4 right-4 z-50 w-13 h-13 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
        style={{ width: 52, height: 52 }}
        aria-label="Open support chat"
      >
        {open ? <ChevronDown size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center font-bold">
            {Math.min(unread, 9)}{unread > 9 ? "+" : ""}
          </span>
        )}
      </button>
    </>
  );
}
