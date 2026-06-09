import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "gm_notifications";
const SEEN_KEY = "gm_seen_notifications";

export interface Notification {
  id: string;
  type: "kyc_approved" | "kyc_declined" | "deposit_approved" | "deposit_declined" | "withdrawal_approved" | "withdrawal_declined";
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

function getStored(): Notification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function setStored(notifications: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 30)));
}

function getSeenState(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function setSeenState(state: Record<string, string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(state));
}

function addNotification(notif: Omit<Notification, "id" | "timestamp" | "read">) {
  const existing = getStored();
  const id = `${notif.type}-${Date.now()}`;
  const newNotif: Notification = { ...notif, id, timestamp: Date.now(), read: false };
  setStored([newNotif, ...existing]);
  return id;
}

export function getNotifications(): Notification[] {
  return getStored();
}

export function markAllRead() {
  const notifications = getStored();
  setStored(notifications.map(n => ({ ...n, read: true })));
}

export function getUnreadCount(): number {
  return getStored().filter(n => !n.read).length;
}

// Singleton interval to avoid multiple pollers running
let pollerInstance: ReturnType<typeof setInterval> | null = null;
let pollerRefCount = 0;

export function useNotificationPoller() {
  const { user } = useAuth();
  const { toast } = useToast();
  const prevState = useRef<Record<string, string>>(getSeenState());
  const initialized = useRef(false);

  const poll = useCallback(async () => {
    if (!user) return;
    try {
      // Poll KYC status via /api/me
      const meRes = await fetch("/api/me", { credentials: "include" });
      if (!meRes.ok) return;
      const me = await meRes.json();

      const currentSeen = { ...prevState.current };
      const nowState: Record<string, string> = { ...currentSeen };

      // Check KYC status change
      const kycKey = `kyc-${user.id}`;
      const prevKyc = currentSeen[kycKey];
      const currKyc = me.kycStatus;

      if (prevKyc && prevKyc !== currKyc) {
        if (currKyc === "approved") {
          addNotification({
            type: "kyc_approved",
            title: "KYC Approved!",
            body: "Your identity has been verified. Your $20 bonus has been credited.",
          });
          toast({
            title: "KYC Approved!",
            description: "Your identity has been verified and your $20 bonus has been credited to your account.",
          });
        } else if (currKyc === "declined") {
          addNotification({
            type: "kyc_declined",
            title: "KYC Declined",
            body: "Your KYC was unsuccessful. Please re-upload a clearer photo.",
          });
          toast({
            title: "KYC Update",
            description: "Your KYC verification was declined. Please re-submit with a clearer photo.",
            variant: "destructive",
          });
        }
      }
      nowState[kycKey] = currKyc ?? "none";

      // Poll transactions
      const txRes = await fetch("/api/transactions?limit=20", { credentials: "include" });
      if (txRes.ok) {
        const txs = await txRes.json();
        if (Array.isArray(txs)) {
          for (const tx of txs) {
            const txKey = `tx-${tx.id}`;
            const prevStatus = currentSeen[txKey];
            const currStatus = tx.status;

            if (prevStatus && prevStatus !== currStatus && prevStatus === "pending") {
              if (tx.type === "deposit" && currStatus === "approved") {
                addNotification({
                  type: "deposit_approved",
                  title: "Deposit Approved",
                  body: `Your deposit has been approved and credited to your balance.`,
                });
                toast({ title: "Deposit Approved!", description: "Your deposit has been credited to your balance." });
              } else if (tx.type === "deposit" && currStatus === "declined") {
                addNotification({
                  type: "deposit_declined",
                  title: "Deposit Declined",
                  body: "Your deposit request was declined. Please contact support.",
                });
                toast({ title: "Deposit Declined", description: "Your deposit request was declined.", variant: "destructive" });
              } else if (tx.type === "withdrawal" && currStatus === "approved") {
                addNotification({
                  type: "withdrawal_approved",
                  title: "Withdrawal Approved",
                  body: "Your withdrawal has been processed and is on its way.",
                });
                toast({ title: "Withdrawal Approved!", description: "Your withdrawal has been processed successfully." });
              } else if (tx.type === "withdrawal" && currStatus === "declined") {
                addNotification({
                  type: "withdrawal_declined",
                  title: "Withdrawal Declined",
                  body: "Your withdrawal request was declined. Please contact support.",
                });
                toast({ title: "Withdrawal Declined", description: "Your withdrawal request was declined.", variant: "destructive" });
              }
            }
            nowState[txKey] = currStatus;
          }
        }
      }

      prevState.current = nowState;
      setSeenState(nowState);
    } catch {
      // Silently fail — don't interrupt the user
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;

    // First run: initialize state without firing notifications
    if (!initialized.current) {
      initialized.current = true;
      // Initialize seen state without showing toasts
      (async () => {
        try {
          const [meRes, txRes] = await Promise.all([
            fetch("/api/me", { credentials: "include" }),
            fetch("/api/transactions?limit=20", { credentials: "include" }),
          ]);
          const me = meRes.ok ? await meRes.json() : {};
          const txs = txRes.ok ? await txRes.json() : [];
          const initState: Record<string, string> = { ...prevState.current };
          if (me.kycStatus) initState[`kyc-${user.id}`] = me.kycStatus;
          if (Array.isArray(txs)) {
            for (const tx of txs) initState[`tx-${tx.id}`] = tx.status;
          }
          prevState.current = initState;
          setSeenState(initState);
        } catch {/* ignore */}
      })();
      return;
    }

    pollerRefCount++;
    if (!pollerInstance) {
      pollerInstance = setInterval(poll, 20000); // poll every 20 seconds
    }

    return () => {
      pollerRefCount--;
      if (pollerRefCount <= 0 && pollerInstance) {
        clearInterval(pollerInstance);
        pollerInstance = null;
        pollerRefCount = 0;
      }
    };
  }, [user, poll]);
}
