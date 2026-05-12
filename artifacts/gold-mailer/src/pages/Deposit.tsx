import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetDepositAccount, useSubmitDeposit, getGetTransactionsQueryKey, getGetDepositAccountQueryKey } from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, ArrowDownCircle } from "lucide-react";

export default function Deposit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [success, setSuccess] = useState(false);

  const { data: account, isLoading: accountLoading } = useGetDepositAccount({
    query: { queryKey: getGetDepositAccountQueryKey() },
  });

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

  const copyAccount = () => {
    if (account?.accountNumber) {
      navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      toast({ title: "Account number copied" });
      setTimeout(() => setCopied(false), 2000);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16 pt-16 max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-1">Deposit Funds</h1>
        <p className="text-muted-foreground text-sm mb-8">Transfer to our account and confirm with your transaction ID</p>

        {/* Step 1 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
            <h2 className="font-bold">Transfer to this account</h2>
          </div>

          {accountLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}
            </div>
          ) : !account?.accountNumber ? (
            <p className="text-muted-foreground text-sm">Deposit account not configured yet. Please check back later.</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Bank Name", value: account.bankName },
                { label: "Account Name", value: account.accountName },
              ].map(item => (
                <div key={item.label} className="flex justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-sm" data-testid={`text-deposit-${item.label.toLowerCase().replace(/\s/g, "-")}`}>{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-black text-lg text-primary" data-testid="text-deposit-account-number">{account.accountNumber}</p>
                </div>
                <button onClick={copyAccount} className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors" data-testid="button-copy-account">
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-primary" />}
                </button>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium mb-2 block">Amount to Deposit (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₦</span>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="Enter amount" className="pl-7" data-testid="input-deposit-amount" />
                </div>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold"
                onClick={() => setStep(2)}
                disabled={!amount || parseFloat(amount) <= 0}
                data-testid="button-deposit-made-payment"
              >
                I Have Made This Payment
              </Button>
            </div>
          )}
        </div>

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
              <h2 className="font-bold">Paste your Transaction ID</h2>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Transaction ID / Reference</label>
              <Input value={txId} onChange={e => setTxId(e.target.value)} placeholder="Paste your bank transaction reference here"
                data-testid="input-transaction-id" />
              <p className="text-xs text-muted-foreground mt-2">Find this in your bank app under transaction history</p>
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold"
              disabled={!txId || mutation.isPending}
              onClick={() => mutation.mutate({ data: { amount: parseFloat(amount), transactionId: txId } })}
              data-testid="button-submit-deposit"
            >
              {mutation.isPending ? "Submitting..." : "Submit Deposit"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
