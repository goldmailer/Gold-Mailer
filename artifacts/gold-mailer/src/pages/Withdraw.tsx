import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSubmitWithdrawal, getGetTransactionsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

const NIGERIAN_BANKS = [
  "Access Bank","First Bank of Nigeria","Guaranty Trust Bank (GTBank)","Zenith Bank",
  "United Bank for Africa (UBA)","Fidelity Bank","Union Bank","Sterling Bank",
  "Ecobank Nigeria","Polaris Bank","Keystone Bank","Wema Bank","FCMB",
  "Stanbic IBTC Bank","Heritage Bank","Jaiz Bank","Kuda Microfinance Bank",
  "Opay (OPay Digital Services)","PalmPay","Moniepoint Microfinance Bank",
  "VFD Microfinance Bank","Providus Bank","SunTrust Bank","Coronation Bank","Titan Trust Bank",
];

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Withdraw() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ amount: "", bankName: "", accountNumber: "", accountName: "" });

  const mutation = useSubmitWithdrawal({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Withdrawal failed", description: err?.response?.data?.error || "Please try again", variant: "destructive" });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.amount || !form.bankName || !form.accountNumber || !form.accountName) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (parseFloat(form.amount) > (user?.balance ?? 0)) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    mutation.mutate({ data: {
      amount: parseFloat(form.amount),
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
        <p className="text-muted-foreground text-sm mb-8">Send funds to your Nigerian bank account</p>

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

        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex justify-between">
          <span className="text-sm text-muted-foreground">Available Balance</span>
          <span className="font-black text-primary" data-testid="text-balance">{fmt(user?.balance ?? 0)}</span>
        </div>

        <div className={`bg-card border border-border rounded-2xl p-6 space-y-5 ${!user?.hasDeposited ? "opacity-50 pointer-events-none" : ""}`}>
          <div>
            <label className="text-sm font-medium mb-2 block">Amount (₦)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₦</span>
              <Input type="number" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00" className="pl-7" data-testid="input-withdraw-amount" />
            </div>
            {parseFloat(form.amount) > (user?.balance ?? 0) && form.amount && (
              <p className="text-destructive text-xs mt-1">Exceeds available balance</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Bank</label>
            <Select value={form.bankName} onValueChange={val => setForm({ ...form, bankName: val })}>
              <SelectTrigger data-testid="select-bank">
                <SelectValue placeholder="Select Nigerian bank" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_BANKS.map(bank => (
                  <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Account Number</label>
            <Input value={form.accountNumber}
              onChange={e => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="10-digit account number" maxLength={10} data-testid="input-account-number" />
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
            disabled={mutation.isPending || !user?.hasDeposited}
            data-testid="button-withdraw-submit"
          >
            {mutation.isPending ? "Submitting..." : "Submit Withdrawal Request"}
          </Button>
        </div>
      </main>
    </div>
  );
}
