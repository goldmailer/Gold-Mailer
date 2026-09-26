import { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Info,
  Mail,
  ChevronRight,
} from "lucide-react";
import {
  getNotifications,
  markAllRead,
  type Notification as LocalNotification,
} from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

interface CombinedNotification {
  id: string | number;
  type: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ComponentType<any>; color: string; bg: string }
> = {
  reminder: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  verify_email: { icon: ShieldAlert, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  announcement: { icon: Info, color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20" },
  kyc_approved: { icon: ShieldCheck, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  kyc_declined: { icon: ShieldX, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  deposit_approved: { icon: ArrowDownCircle, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  deposit_declined: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  withdrawal_approved: { icon: ArrowUpCircle, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  withdrawal_declined: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
};

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<CombinedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchInboxNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/inbox/messages", { credentials: "include" });
      const serverMessages = res.ok ? await res.json() : [];
      const localNotes: LocalNotification[] = getNotifications();

      const combined: CombinedNotification[] = [];

      // Add server messages
      if (Array.isArray(serverMessages)) {
        for (const m of serverMessages) {
          combined.push({
            id: `server-${m.id}`,
            type: m.type || "announcement",
            title: m.title || "Notification",
            body: m.message || "",
            timestamp: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
            read: Boolean(m.isRead),
            link: m.type === "verify_email" || m.type === "reminder" ? "/verify-email" : undefined,
          });
        }
      }

      // Add local notifications
      for (const ln of localNotes) {
        if (!combined.some((c) => c.title === ln.title && Math.abs(c.timestamp - ln.timestamp) < 5000)) {
          combined.push({
            id: `local-${ln.id}`,
            type: ln.type,
            title: ln.title,
            body: ln.body,
            timestamp: ln.timestamp,
            read: ln.read,
          });
        }
      }

      // Sort by timestamp desc
      combined.sort((a, b) => b.timestamp - a.timestamp);

      // Count unread
      let unread = combined.filter((n) => !n.read).length;
      if (user && !user.isVerified) {
        unread += 1;
      }

      setNotifications(combined);
      setUnreadCount(unread);
    } catch {
      // Fallback to local
      const localNotes = getNotifications();
      let unread = localNotes.filter((n) => !n.read).length;
      if (user && !user.isVerified) unread += 1;
      setNotifications(
        localNotes.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          timestamp: n.timestamp,
          read: n.read,
        }))
      );
      setUnreadCount(unread);
    }
  };

  useEffect(() => {
    fetchInboxNotifications();
    const interval = setInterval(fetchInboxNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    markAllRead();
    try {
      await fetch("/api/inbox/read-all", { method: "POST", credentials: "include" });
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(user && !user.isVerified ? 1 : 0);
  };

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={handleOpen}
        data-testid="button-notification-bell"
        className="relative w-9 h-9 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center hover:border-primary/50 hover:bg-[#1a1a1a] transition-all shadow-sm"
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell size={17} className={unreadCount > 0 ? "text-primary animate-wiggle" : "text-muted-foreground"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 sm:right-auto sm:left-0 top-12 w-80 sm:w-96 bg-[#121212] border border-[#262626] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222] bg-[#161616]">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-primary" />
              <p className="font-bold text-sm text-white">Notifications</p>
              {unreadCount > 0 && (
                <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-[#222222]">
            {/* Unverified Account Alert Banner */}
            {user && !user.isVerified && (
              <Link href="/verify-email" onClick={() => setOpen(false)}>
                <div className="p-3.5 bg-amber-500/10 border-b border-amber-500/20 hover:bg-amber-500/15 transition-colors cursor-pointer flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <ShieldAlert size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-black text-amber-300">Action Required: Verify Account</p>
                      <ChevronRight size={14} className="text-amber-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                      Please enter your 6-digit code to activate task rewards and withdrawals.
                    </p>
                    <span className="inline-block mt-1 text-[10px] text-amber-400 font-bold underline">
                      Verify email now &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {notifications.length === 0 && (!user || user.isVerified) ? (
              <div className="py-12 px-4 text-center">
                <CheckCircle size={32} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">No new notifications</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  You're all caught up! Updates and reminders appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || {
                  icon: Bell,
                  color: "text-primary",
                  bg: "bg-primary/10 border-primary/20",
                };
                const Icon = cfg.icon;

                const content = (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/5 ${
                      !n.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${cfg.bg}`}
                    >
                      <Icon size={15} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-xs font-bold truncate ${
                            !n.read ? "text-white" : "text-zinc-300"
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-0.5 break-words">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">{timeAgo(n.timestamp)}</p>
                    </div>
                  </div>
                );

                if (n.link) {
                  return (
                    <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                      <div className="cursor-pointer">{content}</div>
                    </Link>
                  );
                }

                return <div key={n.id}>{content}</div>;
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
