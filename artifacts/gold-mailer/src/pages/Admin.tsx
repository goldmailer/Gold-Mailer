import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  useAdminGetUsers, useAdminDeleteUser, useAdminTopUpBalance, useAdminUpdateUser,
  useAdminGetTransactions, useAdminApproveTransaction, useAdminDeclineTransaction,
  useAdminSetDepositAccount, useGetDepositAccount,
  getAdminGetUsersQueryKey, getAdminGetTransactionsQueryKey, getGetDepositAccountQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_COUNTRIES } from "@/lib/countries";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Check, X, ArrowLeft, Settings, Users, List, Pencil, ToggleLeft, ToggleRight, MessageSquare, Send, ShieldCheck, ClipboardList, Eye, Clock, Phone } from "lucide-react";
import { Link } from "wouter";

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400",
    approved: "bg-green-500/15 text-green-400",
    declined: "bg-red-500/15 text-red-400",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? styles.pending}`}>{status.toUpperCase()}</span>;
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all ${value ? "bg-primary/10 border-primary/40" : "bg-background border-border"}`}
    >
      {value
        ? <ToggleRight size={22} className="text-primary shrink-0" />
        : <ToggleLeft size={22} className="text-muted-foreground shrink-0" />}
      <span className={`text-sm font-medium ${value ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
      <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${value ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
        {value ? "ON" : "OFF"}
      </span>
    </button>
  );
}

function TopUpModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");

  const mutation = useAdminTopUpBalance({
    mutation: {
      onSuccess: () => {
        toast({ title: "Balance topped up" });
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
        onClose();
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-card border border-border rounded-2xl p-6 w-80 shadow-2xl">
        <h3 className="font-bold mb-4">Top Up Balance</h3>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₦</span>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="pl-7" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-primary text-primary-foreground" disabled={!amount || mutation.isPending}
            onClick={() => mutation.mutate({ id: userId, data: { amount: parseFloat(amount) } })}>
            {mutation.isPending ? "..." : "Add Funds"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose }: { user: any; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    country: user.country ?? "NG",
    phone: user.phone ?? "",
  });

  const mutation = useAdminUpdateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User updated" });
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
        onClose();
      },
      onError: (err: any) => toast({ title: err?.data?.error || "Failed to update user", variant: "destructive" }),
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-card border border-border rounded-2xl p-6 w-96 shadow-2xl">
        <h3 className="font-bold mb-1">Edit User</h3>
        <p className="text-xs text-muted-foreground mb-4">{user.email}</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">First Name</label>
              <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Last Name</label>
              <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Email</label>
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Country</label>
            <Select value={form.country} onValueChange={val => setForm({ ...form, country: val })}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {ALL_COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Phone</label>
            <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-primary text-primary-foreground" disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: user.id, data: { firstName: form.firstName, lastName: form.lastName, email: form.email, country: form.country, phone: form.phone } })}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"users" | "transactions" | "settings" | "support" | "kyc" | "tasks" | "sms">("users");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [topUpUserId, setTopUpUserId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);

  // Support chat state
  const [supportUserId, setSupportUserId] = useState<number | null>(null);
  const [supportInput, setSupportInput] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const supportMsgsEndRef = useRef<HTMLDivElement>(null);

  // KYC state
  const [kycImagePreview, setKycImagePreview] = useState<string | null>(null);
  const [kycDeclineId, setKycDeclineId] = useState<number | null>(null);
  const [kycDeclineNote, setKycDeclineNote] = useState("");
  const [kycFilter, setKycFilter] = useState<"all" | "pending" | "approved" | "declined">("all");

  const KYC_QUERY_KEY = ["admin-kyc"];

  const { data: kycSubmissions = [], refetch: refetchKyc, isLoading: kycLoading, isFetching: kycFetching } = useQuery({
    queryKey: KYC_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/admin/kyc", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 20000,
  });

  const approveKyc = async (id: number) => {
    const res = await fetch(`/api/admin/kyc/${id}/approve`, { method: "POST", credentials: "include" });
    const data = await res.json();
    if (res.ok) {
      toast({ title: "KYC approved! Bonus credited." });
      queryClient.setQueryData(KYC_QUERY_KEY, (old: any[]) =>
        (old ?? []).map((s: any) => s.id === id ? { ...s, status: "approved" } : s)
      );
      refetchKyc();
    } else {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    }
  };

  const declineKyc = async () => {
    if (!kycDeclineId) return;
    const res = await fetch(`/api/admin/kyc/${kycDeclineId}/decline`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: kycDeclineNote }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: "KYC declined." });
      const declinedId = kycDeclineId;
      const declineNote = kycDeclineNote;
      setKycDeclineId(null);
      setKycDeclineNote("");
      queryClient.setQueryData(KYC_QUERY_KEY, (old: any[]) =>
        (old ?? []).map((s: any) => s.id === declinedId ? { ...s, status: "declined", notes: declineNote } : s)
      );
      refetchKyc();
    } else {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    }
  };

  // Tasks state
  const { data: taskSubmissions = [], refetch: refetchTasks } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tasks", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: tab === "tasks",
    refetchInterval: tab === "tasks" ? 10000 : false,
  });

  const approveTask = async (id: number) => {
    const res = await fetch(`/api/admin/tasks/${id}/approve`, { method: "POST", credentials: "include" });
    const data = await res.json();
    if (res.ok) { toast({ title: data.message }); refetchTasks(); }
    else toast({ title: "Error", description: data.error, variant: "destructive" });
  };

  const declineTask = async (id: number) => {
    const res = await fetch(`/api/admin/tasks/${id}/decline`, { method: "POST", credentials: "include" });
    const data = await res.json();
    if (res.ok) { toast({ title: "Task declined." }); refetchTasks(); }
    else toast({ title: "Error", description: data.error, variant: "destructive" });
  };

  const { data: supportChats, refetch: refetchChats } = useQuery({
    queryKey: ["admin-support-chats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/support/chats", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
    enabled: tab === "support",
  });

  const { data: supportMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["admin-support-messages", supportUserId],
    queryFn: async () => {
      if (!supportUserId) return [];
      const res = await fetch(`/api/admin/support/chats/${supportUserId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!supportUserId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    setTimeout(() => supportMsgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [supportMessages]);

  const sendSupportReply = async () => {
    if (!supportInput.trim() || !supportUserId || supportSending) return;
    setSupportSending(true);
    try {
      await fetch(`/api/admin/support/chats/${supportUserId}/reply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: supportInput.trim() }),
      });
      setSupportInput("");
      refetchMessages();
      refetchChats();
    } finally {
      setSupportSending(false);
    }
  };

  // SMS state
  const [smsUserId, setSmsUserId] = useState<number | null>(null);
  const [smsInput, setSmsInput] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const smsMsgsEndRef = useRef<HTMLDivElement>(null);

  const { data: smsConversations = [] } = useQuery({
    queryKey: ["admin-sms-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sms/conversations", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: tab === "sms" ? 6000 : false,
    enabled: tab === "sms",
  });

  const { data: smsMessages = [], refetch: refetchSmsMessages } = useQuery({
    queryKey: ["admin-sms-messages", smsUserId],
    queryFn: async () => {
      if (!smsUserId) return [];
      const res = await fetch(`/api/admin/sms/conversations/${smsUserId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!smsUserId,
    refetchInterval: 4000,
  });

  useEffect(() => {
    setTimeout(() => smsMsgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [smsMessages]);

  const sendSmsReply = async () => {
    if (!smsInput.trim() || !smsUserId || smsSending) return;
    setSmsSending(true);
    try {
      await fetch(`/api/admin/sms/conversations/${smsUserId}/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: smsInput.trim() }),
      });
      setSmsInput("");
      refetchSmsMessages();
    } finally {
      setSmsSending(false);
    }
  };

  const [depositCountry, setDepositCountry] = useState("DEFAULT");
  const [depositType, setDepositType] = useState<"bank" | "paypal">("paypal");
  const [depositBankForm, setDepositBankForm] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [depositPaypalForm, setDepositPaypalForm] = useState({ paypalEmail: "", paypalName: "" });

  const { data: usersRaw, isLoading: usersLoading } = useAdminGetUsers();
  const { data: transactionsRaw, isLoading: txLoading } = useAdminGetTransactions();
  const allUsers = Array.isArray(usersRaw) ? usersRaw : [];
  const transactions = Array.isArray(transactionsRaw) ? transactionsRaw : [];

  const users = countryFilter === "all"
    ? allUsers
    : allUsers.filter((u: any) => (u.country ?? "NG") === countryFilter);

  const countryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of allUsers) {
      const c = (u as any).country ?? "NG";
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts;
  }, [allUsers]);

  const countriesWithUsers = useMemo(() =>
    ALL_COUNTRIES.filter(c => countryStats[c.code])
      .sort((a, b) => (countryStats[b.code] ?? 0) - (countryStats[a.code] ?? 0)),
    [countryStats]);

  const countriesWithoutUsers = useMemo(() =>
    ALL_COUNTRIES.filter(c => !countryStats[c.code]),
    [countryStats]);

  const { data: depositAccount } = useGetDepositAccount({ query: { queryKey: getGetDepositAccountQueryKey() } });

  const savedAccounts = (depositAccount as any)?.accounts ?? {} as Record<string, any>;
  const savedAccountEntries = Object.entries(savedAccounts) as [string, any][];

  const getCountryLabel = (code: string) => {
    if (code === "DEFAULT") return "Default (All other countries)";
    return ALL_COUNTRIES.find(c => c.code === code)?.name ?? code;
  };

  const deleteMutation = useAdminDeleteUser({
    mutation: {
      onSuccess: () => { toast({ title: "User deleted" }); queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    },
  });

  const approveMutation = useAdminApproveTransaction({
    mutation: {
      onSuccess: () => { toast({ title: "Transaction approved" }); queryClient.invalidateQueries({ queryKey: getAdminGetTransactionsQueryKey() }); },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    },
  });

  const declineMutation = useAdminDeclineTransaction({
    mutation: {
      onSuccess: () => { toast({ title: "Transaction declined" }); queryClient.invalidateQueries({ queryKey: getAdminGetTransactionsQueryKey() }); },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    },
  });

  const depositAccountMutation = useAdminSetDepositAccount({
    mutation: {
      onSuccess: () => {
        toast({ title: "Deposit account saved" });
        queryClient.invalidateQueries({ queryKey: getGetDepositAccountQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.data?.error || "Failed to save settings", variant: "destructive" });
      },
    },
  });

  const handleDepositSave = () => {
    if (depositType === "bank") {
      if (!depositBankForm.bankName.trim() || !depositBankForm.accountNumber.trim() || !depositBankForm.accountName.trim()) {
        toast({ title: "Bank name, account number, and account name are required", variant: "destructive" });
        return;
      }
      depositAccountMutation.mutate({ data: { countryCode: depositCountry, type: "bank", ...depositBankForm } as any });
    } else {
      if (!depositPaypalForm.paypalEmail.trim()) {
        toast({ title: "PayPal email is required", variant: "destructive" });
        return;
      }
      depositAccountMutation.mutate({ data: { countryCode: depositCountry, type: "paypal", ...depositPaypalForm } as any });
    }
  };

  const totalUnread = Array.isArray(supportChats)
    ? supportChats.reduce((s: number, c: any) => s + (c.unreadCount ?? 0), 0)
    : 0;

  const pendingKycCount = Array.isArray(kycSubmissions) ? kycSubmissions.filter((k: any) => k.status === "pending").length : 0;
  const pendingTasksCount = Array.isArray(taskSubmissions) ? taskSubmissions.filter((t: any) => t.status === "pending").length : 0;

  const tabs = [
    { key: "users", label: "Users", icon: Users },
    { key: "transactions", label: "Transactions", icon: List },
    { key: "kyc", label: "KYC", icon: ShieldCheck, badge: pendingKycCount },
    { key: "tasks", label: "Tasks", icon: ClipboardList, badge: pendingTasksCount },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "support", label: "Support", icon: MessageSquare, badge: totalUnread },
    { key: "sms", label: "SMS", icon: Phone },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {topUpUserId !== null && <TopUpModal userId={topUpUserId} onClose={() => setTopUpUserId(null)} />}
      {editUser !== null && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}

      {/* KYC Image Preview Modal */}
      {kycImagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setKycImagePreview(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={kycImagePreview} alt="ID" className="w-full rounded-xl" />
            <button onClick={() => setKycImagePreview(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* KYC Decline Note Modal */}
      {kycDeclineId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="font-bold mb-3">Decline KYC — Add Note</h3>
            <textarea
              value={kycDeclineNote}
              onChange={e => setKycDeclineNote(e.target.value)}
              placeholder="Reason for decline (shown to user)..."
              rows={3}
              className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary mb-4"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setKycDeclineId(null); setKycDeclineNote(""); }}>Cancel</Button>
              <Button className="flex-1 bg-destructive text-destructive-foreground" onClick={declineKyc}>
                Confirm Decline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <button className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-primary">GOLDMAILER</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-medium">Admin Access</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 py-2 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon, ...rest }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${tab === key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
              <Icon size={14} />
              {label}
              {(rest as any).badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {(rest as any).badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="font-bold text-lg">
                {countryFilter === "all"
                  ? "All Users"
                  : (ALL_COUNTRIES.find(c => c.code === countryFilter)?.name ?? countryFilter) + " Users"
                } ({users.length})
              </h2>
              {/* Country switcher */}
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-52 h-9 text-xs">
                  <SelectValue placeholder="Filter by country" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="all">All Countries ({allUsers.length})</SelectItem>
                  {countriesWithUsers.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-xs text-primary">Countries with users</SelectLabel>
                      {countriesWithUsers.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name} ({countryStats[c.code]})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {countriesWithoutUsers.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">No users yet</SelectLabel>
                      {countriesWithoutUsers.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>

            {usersLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}</div>
            ) : !users.length ? (
              <p className="text-muted-foreground text-center py-12">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-3">User</th>
                      <th className="text-left py-3 px-3">Password</th>
                      <th className="text-left py-3 px-3">Balance</th>
                      <th className="text-left py-3 px-3">Country</th>
                      <th className="text-left py-3 px-3">Status</th>
                      <th className="text-left py-3 px-3">Referrals</th>
                      <th className="text-left py-3 px-3">Ref. Code</th>
                      <th className="text-left py-3 px-3">Joined</th>
                      <th className="text-left py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-medium">{u.email}</p>
                          <p className="text-xs text-muted-foreground">{u.firstName} {u.lastName}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs bg-background px-2 py-1 rounded border border-border">{u.plainPassword ?? "—"}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-primary">{fmt(u.balance)}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${u.country === "US" ? "bg-blue-500/15 text-blue-400" : "bg-muted text-muted-foreground"}`}>
                            {u.country ?? "NG"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.isVerified ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                            {u.isVerified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs">
                            <span className="font-bold text-foreground">{u.referralCount ?? 0}</span>
                            <span className="text-muted-foreground"> refs</span>
                          </div>
                          {(u.referralEarned ?? 0) > 0 && <p className="text-xs text-green-400 font-medium">{fmt(u.referralEarned)}</p>}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs bg-background px-2 py-1 rounded border border-border">{u.referralCode ?? "—"}</span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditUser(u)}>
                              <Pencil size={11} /> Edit
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setTopUpUserId(u.id)}>
                              <Plus size={12} /> Top Up
                            </Button>
                            <Button size="sm" variant="outline"
                              className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs gap-1"
                              disabled={deleteMutation.isPending}
                              onClick={() => { if (confirm(`Delete user ${u.email}? This cannot be undone.`)) deleteMutation.mutate({ id: u.id }); }}>
                              <Trash2 size={12} /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {tab === "transactions" && (
          <div>
            <h2 className="font-bold text-lg mb-4">All Transactions ({transactions.length})</h2>
            {txLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}</div>
            ) : !transactions.length ? (
              <p className="text-muted-foreground text-center py-12">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-3">ID</th>
                      <th className="text-left py-3 px-3">Type</th>
                      <th className="text-left py-3 px-3">Amount</th>
                      <th className="text-left py-3 px-3">Status</th>
                      <th className="text-left py-3 px-3">Details</th>
                      <th className="text-left py-3 px-3">Date</th>
                      <th className="text-left py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t: any) => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                        <td className="py-3 px-3 text-muted-foreground text-xs">#{t.id}</td>
                        <td className="py-3 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.type === "deposit" ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400"}`}>
                            {t.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-primary">{fmt(t.amount)}</td>
                        <td className="py-3 px-3"><StatusBadge status={t.status} /></td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          {t.type === "deposit" ? (
                            <span>Ref: {t.transactionId ?? "—"}</span>
                          ) : t.bankName === "PayPal" ? (
                            <span>PayPal<br />{t.accountNumber}<br />{t.accountName}</span>
                          ) : (
                            <span>{t.bankName}<br />{t.accountNumber} · {t.accountName}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                          {t.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                                onClick={() => approveMutation.mutate({ id: t.id })} disabled={approveMutation.isPending}>
                                <Check size={11} /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1"
                                onClick={() => declineMutation.mutate({ id: t.id })} disabled={declineMutation.isPending}>
                                <X size={11} /> Decline
                              </Button>
                            </div>
                          )}
                          {t.status !== "pending" && <span className="text-xs text-muted-foreground italic">Processed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <div className="max-w-lg space-y-6">
            <div>
              <h2 className="font-bold text-lg mb-1">Deposit Settings</h2>
              <p className="text-muted-foreground text-sm">Set payment details per country. Users see their country's account, or the default if none is set.</p>
            </div>

            {/* Configured accounts list */}
            {savedAccountEntries.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configured Accounts</p>
                {savedAccountEntries
                  .sort(([a]) => a === "DEFAULT" ? -1 : 1)
                  .map(([code, acct]) => (
                  <div key={code} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{getCountryLabel(code)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {acct.type === "bank"
                          ? `Bank: ${acct.bankName} · ${acct.accountNumber}`
                          : `PayPal: ${acct.paypalEmail}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-medium"
                        onClick={() => {
                          setDepositCountry(code);
                          setDepositType(acct.type);
                          if (acct.type === "bank") {
                            setDepositBankForm({ bankName: acct.bankName ?? "", accountNumber: acct.accountNumber ?? "", accountName: acct.accountName ?? "" });
                          } else {
                            setDepositPaypalForm({ paypalEmail: acct.paypalEmail ?? "", paypalName: acct.paypalName ?? "" });
                          }
                        }}
                      >Edit</button>
                      <button
                        className="text-xs px-2.5 py-1 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 font-medium"
                        onClick={async () => {
                          await fetch(`/api/admin/deposit-account/${code}`, { method: "DELETE", credentials: "include" });
                          queryClient.invalidateQueries({ queryKey: getGetDepositAccountQueryKey() });
                          toast({ title: `Removed ${getCountryLabel(code)}` });
                        }}
                      >Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Configure form */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configure Deposit Account</p>

              {/* Country selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Country</label>
                <Select value={depositCountry} onValueChange={setDepositCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="DEFAULT">Default — All other countries</SelectItem>
                    {countriesWithUsers.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-xs text-primary">Countries with users</SelectLabel>
                        {countriesWithUsers.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">All countries</SelectLabel>
                      {countriesWithoutUsers.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Type toggle */}
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDepositType("bank")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${depositType === "bank" ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >Bank Transfer</button>
                  <button
                    onClick={() => setDepositType("paypal")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${depositType === "paypal" ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >PayPal</button>
                </div>
              </div>

              {depositType === "bank" ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Bank Name</label>
                    <Input value={depositBankForm.bankName} onChange={e => setDepositBankForm(p => ({ ...p, bankName: e.target.value }))} placeholder="e.g. GTBank, Chase, Barclays" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Account Number</label>
                    <Input value={depositBankForm.accountNumber} onChange={e => setDepositBankForm(p => ({ ...p, accountNumber: e.target.value }))} placeholder="Account number or routing info" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Account Name</label>
                    <Input value={depositBankForm.accountName} onChange={e => setDepositBankForm(p => ({ ...p, accountName: e.target.value }))} placeholder="Account holder name" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">PayPal Email</label>
                    <Input type="email" value={depositPaypalForm.paypalEmail} onChange={e => setDepositPaypalForm(p => ({ ...p, paypalEmail: e.target.value }))} placeholder="paypal@example.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">PayPal Account Name</label>
                    <Input value={depositPaypalForm.paypalName} onChange={e => setDepositPaypalForm(p => ({ ...p, paypalName: e.target.value }))} placeholder="Name as shown on PayPal" />
                  </div>
                </>
              )}

              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold py-5"
                onClick={handleDepositSave}
                disabled={depositAccountMutation.isPending}
              >
                {depositAccountMutation.isPending ? "Saving..." : `Save for ${getCountryLabel(depositCountry)}`}
              </Button>
            </div>
          </div>
        )}
        {/* ── KYC TAB ── */}
        {tab === "kyc" && (
          <div>
            <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
              <h2 className="font-bold text-lg">KYC Verifications ({(kycSubmissions as any[]).length})</h2>
              <button onClick={() => refetchKyc()} className="text-xs text-primary flex items-center gap-1 hover:underline" disabled={kycFetching}>
                {kycFetching ? "Refreshing…" : "Refresh"}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Review and approve identity documents. Approving credits $20 to the user.</p>

            {/* Filter tabs */}
            <div className="flex gap-1.5 mb-5 flex-wrap">
              {(["all", "pending", "approved", "declined"] as const).map(f => {
                const count = f === "all"
                  ? (kycSubmissions as any[]).length
                  : (kycSubmissions as any[]).filter((s: any) => s.status === f).length;
                return (
                  <button
                    key={f}
                    onClick={() => setKycFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      kycFilter === f
                        ? f === "pending" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : f === "approved" ? "bg-green-500/20 text-green-400 border border-green-500/40"
                        : f === "declined" ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-primary/20 text-primary border border-primary/40"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f} ({count})
                  </button>
                );
              })}
            </div>

            {kycLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex gap-2">
                          <div className="h-5 w-16 rounded-full bg-border" />
                          <div className="h-5 w-12 rounded-full bg-border" />
                        </div>
                        <div className="h-5 w-48 rounded bg-border" />
                        <div className="h-4 w-36 rounded bg-border" />
                        <div className="h-4 w-56 rounded bg-border" />
                      </div>
                      <div className="space-y-2 shrink-0">
                        <div className="h-8 w-28 rounded-lg bg-border" />
                        <div className="flex gap-2">
                          <div className="h-8 w-24 rounded-lg bg-border" />
                          <div className="h-8 w-20 rounded-lg bg-border" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (() => {
              const filtered = kycFilter === "all"
                ? (kycSubmissions as any[])
                : (kycSubmissions as any[]).filter((s: any) => s.status === kycFilter);
              return !filtered.length ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <ShieldCheck size={36} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{kycFilter === "all" ? "No KYC submissions yet." : `No ${kycFilter} submissions.`}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((sub: any) => (
                  <div key={sub.id} className={`bg-card border rounded-xl p-5 ${sub.status === "pending" ? "border-amber-500/30" : sub.status === "approved" ? "border-green-500/30" : "border-red-500/30"}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold">{sub.user?.firstName ?? ""} {sub.user?.lastName ?? ""}</p>
                          <StatusBadge status={sub.status} />
                          <span className="text-xs text-muted-foreground">#{sub.id}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{sub.user?.email}</p>
                        <p className="text-xs font-medium text-primary capitalize">
                          ID Type: {sub.idType.replace("_", " ").toUpperCase()}
                        </p>
                        {sub.notes && (
                          <p className="text-xs text-red-400 mt-1">Decline note: {sub.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{new Date(sub.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="flex flex-col gap-2 items-end shrink-0">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                          onClick={() => setKycImagePreview(sub.idImageUrl)}>
                          <Eye size={11} /> View ID Photo
                        </Button>
                        {sub.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                              onClick={() => approveKyc(sub.id)}>
                              <Check size={11} /> Approve (+$20)
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1"
                              onClick={() => { setKycDeclineId(sub.id); setKycDeclineNote(""); }}>
                              <X size={11} /> Decline
                            </Button>
                          </div>
                        )}
                        {sub.status !== "pending" && (
                          <span className="text-xs text-muted-foreground italic">Processed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
            })()}
          </div>
        )}

        {/* ── TASKS TAB ── */}
        {tab === "tasks" && (
          <div>
            <h2 className="font-bold text-lg mb-1">Task Submissions ({(taskSubmissions as any[]).length})</h2>
            <p className="text-sm text-muted-foreground mb-6">Review task proof submissions. Approving credits $0.70 to the user.</p>

            {!(taskSubmissions as any[]).length ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <ClipboardList size={36} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No task submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(taskSubmissions as any[]).map((sub: any) => (
                  <div key={sub.id} className={`bg-card border rounded-xl p-5 ${sub.status === "pending" ? "border-amber-500/30" : sub.status === "approved" ? "border-green-500/30" : "border-red-500/30"}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm">{sub.websiteName}</p>
                          <StatusBadge status={sub.status} />
                          <span className="text-xs text-primary font-bold">+${sub.earnedAmount.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          User: {sub.user?.firstName ?? ""} {sub.user?.lastName ?? ""} ({sub.user?.email ?? `#${sub.userId}`})
                        </p>
                        <div className="bg-background border border-border rounded-lg p-3 mt-2">
                          <p className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                            <ClipboardList size={10} /> Proof submitted:
                          </p>
                          <p className="text-xs text-foreground break-words">{sub.proofText}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(sub.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="shrink-0 flex flex-col gap-2 items-end">
                        {sub.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                              onClick={() => approveTask(sub.id)}>
                              <Check size={11} /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1"
                              onClick={() => declineTask(sub.id)}>
                              <X size={11} /> Decline
                            </Button>
                          </div>
                        )}
                        {sub.status !== "pending" && (
                          <span className="text-xs text-muted-foreground italic">Processed</span>
                        )}
                        <a href={sub.websiteUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline">
                          Visit site ↗
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUPPORT TAB ── */}
        {tab === "support" && (
          <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: 520 }}>
            {/* Conversation list */}
            <div className="lg:w-72 shrink-0 bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border">
                <p className="font-bold text-sm">Conversations</p>
                <p className="text-xs text-muted-foreground">Auto-refreshes every 5s</p>
              </div>
              <div className="overflow-y-auto flex-1">
                {!Array.isArray(supportChats) || supportChats.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare size={28} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  </div>
                ) : (
                  supportChats.map((chat: any) => (
                    <button
                      key={chat.userId}
                      onClick={() => setSupportUserId(chat.userId)}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-accent transition-colors ${supportUserId === chat.userId ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{chat.firstName ?? ""} {chat.lastName ?? ""}</p>
                          <p className="text-xs text-muted-foreground truncate">{chat.email}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5 italic">
                            {chat.lastSender === "admin" ? "You: " : ""}{chat.lastMessage}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Message panel */}
            {supportUserId ? (
              <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden" style={{ minHeight: 400 }}>
                <div className="px-4 py-3 border-b border-border shrink-0">
                  {(() => {
                    const c = Array.isArray(supportChats) ? supportChats.find((ch: any) => ch.userId === supportUserId) : null;
                    return c ? (
                      <div>
                        <p className="font-bold text-sm">{c.firstName ?? ""} {c.lastName ?? ""}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {(Array.isArray(supportMessages) ? supportMessages : []).map((m: any) => (
                    <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${
                        m.sender === "admin"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm border border-border"
                      }`}>
                        <p className="text-xs font-bold mb-0.5 opacity-60">{m.sender === "admin" ? "You (Admin)" : "User"}</p>
                        <p className="break-words">{m.message}</p>
                        <p className="text-xs opacity-40 mt-1 text-right">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={supportMsgsEndRef} />
                </div>

                <div className="border-t border-border p-3 flex gap-2 shrink-0">
                  <Input
                    value={supportInput}
                    onChange={e => setSupportInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendSupportReply(); } }}
                    placeholder="Type a reply to this user..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={sendSupportReply}
                    disabled={!supportInput.trim() || supportSending}
                    className="bg-primary text-primary-foreground"
                  >
                    <Send size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-card border border-border rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={36} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Select a conversation to view and reply</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SMS TAB ── */}
        {tab === "sms" && (
          <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: 520 }}>
            {/* Conversation list */}
            <div className="lg:w-72 shrink-0 bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border">
                <p className="font-bold text-sm">SMS Conversations</p>
                <p className="text-xs text-muted-foreground">Users with verified phones</p>
              </div>
              <div className="overflow-y-auto flex-1">
                {!(smsConversations as any[]).length ? (
                  <div className="p-6 text-center">
                    <Phone size={28} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No SMS conversations yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Users must verify their phone first.</p>
                  </div>
                ) : (
                  (smsConversations as any[]).map((conv: any) => (
                    <button
                      key={conv.userId}
                      onClick={() => setSmsUserId(conv.userId)}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-accent transition-colors ${smsUserId === conv.userId ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{conv.firstName ?? ""} {conv.lastName ?? ""}</p>
                          <p className="text-xs text-muted-foreground truncate">{conv.phone}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5 italic">
                            {conv.lastDirection === "inbound" ? "→ " : "← "}{conv.lastMessage}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Message panel */}
            {smsUserId ? (
              <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden" style={{ minHeight: 400 }}>
                <div className="px-4 py-3 border-b border-border shrink-0">
                  {(() => {
                    const c = (smsConversations as any[]).find((ch: any) => ch.userId === smsUserId);
                    return c ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                          <Phone size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{c.firstName ?? ""} {c.lastName ?? ""}</p>
                          <p className="text-xs text-muted-foreground">{c.phone} · {c.email}</p>
                        </div>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">Verified</span>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {(smsMessages as any[]).map((m: any) => (
                    <div key={m.id} className={`flex ${m.direction === "inbound" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${
                        m.direction === "inbound"
                          ? "bg-muted text-foreground rounded-bl-sm border border-border"
                          : "bg-primary text-primary-foreground rounded-br-sm"
                      }`}>
                        <p className="text-xs font-bold mb-0.5 opacity-60">
                          {m.direction === "inbound" ? "User (SMS)" : "You (Sent via SMS)"}
                        </p>
                        <p className="break-words">{m.body}</p>
                        <p className="text-xs opacity-40 mt-1 text-right">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={smsMsgsEndRef} />
                </div>

                <div className="border-t border-border p-3 flex gap-2 shrink-0">
                  <Input
                    value={smsInput}
                    onChange={e => setSmsInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendSmsReply(); } }}
                    placeholder="Type SMS to send to this user..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={sendSmsReply}
                    disabled={!smsInput.trim() || smsSending}
                    className="bg-primary text-primary-foreground gap-1"
                  >
                    <Phone size={13} />
                    <Send size={13} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-card border border-border rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Phone size={36} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Select a conversation to view and reply via SMS</p>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
