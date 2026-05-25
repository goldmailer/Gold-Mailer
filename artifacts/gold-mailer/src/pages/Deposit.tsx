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
  const isNGN = country === "NG";
  const isUS = country === "US";

  const { data: accountRaw, isLoading: accountLoading } = useGetDepositAccount({
    query: { queryKey: getGetDepositAccountQueryKey() },
  });
  const account = accountRaw as any;

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
        <main className="pl-16 pt-16 max-w-xl mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
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

  /* ── helpers ── */
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

  /* Determine what to render for this user */
  const renderDepositInfo = () => {
    if (accountLoading) {
      return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}</div>;
    }

    if (!account) return <p className="text-muted-foreground text-sm">Deposit details not configured yet. Please check back later.</p>;

    /* ── NIGERIAN users ── */
    if (isNGN) {
      if (!account.accountNumber) return <p className="text-muted-foreground text-sm">Deposit account not configured yet.</p>;
      return (
        <div className="space-y-3">
          {[{ label: "Bank Name", value: account.bankName }, { label: "Account Name", value: account.accountName }].map(item => (
            <div key={item.label} className="flex justify-between p-3 bg-background rounded-lg">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-sm">{item.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Account Number</p>
              <p className="font-black text-lg text-primary">{account.accountNumber}</p>
            </div>
            <CopyBtn val={account.accountNumber} k="ng-acc" />
          </div>
          <AmountField />
          <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold" onClick={() => setStep(2)} disabled={!amount || parseFloat(amount) <= 0}>
            I Have Made This Payment
          </Button>
        </div>
      );
    }

    /* ── US users ── */
    if (isUS) {
      const showBank = account.usShowBank && account.usBankName;
      const showPaypal = account.usShowPaypal && account.usPaypalEmail;

      if (!showBank && !showPaypal) {
        return <p className="text-muted-foreground text-sm">US deposit options are not configured yet. Please check back later.</p>;
      }

      return (
        <div className="space-y-4">
          {showBank && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bank Transfer</p>
              {[{ label: "Bank Name", value: account.usBankName }, { label: "Account Name", value: account.usAccountName }].map(item => (
                <div key={item.label} className="flex justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-sm">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-black text-lg text-primary">{account.usAccountNumber}</p>
                </div>
                <CopyBtn val={account.usAccountNumber} k="us-acc" />
              </div>
            </div>
          )}

          {showBank && showPaypal && <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground uppercase tracking-wider">or</span><div className="flex-1 h-px bg-border" /></div>}

          {showPaypal && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PayPal</p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex justify-between p-2 bg-background rounded-lg mb-2">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="font-semibold text-sm">{account.usPaypalName ?? "—"}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-primary/10 border border-primary/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">PayPal Email</p>
                    <p className="font-black text-primary">{account.usPaypalEmail}</p>
                  </div>
                  <CopyBtn val={account.usPaypalEmail} k="us-pp" />
                </div>
              </div>
            </div>
          )}

          <AmountField />
          <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold" onClick={() => setStep(2)} disabled={!amount || parseFloat(amount) <= 0}>
            I Have Sent This Payment
          </Button>
        </div>
      );
    }

    /* ── UK / CA users ── */
    if (!account.paypalEmail) return <p className="text-muted-foreground text-sm">PayPal deposit not configured yet. Please check back later.</p>;
    return (
      <div className="space-y-3">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-3">Send your payment to this PayPal account</p>
          <div className="flex justify-between p-3 bg-background rounded-lg mb-2">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="font-semibold text-sm">{account.paypalName ?? "—"}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">PayPal Email</p>
              <p className="font-black text-primary">{account.paypalEmail}</p>
            </div>
            <CopyBtn val={account.paypalEmail} k="intl-pp" />
          </div>
        </div>
        <AmountField />
        <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold" onClick={() => setStep(2)} disabled={!amount || parseFloat(amount) <= 0}>
          I Have Sent This Payment
        </Button>
      </div>
    );
  };

  const stepOneLabel = isNGN ? "Transfer to this account" : isUS ? "Send your deposit" : "Send payment via PayPal";
  const stepTwoLabel = isNGN ? "Paste your Transaction ID" : "Paste your Transaction / Reference ID";
  const stepTwoPlaceholder = isNGN ? "Paste your bank transaction reference" : "Paste your PayPal or bank transaction ID";
  const stepTwoHint = isNGN ? "Find this in your bank app under transaction history" : "Find this in your PayPal activity or bank app";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16 pt-16 max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-1">Deposit Funds</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {isNGN ? "Transfer to our account and confirm with your transaction ID"
            : isUS ? "Send via bank transfer or PayPal and confirm below"
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
              <h2 className="font-bold">{stepTwoLabel}</h2>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Transaction ID / Reference</label>
              <Input value={txId} onChange={e => setTxId(e.target.value)} placeholder={stepTwoPlaceholder} />
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
