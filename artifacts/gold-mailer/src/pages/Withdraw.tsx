import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSubmitWithdrawal, getGetTransactionsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getConfig, fmt as currencyFmt } from "@/lib/currency";
import { Check, AlertTriangle, Info } from "lucide-react";
import { Link } from "wouter";

const NIGERIAN_BANKS = [
  "Access Bank","First Bank of Nigeria","Guaranty Trust Bank (GTBank)","Zenith Bank",
  "United Bank for Africa (UBA)","Fidelity Bank","Union Bank","Sterling Bank",
  "Ecobank Nigeria","Polaris Bank","Keystone Bank","Wema Bank","FCMB",
  "Stanbic IBTC Bank","Heritage Bank","Jaiz Bank","Kuda Microfinance Bank",
  "Opay (OPay Digital Services)","PalmPay","Moniepoint Microfinance Bank",
  "VFD Microfinance Bank","Providus Bank","SunTrust Bank","Coronation Bank","Titan Trust Bank",
];

const INTERNATIONAL_BANKS = [
  "Chase Bank","Bank of America","Wells Fargo","Citibank","US Bank",
  "Barclays","HSBC","Lloyds Bank","NatWest","Santander UK",
  "TD Bank","RBC Royal Bank","Scotiabank","BMO Bank","CIBC",
  "Other",
];

export default function Withdraw() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ amount: "", bankName: "", accountNumber: "", accountName: "" });

  const cfg = getConfig(user?.country);
  const fmt = (n: number) => currencyFmt(n, user?.country);
  const isNGN = !user?.country || user.country === "NG";
  const bankList = isNGN ? NIGERIAN_BANKS : INTERNATIONAL_BANKS;

  // Determine if this is the user's first withdrawal
  const { data: txData } = useQuery<any[]>({
    queryKey: ["transactions-for-withdraw-check"],
    queryFn: async () => {
      const res = await fetch("/api/transactions", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.hasDeposited,
  });
  const hasApprovedWithdrawal = (txData ?? []).some(
    (t: any) => t.type === "withdrawal" && t.status === "approved"
  );
  const FIRST_MIN = cfg.firstWithdrawMin;
  const minWithdraw = hasApprovedWithdrawal ? 0.01 : FIRST_MIN;
  const enteredAmount = parseFloat(form.amount) || 0;

  const mutation = useSubmitWithdrawal({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["transactions-for-withdraw-check"] });
      },
      onError: (err: any) => {
        toast({ title: "Withdrawal failed", description: err?.data?.error || err?.message || "Please try again", variant: "destructive" });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.amount || !form.bankName || !form.accountNumber || !form.accountName) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (enteredAmount < minWithdraw) {
      toast({
        title: "Amount too low",
        description: hasApprovedWithdrawal
          ? `Minimum withdrawal is ${fmt(0.01)}`
          : `Your first withdrawal must be at least ${fmt(FIRST_MIN)}`,
        variant: "destructive",
      });
      return;
    }
    if (enteredAmount > (user?.balance ?? 0)) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    mutation.mutate({ data: {
      amount: enteredAmount,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      accountName: form.accountName,
    }});
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-16 pt-16 max-w-xl mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
          <div className="text-center bg-card border border-border rounded-2xl p-10">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
              <Check size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-black mb-2">Withdrawal Submitted</h2>
            <p className="text-muted-foreground mb-6">Your withdrawal request is pending admin approval. Funds will be sent to your bank within 24-48 hours.</p>
            <Button className="bg-primary text-primary-foreground hover:opacity-90" onClick={() => { setSuccess(false); setForm({ amount: "", bankName: "", accountNumber: "", accountName: "" }); }}>
              New Withdrawal
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16 pt-16 max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-1">Withdraw Funds</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Send funds to your {isNGN ? "Nigerian" : "local"} bank account
        </p>

        {/* Deposit-first gate */}
        {!user?.hasDeposited && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-5 mb-6 flex gap-4 items-start">
            <AlertTriangle size={20} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">Deposit required before withdrawing</p>
              <p className="text-sm text-muted-foreground mb-3">
                You must make a real deposit and have it approved before you can withdraw funds. Your signup bonus alone does not qualify.
              </p>
              <Link href="/deposit">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                  Make a Deposit
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* First-withdrawal minimum notice */}
        {user?.hasDeposited && !hasApprovedWithdrawal && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex gap-3 items-start">
            <Info size={18} className="text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-blue-300 text-sm mb-0.5">First withdrawal minimum</p>
              <p className="text-sm text-muted-foreground">
                Your first withdrawal must be at least <span className="text-foreground font-bold">{fmt(FIRST_MIN)}</span>.
                After it is approved you can withdraw any amount.
              </p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex justify-between">
          <span className="text-sm text-muted-foreground">Available Balance</span>
          <span className="font-black text-primary" data-testid="text-balance">{fmt(user?.balance ?? 0)}</span>
        </div>

        <div className={`bg-card border border-border rounded-2xl p-6 space-y-5 ${!user?.hasDeposited ? "opacity-50 pointer-events-none" : ""}`}>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Amount ({cfg.symbol})
              {!hasApprovedWithdrawal && user?.hasDeposited && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  — min {fmt(FIRST_MIN)} for first withdrawal
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{cfg.symbol}</span>
              <Input type="number" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00" className="pl-8" data-testid="input-withdraw-amount" />
            </div>
            {enteredAmount > 0 && enteredAmount < minWithdraw && user?.hasDeposited && (
              <p className="text-destructive text-xs mt-1">
                Minimum for first withdrawal is {fmt(FIRST_MIN)}
              </p>
            )}
            {enteredAmount > (user?.balance ?? 0) && form.amount && (
              <p className="text-destructive text-xs mt-1">Exceeds available balance</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Bank</label>
            <Select value={form.bankName} onValueChange={val => setForm({ ...form, bankName: val })}>
              <SelectTrigger data-testid="select-bank">
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {bankList.map(bank => (
                  <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Account Number</label>
            <Input value={form.accountNumber}
              onChange={e => setForm({ ...form, accountNumber: e.target.value.slice(0, 20) })}
              placeholder={isNGN ? "10-digit account number" : "Account number"} data-testid="input-account-number" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Account Name</label>
            <Input value={form.accountName}
              onChange={e => setForm({ ...form, accountName: e.target.value })}
              placeholder="As it appears on your bank account" data-testid="input-account-name" />
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
            onClick={handleSubmit}
            disabled={
              mutation.isPending ||
              !user?.hasDeposited ||
              (enteredAmount > 0 && enteredAmount < minWithdraw)
            }
            data-testid="button-withdraw-submit"
          >
            {mutation.isPending ? "Submitting..." : "Submit Withdrawal Request"}
          </Button>
        </div>
      </main>
    </div>
  );
}
