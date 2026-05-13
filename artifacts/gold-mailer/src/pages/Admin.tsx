import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminGetUsers, useAdminDeleteUser, useAdminTopUpBalance,
  useAdminGetTransactions, useAdminApproveTransaction, useAdminDeclineTransaction,
  useAdminSetDepositAccount, useGetDepositAccount,
  getAdminGetUsersQueryKey, getAdminGetTransactionsQueryKey, getGetDepositAccountQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Check, X, ArrowLeft, Settings, Users, List } from "lucide-react";
import { Link } from "wouter";

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400",
    approved: "bg-green-500/15 text-green-400",
    declined: "bg-red-500/15 text-red-400",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? styles.pending}`}>{status.toUpperCase()}</span>;
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
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="pl-7" data-testid="input-topup-amount" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-primary text-primary-foreground" disabled={!amount || mutation.isPending}
            onClick={() => mutation.mutate({ id: userId, data: { amount: parseFloat(amount) } })} data-testid="button-topup-confirm">
            {mutation.isPending ? "..." : "Add Funds"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"users" | "transactions" | "settings">("users");
  const [topUpUserId, setTopUpUserId] = useState<number | null>(null);
  const [depositForm, setDepositForm] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [formInitialized, setFormInitialized] = useState(false);

  const { data: usersRaw, isLoading: usersLoading, isError: usersError } = useAdminGetUsers();
  const { data: transactionsRaw, isLoading: txLoading, isError: txError } = useAdminGetTransactions();
  const users = Array.isArray(usersRaw) ? usersRaw : [];
  const transactions = Array.isArray(transactionsRaw) ? transactionsRaw : [];
  const { data: depositAccount } = useGetDepositAccount({ query: { queryKey: getGetDepositAccountQueryKey() } });

  useEffect(() => {
    if (depositAccount && !formInitialized) {
      setDepositForm({
        bankName: depositAccount.bankName ?? "",
        accountNumber: depositAccount.accountNumber ?? "",
        accountName: depositAccount.accountName ?? "",
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
      onSuccess: (data) => {
        toast({ title: "Deposit account updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetDepositAccountQueryKey() });
        setDepositForm({
          bankName: data.bankName ?? "",
          accountNumber: data.accountNumber ?? "",
          accountName: data.accountName ?? "",
        });
      },
      onError: (err: any) => {
        const msg = err?.data?.error || err?.message || "Failed to save deposit account";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const handleSaveDepositAccount = () => {
    const { bankName, accountNumber, accountName } = depositForm;
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast({ title: "All fields are required", description: "Please fill in bank name, account number, and account name.", variant: "destructive" });
      return;
    }
    depositAccountMutation.mutate({ data: { bankName: bankName.trim(), accountNumber: accountNumber.trim(), accountName: accountName.trim() } });
  };

  const tabs = [
    { key: "users", label: "Users", icon: Users },
    { key: "transactions", label: "Transactions", icon: List },
    { key: "settings", label: "Deposit Account", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {topUpUserId !== null && <TopUpModal userId={topUpUserId} onClose={() => setTopUpUserId(null)} />}

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
        <div className="max-w-6xl mx-auto px-4 flex gap-1 py-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              data-testid={`tab-admin-${key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* USERS TAB */}
        {tab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">All Users ({users?.length ?? 0})</h2>
            </div>
            {usersLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}</div>
            ) : !users?.length ? (
              <p className="text-muted-foreground text-center py-12">No users registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-3">Email</th>
                      <th className="text-left py-3 px-3">Password</th>
                      <th className="text-left py-3 px-3">Balance</th>
                      <th className="text-left py-3 px-3">Status</th>
                      <th className="text-left py-3 px-3">Joined</th>
                      <th className="text-left py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} data-testid={`row-user-${u.id}`} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-medium">{u.email}</p>
                          <p className="text-xs text-muted-foreground">{u.firstName} {u.lastName}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs bg-background px-2 py-1 rounded border border-border" data-testid={`text-password-${u.id}`}>
                            {u.plainPassword ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-primary" data-testid={`text-balance-${u.id}`}>{fmt(u.balance)}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.isVerified ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                            {u.isVerified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                              onClick={() => setTopUpUserId(u.id)} data-testid={`button-topup-${u.id}`}>
                              <Plus size={12} /> Top Up
                            </Button>
                            <Button size="sm" variant="outline"
                              className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs gap-1"
                              disabled={deleteMutation.isPending}
                              onClick={() => { if (confirm(`Delete user ${u.email}? This cannot be undone.`)) deleteMutation.mutate({ id: u.id }); }}
                              data-testid={`button-delete-${u.id}`}>
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

        {/* TRANSACTIONS TAB */}
        {tab === "transactions" && (
          <div>
            <h2 className="font-bold text-lg mb-4">All Transactions ({transactions?.length ?? 0})</h2>
            {txLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}</div>
            ) : !transactions?.length ? (
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
                      <tr key={t.id} data-testid={`row-tx-${t.id}`} className="border-b border-border/50 hover:bg-card/50 transition-colors">
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
                          ) : (
                            <span>{t.bankName}<br />{t.accountNumber} · {t.accountName}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                          {t.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                                onClick={() => approveMutation.mutate({ id: t.id })}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${t.id}`}>
                                <Check size={11} /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1"
                                onClick={() => declineMutation.mutate({ id: t.id })}
                                disabled={declineMutation.isPending}
                                data-testid={`button-decline-${t.id}`}>
                                <X size={11} /> Decline
                              </Button>
                            </div>
                          )}
                          {t.status !== "pending" && (
                            <span className="text-xs text-muted-foreground italic">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DEPOSIT ACCOUNT SETTINGS */}
        {tab === "settings" && (
          <div className="max-w-md">
            <h2 className="font-bold text-lg mb-4">Deposit Account Settings</h2>
            <p className="text-muted-foreground text-sm mb-6">Set the bank account users should transfer to when depositing.</p>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              {depositAccount?.bankName && (
                <div className="bg-background rounded-xl p-4 border border-border mb-2">
                  <p className="text-xs text-muted-foreground mb-2">Current Saved Account</p>
                  <p className="font-bold">{depositAccount.bankName}</p>
                  <p className="text-primary font-mono text-lg font-black">{depositAccount.accountNumber}</p>
                  <p className="text-sm text-muted-foreground">{depositAccount.accountName}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Bank Name</label>
                <Input
                  value={depositForm.bankName}
                  onChange={e => setDepositForm(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="e.g. GTBank"
                  data-testid="input-admin-bank-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Account Number</label>
                <Input
                  value={depositForm.accountNumber}
                  onChange={e => setDepositForm(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  placeholder="10-digit account number"
                  maxLength={10}
                  data-testid="input-admin-account-number"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Account Name</label>
                <Input
                  value={depositForm.accountName}
                  onChange={e => setDepositForm(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="Account holder name"
                  data-testid="input-admin-account-name"
                />
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold"
                onClick={handleSaveDepositAccount}
                disabled={depositAccountMutation.isPending}
                data-testid="button-save-deposit-account"
              >
                {depositAccountMutation.isPending ? "Saving..." : "Save Deposit Account"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
