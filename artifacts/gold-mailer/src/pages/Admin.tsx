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
import { Trash2, Plus, Check, X, ArrowLeft, Settings, Users, List, Pencil, ToggleLeft, ToggleRight, MessageSquare, Send } from "lucide-react";
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
  const [tab, setTab] = useState<"users" | "transactions" | "settings" | "support">("users");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [topUpUserId, setTopUpUserId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);

  // Support chat state
  const [supportUserId, setSupportUserId] = useState<number | null>(null);
  const [supportInput, setSupportInput] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const supportMsgsEndRef = useRef<HTMLDivElement>(null);

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

  const emptyDeposit = {
    bankName: "", accountNumber: "", accountName: "",
    paypalEmail: "", paypalName: "",
    usBankName: "", usAccountNumber: "", usAccountName: "",
    usPaypalEmail: "", usPaypalName: "",
    usShowBank: false, usShowPaypal: false,
  };
  const [depositForm, setDepositForm] = useState(emptyDeposit);
  const [formInitialized, setFormInitialized] = useState(false);

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

  useEffect(() => {
    if (depositAccount && !formInitialized) {
      const d = depositAccount as any;
      setDepositForm({
        bankName: d.bankName ?? "",
        accountNumber: d.accountNumber ?? "",
        accountName: d.accountName ?? "",
        paypalEmail: d.paypalEmail ?? "",
        paypalName: d.paypalName ?? "",
        usBankName: d.usBankName ?? "",
        usAccountNumber: d.usAccountNumber ?? "",
        usAccountName: d.usAccountName ?? "",
        usPaypalEmail: d.usPaypalEmail ?? "",
        usPaypalName: d.usPaypalName ?? "",
        usShowBank: d.usShowBank ?? false,
        usShowPaypal: d.usShowPaypal ?? false,
      });
      setFormInitialized(true);
    }
  }, [depositAccount, formInitialized]);

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
      onSuccess: (data: any) => {
        toast({ title: "Settings saved successfully" });
        queryClient.invalidateQueries({ queryKey: getGetDepositAccountQueryKey() });
        setDepositForm({
          bankName: data.bankName ?? "",
          accountNumber: data.accountNumber ?? "",
          accountName: data.accountName ?? "",
          paypalEmail: data.paypalEmail ?? "",
          paypalName: data.paypalName ?? "",
          usBankName: data.usBankName ?? "",
          usAccountNumber: data.usAccountNumber ?? "",
          usAccountName: data.usAccountName ?? "",
          usPaypalEmail: data.usPaypalEmail ?? "",
          usPaypalName: data.usPaypalName ?? "",
          usShowBank: data.usShowBank ?? false,
          usShowPaypal: data.usShowPaypal ?? false,
        });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.data?.error || "Failed to save settings", variant: "destructive" });
      },
    },
  });

  const handleSave = () => {
    if (!depositForm.bankName.trim() || !depositForm.accountNumber.trim() || !depositForm.accountName.trim()) {
      toast({ title: "Nigerian bank name, account number, and account name are required", variant: "destructive" });
      return;
    }
    depositAccountMutation.mutate({ data: depositForm as any });
  };

  const totalUnread = Array.isArray(supportChats)
    ? supportChats.reduce((s: number, c: any) => s + (c.unreadCount ?? 0), 0)
    : 0;

  const tabs = [
    { key: "users", label: "Users", icon: Users },
    { key: "transactions", label: "Transactions", icon: List },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "support", label: "Support", icon: MessageSquare, badge: totalUnread },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {topUpUserId !== null && <TopUpModal userId={topUpUserId} onClose={() => setTopUpUserId(null)} />}
      {editUser !== null && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}

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
          <div className="max-w-lg space-y-8">
            <div>
              <h2 className="font-bold text-lg mb-1">Deposit Settings</h2>
              <p className="text-muted-foreground text-sm">Configure bank and PayPal details for each user group.</p>
            </div>

            {/* ── Section 1: Nigerian Bank Account ── */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🇳🇬</span>
                <div>
                  <p className="font-bold text-sm">Nigerian Bank Account</p>
                  <p className="text-xs text-muted-foreground">Shown to all Nigerian (NG) users when depositing</p>
                </div>
              </div>

              {depositAccount?.bankName && (
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Currently saved</p>
                  <p className="font-bold">{depositAccount.bankName}</p>
                  <p className="text-primary font-mono text-lg font-black">{depositAccount.accountNumber}</p>
                  <p className="text-sm text-muted-foreground">{depositAccount.accountName}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Bank Name</label>
                <Input value={depositForm.bankName} onChange={e => setDepositForm(p => ({ ...p, bankName: e.target.value }))} placeholder="e.g. GTBank" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Account Number</label>
                <Input value={depositForm.accountNumber} onChange={e => setDepositForm(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit account number" maxLength={10} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Account Name</label>
                <Input value={depositForm.accountName} onChange={e => setDepositForm(p => ({ ...p, accountName: e.target.value }))} placeholder="Account holder name" />
              </div>
            </div>

            {/* ── Section 2: UK/CA PayPal ── */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🇬🇧🇨🇦</span>
                <div>
                  <p className="font-bold text-sm">PayPal — UK & Canada Users</p>
                  <p className="text-xs text-muted-foreground">Shown to UK and Canadian users when depositing</p>
                </div>
              </div>

              {(depositAccount as any)?.paypalEmail && (
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Currently saved</p>
                  <p className="font-bold">{(depositAccount as any).paypalName}</p>
                  <p className="text-primary font-mono font-black">{(depositAccount as any).paypalEmail}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">PayPal Email</label>
                <Input type="email" value={depositForm.paypalEmail} onChange={e => setDepositForm(p => ({ ...p, paypalEmail: e.target.value }))} placeholder="paypal@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">PayPal Account Name</label>
                <Input value={depositForm.paypalName} onChange={e => setDepositForm(p => ({ ...p, paypalName: e.target.value }))} placeholder="Name as shown on PayPal" />
              </div>
            </div>

            {/* ── Section 3: US-ONLY settings ── */}
            <div className="bg-card border border-primary/20 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇺🇸</span>
                <div>
                  <p className="font-bold text-sm">US Users Deposit Settings</p>
                  <p className="text-xs text-muted-foreground">These settings <span className="text-primary font-semibold">only apply to US accounts</span>. Use the toggles to control what is shown.</p>
                </div>
              </div>

              {/* US Bank Account */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Bank Account</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bank Name</label>
                  <Input value={depositForm.usBankName} onChange={e => setDepositForm(p => ({ ...p, usBankName: e.target.value }))} placeholder="e.g. Chase, Bank of America" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Account Number / Routing</label>
                  <Input value={depositForm.usAccountNumber} onChange={e => setDepositForm(p => ({ ...p, usAccountNumber: e.target.value }))} placeholder="Account number or Zelle ID" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Account Name</label>
                  <Input value={depositForm.usAccountName} onChange={e => setDepositForm(p => ({ ...p, usAccountName: e.target.value }))} placeholder="Account holder name" />
                </div>
                <Toggle
                  value={depositForm.usShowBank}
                  onChange={v => setDepositForm(p => ({ ...p, usShowBank: v }))}
                  label="Show this bank account to US users on deposit page"
                />
              </div>

              <div className="border-t border-border" />

              {/* US PayPal */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom PayPal Account</p>
                <div>
                  <label className="text-sm font-medium mb-2 block">PayPal Email</label>
                  <Input type="email" value={depositForm.usPaypalEmail} onChange={e => setDepositForm(p => ({ ...p, usPaypalEmail: e.target.value }))} placeholder="us-paypal@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">PayPal Account Name</label>
                  <Input value={depositForm.usPaypalName} onChange={e => setDepositForm(p => ({ ...p, usPaypalName: e.target.value }))} placeholder="Name as shown on PayPal" />
                </div>
                <Toggle
                  value={depositForm.usShowPaypal}
                  onChange={v => setDepositForm(p => ({ ...p, usShowPaypal: v }))}
                  label="Show this PayPal account to US users on deposit page"
                />
              </div>
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold py-5"
              onClick={handleSave}
              disabled={depositAccountMutation.isPending}
            >
              {depositAccountMutation.isPending ? "Saving..." : "Save All Settings"}
            </Button>
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

      </main>
    </div>
  );
}
