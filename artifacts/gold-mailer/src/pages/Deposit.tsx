import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetDepositAccount, useSubmitDeposit, getGetTransactionsQueryKey, getGetDepositAccountQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";
import { getConfig } from "@/lib/currency";

export default function Deposit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [success, setSuccess] = useState(false);

  const cfg = getConfig((user as any)?.country);
  const country = (user as any)?.country ?? "NG";

  const { data: accountRaw, isLoading: accountLoading } = useGetDepositAccount({
    query: { queryKey: getGetDepositAccountQueryKey() },
  });

  // New format: { accounts: { NG: { type, ... }, DEFAULT: { type, ... }, ... } }
  const allAccounts = (accountRaw as any)?.accounts ?? {};
  const myAccount = allAccounts[country] ?? allAccounts["DEFAULT"] ?? null;

  const mutation = useSubmitDeposit({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Submission failed", description: err?.data?.error || err?.message || "Please try again", variant: "destructive" });
      },
    },
  });

  const copyValue = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pt-16 max-w-xl mx-auto px-4 sm:pl-16 py-8 flex items-center justify-center min-h-[70vh]">
          <div className="text-center bg-card border border-border rounded-2xl p-10">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
              <Check size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-black mb-2">Deposit Submitted</h2>
            <p className="text-muted-foreground mb-6">Your deposit is pending admin approval. It will reflect in your balance within 24 hours.</p>
            <Button className="bg-primary text-primary-foreground hover:opacity-90" onClick={() => { setSuccess(false); setAmount(""); setTxId(""); setStep(1); }}>
              Make Another Deposit
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const CopyBtn = ({ val, k }: { val: string; k: string }) => (
    <button onClick={() => copyValue(val, k)} className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors ml-3 shrink-0">
      {copied === k ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-primary" />}
    </button>
  );

  const AmountField = () => (
    <div className="mt-3">
      <label className="text-sm font-medium mb-2 block">Amount to Deposit ({cfg.symbol})</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{cfg.symbol}</span>
        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" className="pl-7" />
      </div>
    </div>
  );

  const renderDepositInfo = () => {
    if (accountLoading) {
      return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}</div>;
    }
    if (!myAccount) {
      return <p className="text-muted-foreground text-sm">Deposit details are not configured yet. Please check back later.</p>;
    }

    /* ── Bank Transfer ── */
    if (myAccount.type === "bank") {
      if (!myAccount.accountNumber) {
        return <p className="text-muted-foreground text-sm">Bank account not fully configured yet.</p>;
      }
      return (
        <div className="space-y-3">
          {[{ label: "Bank Name", value: myAccount.bankName }, { label: "Account Name", value: myAccount.accountName }].map(item => (
            <div key={item.label} className="flex justify-between p-3 bg-background rounded-lg">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-sm">{item.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Account Number</p>
              <p className="font-black text-lg text-primary">{myAccount.accountNumber}</p>
            </div>
            <CopyBtn val={myAccount.accountNumber} k="bank-acc" />
          </div>
          <AmountField />
          <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold" onClick={() => setStep(2)} disabled={!amount || parseFloat(amount) <= 0}>
            I Have Made This Payment
          </Button>
        </div>
      );
    }

    /* ── PayPal ── */
    if (myAccount.type === "paypal") {
      if (!myAccount.paypalEmail) {
        return <p className="text-muted-foreground text-sm">PayPal account not configured yet.</p>;
      }
      return (
        <div className="space-y-3">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-3">Send your payment to this PayPal account</p>
            {myAccount.paypalName && (
              <div className="flex justify-between p-3 bg-background rounded-lg mb-2">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="font-semibold text-sm">{myAccount.paypalName}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">PayPal Email</p>
                <p className="font-black text-primary">{myAccount.paypalEmail}</p>
              </div>
              <CopyBtn val={myAccount.paypalEmail} k="paypal-email" />
            </div>
          </div>
          <AmountField />
          <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold" onClick={() => setStep(2)} disabled={!amount || parseFloat(amount) <= 0}>
            I Have Sent This Payment
          </Button>
        </div>
      );
    }

    return <p className="text-muted-foreground text-sm">Deposit details not available. Please check back later.</p>;
  };

  const stepOneLabel = myAccount?.type === "bank" ? "Transfer to this bank account" : "Send payment via PayPal";
  const stepTwoHint = myAccount?.type === "bank"
    ? "Find this in your bank app under transaction history"
    : "Find this in your PayPal activity or bank app";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 max-w-xl mx-auto px-4 sm:pl-16 py-8">
        <h1 className="text-2xl font-black mb-1">Deposit Funds</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {myAccount?.type === "bank"
            ? "Transfer to our account and confirm with your transaction ID"
            : "Send via PayPal and confirm with your transaction reference"}
        </p>

        {/* Step 1 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
            <h2 className="font-bold">{stepOneLabel}</h2>
          </div>
          {renderDepositInfo()}
        </div>

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
              <h2 className="font-bold">Paste your Transaction / Reference ID</h2>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Transaction ID / Reference</label>
              <Input value={txId} onChange={e => setTxId(e.target.value)} placeholder="Paste your transaction reference here" />
              <p className="text-xs text-muted-foreground mt-2">{stepTwoHint}</p>
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold"
              disabled={!txId || mutation.isPending}
              onClick={() => mutation.mutate({ data: { amount: parseFloat(amount), transactionId: txId } })}
            >
              {mutation.isPending ? "Submitting..." : "Submit Deposit"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
