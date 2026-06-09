import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Bell, CheckCheck, Megaphone, ShieldCheck, Gift, TrendingUp, Info, Mail
} from "lucide-react";

type InboxMessage = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  announcement: { icon: Megaphone, color: "text-blue-400", bg: "bg-blue-500/10" },
  kyc: { icon: ShieldCheck, color: "text-amber-400", bg: "bg-amber-500/10" },
  reward: { icon: Gift, color: "text-primary", bg: "bg-primary/10" },
  staking: { icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
  info: { icon: Info, color: "text-purple-400", bg: "bg-purple-500/10" },
};

function getTypeConfig(type: string) {
  return TYPE_ICONS[type] ?? TYPE_ICONS.info;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Inbox() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [selected, setSelected] = useState<InboxMessage | null>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/inbox/messages", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const markRead = async (id: number) => {
    await fetch(`/api/inbox/messages/${id}/read`, { method: "POST", credentials: "include" });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    await fetch("/api/inbox/read-all", { method: "POST", credentials: "include" });
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    setMarkingAll(false);
  };

  const openMessage = (msg: InboxMessage) => {
    setSelected(msg);
    if (!msg.isRead) markRead(msg.id);
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 max-w-3xl mx-auto px-4 sm:pl-16 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Bell size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Inbox</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "All caught up"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              disabled={markingAll}
              className="gap-2 text-xs"
            >
              <CheckCheck size={14} />
              {markingAll ? "Marking..." : "Mark all read"}
            </Button>
          )}
        </div>

        {/* Message detail modal */}
        {selected && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const cfg = getTypeConfig(selected.type);
                const Icon = cfg.icon;
                return (
                  <>
                    <div className="p-6 border-b border-border">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon size={20} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-lg leading-snug">{selected.title}</h2>
                          <p className="text-xs text-muted-foreground mt-1">{timeAgo(selected.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selected.message}</p>
                    </div>
                    <div className="px-6 pb-6">
                      <Button className="w-full" onClick={() => setSelected(null)}>Close</Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Message list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Mail size={36} className="text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">No messages yet</h2>
            <p className="text-sm text-muted-foreground">
              You'll receive important updates, announcements, and notifications here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map(msg => {
              const cfg = getTypeConfig(msg.type);
              const Icon = cfg.icon;
              return (
                <button
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`w-full text-left bg-card border rounded-xl p-4 flex items-start gap-4 hover:border-primary/40 transition-all duration-200 group ${
                    msg.isRead ? "border-border opacity-80" : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 relative`}>
                    <Icon size={18} className={cfg.color} />
                    {!msg.isRead && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-snug truncate ${!msg.isRead ? "text-foreground font-bold" : "text-foreground"}`}>
                        {msg.title}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(msg.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {msg.message}
                    </p>
                    {!msg.isRead && (
                      <span className="inline-block mt-2 text-xs font-bold text-primary">Tap to read</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
