import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, XCircle, ShieldCheck, ShieldX, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import {
  getNotifications,
  markAllRead,
  getUnreadCount,
  type Notification,
} from "@/hooks/useNotifications";

const TYPE_CONFIG: Record<Notification["type"], { icon: React.ComponentType<any>; color: string; bg: string }> = {
  kyc_approved: { icon: ShieldCheck, color: "text-green-400", bg: "bg-green-400/10" },
  kyc_declined: { icon: ShieldX, color: "text-red-400", bg: "bg-red-400/10" },
  deposit_approved: { icon: ArrowDownCircle, color: "text-green-400", bg: "bg-green-400/10" },
  deposit_declined: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
  withdrawal_approved: { icon: ArrowUpCircle, color: "text-green-400", bg: "bg-green-400/10" },
  withdrawal_declined: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => {
    setNotifications(getNotifications());
    setUnread(getUnreadCount());
  };

  useEffect(() => {
    refresh();
    // Re-check every 5 seconds for new notifications added by the poller
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) {
      markAllRead();
      setTimeout(() => setUnread(0), 100);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-border/60 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-popover border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-bold text-sm">Notifications</p>
            {notifications.length > 0 && (
              <button
                onClick={() => { markAllRead(); setUnread(0); refresh(); }}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle size={28} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-1">We'll alert you when something changes</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-0 ${!n.read ? "bg-primary/3" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                      <Icon size={15} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold truncate ${!n.read ? "text-foreground" : "text-foreground/80"}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{n.body}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
