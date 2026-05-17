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

export default function Withdraw() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);

  const cfg = getConfig((user as any)?.country);
  const fmt = (n: number) => currencyFmt(n, (user as any)?.country);
  const isNGN = !(user as any)?.country || (user as any).country === "NG";

  const [ngForm, setNgForm] = useState({ amount: "", bankName: "", accountNumber: "", accountName: "" });
  const [intlForm, setIntlForm] = useState({ amount: "", paypalEmail: "", fullName: "" });

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
  const enteredAmount = parseFloat(isNGN ? ngForm.amount : intlForm.amount) || 0;

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

    if (isNGN) {
      if (!ngForm.bankName || !ngForm.accountNumber || !ngForm.accountName) {
        toast({ title: "All fields are required", variant: "destructive" });
        return;
      }
      mutation.mutate({ data: {
        amount: enteredAmount,
        bankName: ngForm.bankName,
        accountNumber: ngForm.accountNumber,
        accountName: ngForm.accountName,
      }});
    } else {
      if (!intlForm.paypalEmail || !intlForm.fullName) {
        toast({ title: "PayPal email and full name are required", variant: "destructive" });
        return;
      }
      mutation.mutate({ data: {
        amount: enteredAmount,
        bankName: "PayPal",
        accountNumber: intlForm.paypalEmail,
        accountName: intlForm.fullName,
      }});
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
            <h2 className="text-2xl font-black mb-2">Withdrawal Submitted</h2>
            <p className="text-muted-foreground mb-6">
              {isNGN
                ? "Your withdrawal request is pending admin approval. Funds will be sent to your bank within 24-48 hours."
                : "Your withdrawal request is pending admin approval. Funds will be sent via PayPal within 24-48 hours."}
            </p>
            <Button className="bg-primary text-primary-foreground hover:opacity-90" onClick={() => {
              setSuccess(false);
              setNgForm({ amount: "", bankName: "", accountNumber: "", accountName: "" });
              setIntlForm({ amount: "", paypalEmail: "", fullName: "" });
            }}>
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
          {isNGN ? "Send funds to your Nigerian bank account" : "Receive funds via PayPal"}
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
          <span className="font-black text-primary">{fmt(user?.balance ?? 0)}</span>
        </div>

        <div className={`bg-card border border-border rounded-2xl p-6 space-y-5 ${!user?.hasDeposited ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Amount field */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Amount ({cfg.symbol})
              {!hasApprovedWithdrawal && user?.hasDeposited && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">— min {fmt(FIRST_MIN)} for first withdrawal</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{cfg.symbol}</span>
              <Input
                type="number"
                value={isNGN ? ngForm.amount : intlForm.amount}
                onChange={e => isNGN
                  ? setNgForm({ ...ngForm, amount: e.target.value })
                  : setIntlForm({ ...intlForm, amount: e.target.value })}
                placeholder="0.00"
                className="pl-8"
              />
            </div>
            {enteredAmount > 0 && enteredAmount < minWithdraw && user?.hasDeposited && (
              <p className="text-destructive text-xs mt-1">Minimum for first withdrawal is {fmt(FIRST_MIN)}</p>
            )}
            {enteredAmount > (user?.balance ?? 0) && (isNGN ? ngForm.amount : intlForm.amount) && (
              <p className="text-destructive text-xs mt-1">Exceeds available balance</p>
            )}
          </div>

          {isNGN ? (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Bank</label>
                <Select value={ngForm.bankName} onValueChange={val => setNgForm({ ...ngForm, bankName: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
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
                <Input
                  value={ngForm.accountNumber}
                  onChange={e => setNgForm({ ...ngForm, accountNumber: e.target.value.slice(0, 20) })}
                  placeholder="10-digit account number"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Account Name</label>
                <Input
                  value={ngForm.accountName}
                  onChange={e => setNgForm({ ...ngForm, accountName: e.target.value })}
                  placeholder="As it appears on your bank account"
                />
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300">Funds will be sent to your PayPal account within 24-48 hours after approval.</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Your PayPal Email</label>
                <Input
                  type="email"
                  value={intlForm.paypalEmail}
                  onChange={e => setIntlForm({ ...intlForm, paypalEmail: e.target.value })}
                  placeholder="your@paypal.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name (as on PayPal)</label>
                <Input
                  value={intlForm.fullName}
                  onChange={e => setIntlForm({ ...intlForm, fullName: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
            </>
          )}

          <Button
            className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
            onClick={handleSubmit}
            disabled={
              mutation.isPending ||
              !user?.hasDeposited ||
              (enteredAmount > 0 && enteredAmount < minWithdraw)
            }
          >
            {mutation.isPending ? "Submitting..." : "Submit Withdrawal Request"}
          </Button>
        </div>
      </main>
    </div>
  );
}
