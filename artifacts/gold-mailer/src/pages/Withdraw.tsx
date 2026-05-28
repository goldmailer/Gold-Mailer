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
import { getLocalCurrency } from "@/lib/countries";
import { Check, AlertTriangle, Info, ArrowRight } from "lucide-react";
import { Link } from "wouter";

// ── Bank lists by country ─────────────────────────────────────
const BANKS_BY_COUNTRY: Record<string, string[]> = {
  NG: [
    "Access Bank","First Bank of Nigeria","Guaranty Trust Bank (GTBank)","Zenith Bank",
    "United Bank for Africa (UBA)","Fidelity Bank","Union Bank","Sterling Bank",
    "Ecobank Nigeria","Polaris Bank","Keystone Bank","Wema Bank","FCMB",
    "Stanbic IBTC Bank","Heritage Bank","Jaiz Bank","Kuda Microfinance Bank",
    "Opay (OPay Digital Services)","PalmPay","Moniepoint Microfinance Bank",
    "VFD Microfinance Bank","Providus Bank","SunTrust Bank","Coronation Bank","Titan Trust Bank",
  ],
  US: [
    "Chase Bank","Bank of America","Wells Fargo","Citibank","Capital One",
    "US Bancorp","PNC Bank","Goldman Sachs (Marcus)","TD Bank","Navy Federal Credit Union",
    "Ally Bank","American Express National Bank","Discover Bank","Synchrony Bank","Regions Bank",
  ],
  GB: [
    "HSBC UK","Barclays","NatWest","Lloyds Bank","Santander UK",
    "Halifax","TSB Bank","Metro Bank","Monzo","Starling Bank",
    "First Direct","Virgin Money","Co-operative Bank","Nationwide Building Society","Royal Bank of Scotland",
  ],
  CA: [
    "Royal Bank of Canada (RBC)","Toronto-Dominion Bank (TD)","Bank of Nova Scotia (Scotiabank)",
    "Bank of Montreal (BMO)","Canadian Imperial Bank of Commerce (CIBC)","National Bank of Canada",
    "Desjardins","Tangerine","EQ Bank","HSBC Canada","Simplii Financial","Motusbank","Alterna Bank",
  ],
  AU: [
    "Commonwealth Bank","Westpac","ANZ Bank","NAB (National Australia Bank)",
    "Bendigo Bank","Bank of Queensland","ING Australia","Macquarie Bank","HSBC Australia","Up Bank",
  ],
  GH: [
    "GCB Bank","Ecobank Ghana","Absa Bank Ghana","Fidelity Bank Ghana","Standard Chartered Ghana",
    "Stanbic Bank Ghana","Zenith Bank Ghana","First Atlantic Bank","CalBank","GT Bank Ghana",
  ],
  KE: [
    "KCB Bank","Equity Bank","Co-operative Bank of Kenya","Absa Kenya","Standard Chartered Kenya",
    "NCBA Bank","I&M Bank","Diamond Trust Bank","Family Bank","M-Pesa (Safaricom)",
  ],
  ZA: [
    "Standard Bank","FNB (First National Bank)","Absa Group","Nedbank","Capitec Bank",
    "Investec","African Bank","TymeBank","Discovery Bank","Bidvest Bank",
  ],
  IN: [
    "State Bank of India","HDFC Bank","ICICI Bank","Axis Bank","Punjab National Bank",
    "Bank of Baroda","Kotak Mahindra Bank","IndusInd Bank","Yes Bank","Canara Bank",
  ],
};

function getBankList(country: string): string[] {
  return BANKS_BY_COUNTRY[country?.toUpperCase()] ?? [];
}

export default function Withdraw() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [withdrawType, setWithdrawType] = useState<"local" | "paypal">("local");

  const cfg = getConfig((user as any)?.country);
  const fmt = (n: number) => currencyFmt(n);
  const country = ((user as any)?.country ?? "NG") as string;
  const localCurrency = getLocalCurrency(country);
  const bankList = getBankList(country);
  const hasLocalBanks = bankList.length > 0;

  const [amount, setAmount] = useState("");
  const [bankForm, setBankForm] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [customBank, setCustomBank] = useState("");
  const [paypalForm, setPaypalForm] = useState({ paypalEmail: "", fullName: "" });

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
    (tx: any) => tx.type === "withdrawal" && tx.status === "approved"
  );
  const FIRST_MIN = cfg.firstWithdrawMin;
  const minWithdraw = hasApprovedWithdrawal ? 0.01 : FIRST_MIN;
  const enteredAmount = parseFloat(amount) || 0;

  const localEstimate = localCurrency && enteredAmount > 0
    ? enteredAmount * localCurrency.rate
    : null;

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

    if (withdrawType === "local") {
      const finalBankName = bankList.length > 0 ? bankForm.bankName : customBank;
      if (!finalBankName || !bankForm.accountNumber || !bankForm.accountName) {
        toast({ title: "All fields are required", variant: "destructive" });
        return;
      }
      mutation.mutate({ data: {
        amount: enteredAmount,
        bankName: finalBankName,
        accountNumber: bankForm.accountNumber,
        accountName: bankForm.accountName,
      }});
    } else {
      if (!paypalForm.paypalEmail || !paypalForm.fullName) {
        toast({ title: "PayPal email and full name are required", variant: "destructive" });
        return;
      }
      mutation.mutate({ data: {
        amount: enteredAmount,
        bankName: "PayPal",
        accountNumber: paypalForm.paypalEmail,
        accountName: paypalForm.fullName,
      }});
    }
  };

  const resetForms = () => {
    setSuccess(false);
    setAmount("");
    setBankForm({ bankName: "", accountNumber: "", accountName: "" });
    setPaypalForm({ paypalEmail: "", fullName: "" });
    setCustomBank("");
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
            <h2 className="text-2xl font-black mb-2">Withdrawal Submitted</h2>
            <p className="text-muted-foreground mb-6">
              {withdrawType === "local"
                ? "Your withdrawal request is pending admin approval. Funds will be sent to your bank within 24-48 hours."
                : "Your withdrawal request is pending admin approval. Funds will be sent via PayPal within 24-48 hours."}
            </p>
            <Button className="bg-primary text-primary-foreground hover:opacity-90" onClick={resetForms}>
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
      <main className="pt-16 max-w-xl mx-auto px-4 sm:pl-16 py-8">
        <h1 className="text-2xl font-black mb-1">Withdraw Funds</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Choose your withdrawal method and enter your details
        </p>

        {/* Deposit-first gate */}
        {!user?.hasDeposited && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-5 mb-6 flex gap-4 items-start">
            <AlertTriangle size={20} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">Deposit required before withdrawing</p>
              <p className="text-sm text-muted-foreground mb-3">
                You must make a real deposit and have it approved before you can withdraw funds.
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

        {/* Balance */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex justify-between">
          <span className="text-sm text-muted-foreground">Available Balance</span>
          <span className="font-black text-primary">{fmt(user?.balance ?? 0)}</span>
        </div>

        <div className={`space-y-5 ${!user?.hasDeposited ? "opacity-50 pointer-events-none" : ""}`}>

          {/* Withdrawal type selector */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <label className="text-sm font-medium mb-3 block">Withdrawal Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setWithdrawType("local")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${withdrawType === "local" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
              >
                <p className="font-bold text-sm">Local Bank Transfer</p>
                <p className="text-xs text-muted-foreground mt-0.5">Send to your local bank account</p>
              </button>
              <button
                onClick={() => setWithdrawType("paypal")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${withdrawType === "paypal" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
              >
                <p className="font-bold text-sm">International / PayPal</p>
                <p className="text-xs text-muted-foreground mt-0.5">Receive funds via PayPal</p>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <label className="text-sm font-medium mb-2 block">
              Amount (USD)
              {!hasApprovedWithdrawal && user?.hasDeposited && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">— min {fmt(FIRST_MIN)} for first withdrawal</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
              />
            </div>

            {localEstimate !== null && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <ArrowRight size={13} className="text-primary/60" />
                <span>
                  Estimated equivalent:{" "}
                  <span className="text-foreground font-semibold">
                    {localCurrency!.symbol}{localEstimate.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {localCurrency!.name}
                  </span>
                  <span className="text-xs ml-1">(approximate)</span>
                </span>
              </div>
            )}

            {enteredAmount > 0 && enteredAmount < minWithdraw && user?.hasDeposited && (
              <p className="text-destructive text-xs mt-1">Minimum for first withdrawal is {fmt(FIRST_MIN)}</p>
            )}
            {enteredAmount > (user?.balance ?? 0) && amount && (
              <p className="text-destructive text-xs mt-1">Exceeds available balance</p>
            )}
          </div>

          {/* Bank details — Local */}
          {withdrawType === "local" && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm">Local Bank Details</h3>
              <div>
                <label className="text-sm font-medium mb-2 block">Bank Name</label>
                {hasLocalBanks ? (
                  <Select value={bankForm.bankName} onValueChange={val => setBankForm({ ...bankForm, bankName: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {bankList.map(bank => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={customBank}
                    onChange={e => setCustomBank(e.target.value)}
                    placeholder="Enter your bank name"
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Account Number</label>
                <Input
                  value={bankForm.accountNumber}
                  onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value.slice(0, 30) })}
                  placeholder="Your bank account number"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Account Name</label>
                <Input
                  value={bankForm.accountName}
                  onChange={e => setBankForm({ ...bankForm, accountName: e.target.value })}
                  placeholder="As it appears on your bank account"
                />
              </div>
            </div>
          )}

          {/* PayPal details — International */}
          {withdrawType === "paypal" && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300">Funds will be sent to your PayPal account in USD within 24-48 hours after approval.</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Your PayPal Email</label>
                <Input
                  type="email"
                  value={paypalForm.paypalEmail}
                  onChange={e => setPaypalForm({ ...paypalForm, paypalEmail: e.target.value })}
                  placeholder="your@paypal.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name (as on PayPal)</label>
                <Input
                  value={paypalForm.fullName}
                  onChange={e => setPaypalForm({ ...paypalForm, fullName: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
            </div>
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
