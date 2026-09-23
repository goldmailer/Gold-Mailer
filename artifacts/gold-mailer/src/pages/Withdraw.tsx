import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useSubmitWithdrawal, getGetTransactionsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getConfig, fmt as currencyFmt } from "@/lib/currency";
import { getLocalCurrency } from "@/lib/countries";
import { Check, ArrowUpRight, Banknote, WalletCards, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import type { Wallets } from "@/lib/marketplace";
import { AdUnit } from "@/components/AdUnit";

const BANKS_BY_COUNTRY: Record<string, string[]> = {
  NG: ["Access Bank", "First Bank of Nigeria", "Guaranty Trust Bank (GTBank)", "Zenith Bank", "United Bank for Africa (UBA)", "Fidelity Bank", "Union Bank", "Sterling Bank", "Ecobank Nigeria", "Polaris Bank", "Kuda Microfinance Bank", "Opay (OPay Digital Services)", "PalmPay", "Moniepoint Microfinance Bank", "VFD Microfinance Bank", "Providus Bank"],
  US: ["Chase Bank", "Bank of America", "Wells Fargo", "Citibank", "Capital One", "US Bancorp", "PNC Bank", "TD Bank", "Ally Bank"],
  GB: ["HSBC UK", "Barclays", "NatWest", "Lloyds Bank", "Santander UK", "Halifax", "Monzo", "Starling Bank", "Nationwide Building Society"],
  CA: ["Royal Bank of Canada (RBC)", "Toronto-Dominion Bank (TD)", "Scotiabank", "Bank of Montreal (BMO)", "CIBC", "National Bank of Canada", "Desjardins", "Tangerine"],
  AU: ["Commonwealth Bank", "Westpac", "ANZ Bank", "NAB", "Bendigo Bank", "ING Australia", "Macquarie Bank", "HSBC Australia"],
  GH: ["GCB Bank", "Ecobank Ghana", "Absa Bank Ghana", "Fidelity Bank Ghana", "Standard Chartered Ghana", "Stanbic Bank Ghana", "CalBank"],
  KE: ["KCB Bank", "Equity Bank", "Co-operative Bank of Kenya", "Absa Kenya", "Standard Chartered Kenya", "NCBA Bank", "I&M Bank"],
  ZA: ["Standard Bank", "FNB", "Absa Group", "Nedbank", "Capitec Bank", "Investec", "TymeBank"],
  IN: ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Punjab National Bank", "Bank of Baroda", "Kotak Mahindra Bank"],
};

export default function Withdraw() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [method, setMethod] = useState<"bank" | "paypal" | "crypto">("bank");
  const [amount, setAmount] = useState("");
  const [bankForm, setBankForm] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [customBank, setCustomBank] = useState("");
  const [paypalForm, setPaypalForm] = useState({ email: "", fullName: "" });
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("usdttrc20");
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const country = user?.country ?? "NG";
  const cfg = getConfig(country);
  const localCurrency = getLocalCurrency(country);
  const bankList = BANKS_BY_COUNTRY[country] ?? [];
  const fmt = (value: number) => currencyFmt(value, country);

  const { data: marketplaceWallets } = useQuery<Wallets>({
    queryKey: ["marketplace-wallets"],
    queryFn: async () => {
      const response = await fetch("/api/marketplace/wallets", { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load wallet");
      return response.json();
    },
  });

  const mutation = useSubmitWithdrawal({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      },
      onError: (err: any) => toast({ title: "Withdrawal failed", description: err?.data?.error || err?.message || "Please try again", variant: "destructive" }),
    },
  });

  const cryptoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/marketplace/payouts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(cryptoAmount), payoutAddress: cryptoAddress, payCurrency: cryptoCurrency }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not request payout");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Crypto payout requested", description: `$${Number(data.userGets).toFixed(2)} will be sent after approval.` });
      setCryptoAmount("");
      setCryptoAddress("");
      queryClient.invalidateQueries({ queryKey: ["marketplace-wallets"] });
    },
    onError: (error: Error) => toast({ title: "Payout failed", description: error.message, variant: "destructive" }),
  });

  const enteredAmount = Number(amount) || 0;
  const cryptoValue = Number(cryptoAmount) || 0;
  const cryptoBalance = marketplaceWallets?.earningWallet ?? 0;
  const submitManual = () => {
    if (enteredAmount <= 0 || enteredAmount > (user?.balance ?? 0)) {
      toast({ title: enteredAmount > (user?.balance ?? 0) ? "Insufficient balance" : "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (method === "bank") {
      const bankName = bankList.length ? bankForm.bankName : customBank;
      if (!bankName || !bankForm.accountNumber || !bankForm.accountName) {
        toast({ title: "All bank fields are required", variant: "destructive" });
        return;
      }
      mutation.mutate({ data: { amount: enteredAmount, bankName, accountNumber: bankForm.accountNumber, accountName: bankForm.accountName } });
    } else if (!paypalForm.email || !paypalForm.fullName) {
      toast({ title: "PayPal email and full name are required", variant: "destructive" });
    } else {
      mutation.mutate({ data: { amount: enteredAmount, bankName: "PayPal", accountNumber: paypalForm.email, accountName: paypalForm.fullName } });
    }
  };

  const reset = () => {
    setSuccess(false);
    setAmount("");
    setBankForm({ bankName: "", accountNumber: "", accountName: "" });
    setPaypalForm({ email: "", fullName: "" });
    setCustomBank("");
  };

  if (success) return <div className="min-h-screen bg-background"><Sidebar /><main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 pt-16"><div className="rounded-3xl border border-border bg-card p-10 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"><Check size={32} className="text-emerald-300" /></div><h2 className="mb-2 text-2xl font-black">Withdrawal submitted</h2><p className="mb-6 text-muted-foreground">Your request is pending admin approval. Approved funds are sent within 24–48 hours.</p><Button className="bg-primary text-primary-foreground" onClick={reset}>New withdrawal</Button></div></main></div>;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="mx-auto max-w-4xl px-4 py-8 pt-16 sm:px-6 lg:py-12 lg:pl-72">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Wallet transfers</p><h1 className="mt-2 text-3xl font-black">Withdraw funds</h1><p className="mt-2 text-sm text-muted-foreground">Choose where you want to receive your available balance.</p></div><div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300"><ShieldCheck size={14} /> Reviewed before payout</div></header>
        <div className="mb-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-primary/25 bg-primary/5 p-5"><p className="text-xs text-muted-foreground">Available account balance</p><p className="mt-2 text-2xl font-black text-primary">{fmt(user?.balance ?? 0)}</p></div><div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">Task earning wallet</p><p className="mt-2 text-2xl font-black">{cryptoBalance.toFixed(2)} USD</p></div></div>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><ArrowUpRight size={19} /></span><div><h2 className="font-bold">Select payout route</h2><p className="text-xs text-muted-foreground">Use accurate details to avoid delays.</p></div></div>
            <div className="mb-6 grid grid-cols-3 gap-2">
              {([["bank", "Bank transfer", Banknote], ["paypal", "PayPal", WalletCards], ["crypto", "Crypto", WalletCards]] as const).map(([value, label, Icon]) => <button key={value} onClick={() => setMethod(value)} className={`rounded-2xl border p-3 text-left transition-colors ${method === value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}><Icon size={17} className="mb-2 text-primary" /><p className="text-xs font-bold">{label}</p></button>)}
            </div>

            {method === "crypto" ? <div className="space-y-4"><div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="font-semibold">NowPayments crypto payout</p><p className="mt-1 text-xs text-muted-foreground">Minimum $5. A 20% platform commission is deducted; you receive 80% after approval.</p></div><div className="grid gap-3 sm:grid-cols-2"><Input type="number" min="5" step="0.01" value={cryptoAmount} onChange={(event) => setCryptoAmount(event.target.value)} placeholder="Total amount in USD" /><select value={cryptoCurrency} onChange={(event) => setCryptoCurrency(event.target.value)} className="rounded-lg border border-border bg-background px-3 text-sm outline-none"><option value="usdttrc20">USDT TRC20</option><option value="btc">Bitcoin</option><option value="eth">Ethereum</option><option value="ltc">Litecoin</option></select></div><Input value={cryptoAddress} onChange={(event) => setCryptoAddress(event.target.value)} placeholder="Destination wallet address" /><Button className="w-full bg-primary font-bold text-primary-foreground" disabled={cryptoLoading || cryptoValue < 5 || cryptoValue > cryptoBalance || !cryptoAddress.trim()} onClick={() => { setCryptoLoading(true); cryptoMutation.mutate(undefined, { onSettled: () => setCryptoLoading(false) }); }}>{cryptoLoading ? "Requesting payout..." : "Request crypto payout"}</Button>{cryptoValue > cryptoBalance && <p className="text-xs text-destructive">This is more than your task earning wallet.</p>}</div> : <div className="space-y-4"><div><label className="mb-2 block text-sm font-medium">Amount ({localCurrency?.symbol ?? cfg.symbol})</label><Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" /><p className="mt-2 text-xs text-muted-foreground">Requests are sent for admin review. Available balance: {fmt(user?.balance ?? 0)}</p></div>{method === "bank" ? <div className="space-y-4 rounded-2xl border border-border bg-background/40 p-4"><h3 className="text-sm font-bold">Bank details</h3>{bankList.length ? <Select value={bankForm.bankName} onValueChange={(value) => setBankForm({ ...bankForm, bankName: value })}><SelectTrigger><SelectValue placeholder="Select your bank" /></SelectTrigger><SelectContent className="max-h-64">{bankList.map((bank) => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}</SelectContent></Select> : <Input value={customBank} onChange={(event) => setCustomBank(event.target.value)} placeholder="Enter your bank name" />}<Input value={bankForm.accountNumber} onChange={(event) => setBankForm({ ...bankForm, accountNumber: event.target.value.slice(0, 30) })} placeholder="Account number" /><Input value={bankForm.accountName} onChange={(event) => setBankForm({ ...bankForm, accountName: event.target.value })} placeholder="Account name" /></div> : <div className="space-y-4 rounded-2xl border border-border bg-background/40 p-4"><h3 className="text-sm font-bold">PayPal details</h3><Input type="email" value={paypalForm.email} onChange={(event) => setPaypalForm({ ...paypalForm, email: event.target.value })} placeholder="PayPal email" /><Input value={paypalForm.fullName} onChange={(event) => setPaypalForm({ ...paypalForm, fullName: event.target.value })} placeholder="Full name on PayPal" /></div>}<Button className="w-full bg-primary font-bold text-primary-foreground" onClick={submitManual} disabled={mutation.isPending || !amount}>{mutation.isPending ? "Submitting..." : "Submit withdrawal request"}</Button></div>}
          </section>
           <aside className="space-y-4"><AdUnit placement="withdrawPage" zoneId={import.meta.env.VITE_MONETAG_ZONE_WITHDRAW || import.meta.env.VITE_MONETAG_ZONE_FEED || "284731"} label="Sponsored" /><div className="rounded-3xl border border-border bg-card p-6"><h2 className="font-bold">Withdrawal checklist</h2><ul className="mt-5 space-y-4 text-sm text-muted-foreground"><li>Make sure the recipient name matches your account.</li><li>Double-check bank and wallet details before submitting.</li><li>Never send your password or verification code to support.</li><li>Follow status updates in Transactions.</li></ul></div><div className="rounded-3xl border border-border/80 bg-background/40 p-6"><p className="text-sm font-bold">Need to add funds first?</p><p className="mt-2 text-xs text-muted-foreground">Use a verified deposit method before making a withdrawal request.</p><Link href="/deposit"><Button variant="outline" className="mt-4 w-full">Go to deposits</Button></Link></div></aside>
        </div>
      </main>
    </div>
  );
}