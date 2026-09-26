import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useGetDepositAccount, useSubmitDeposit, getGetTransactionsQueryKey, getGetDepositAccountQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, ArrowDownLeft, ShieldCheck, Wallet } from "lucide-react";
import { getConfig, getLocalCurrency } from "@/lib/currency";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Deposit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [success, setSuccess] = useState(false);
  const [depositMethod, setDepositMethod] = useState<"bank" | "crypto">("bank");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("usd");
  const [cryptoLoading, setCryptoLoading] = useState(false);

  const { data: cryptoWalletsData } = useQuery({
    queryKey: ["crypto-wallets-public"],
    queryFn: async () => {
      const res = await fetch("/api/settings/crypto-wallets", { credentials: "include" });
      return res.ok ? res.json() : { wallets: [] };
    },
  });
  const cryptoWallets: { coin: string; symbol: string; address: string; network: string }[] = (cryptoWalletsData as any)?.wallets ?? [];
  const cfg = getConfig(user?.country);
  const country = user?.country ?? "NG";
  const localCurrency = getLocalCurrency(country);
  const localSymbol = localCurrency?.symbol ?? cfg.symbol;
  const isNGN = country === "NG";

  const { data: accountRaw, isLoading: accountLoading } = useGetDepositAccount({
    query: { queryKey: getGetDepositAccountQueryKey() },
  });
  const allAccounts = (accountRaw as any)?.accounts ?? {};
  const myAccount = allAccounts[country] ?? allAccounts.DEFAULT ?? null;

  const mutation = useSubmitDeposit({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      },
      onError: (err: any) => toast({ title: "Submission failed", description: err?.data?.error || err?.message || "Please try again", variant: "destructive" }),
    },
  });

  const copyValue = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    toast({ title: "Copied to clipboard" });
    window.setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ value, id }: { value: string; id: string }) => (
    <button data-no-loader onClick={() => copyValue(value, id)} className="rounded-lg bg-primary/15 p-2 hover:bg-primary/25" aria-label="Copy">
      {copied === id ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} className="text-primary" />}
    </button>
  );

  const numericAmount = Number(amount) || 0;
  const minimumLocal = isNGN ? 1000 : 0;
  const belowLocalMinimum = minimumLocal > 0 && numericAmount > 0 && numericAmount < minimumLocal;

  const createCryptoInvoice = async () => {
    const value = Number(cryptoAmount);
    if (!Number.isFinite(value) || value < 5) {
      toast({ title: "Minimum crypto deposit is $5", description: "NowPayments deposits must be at least five US dollars.", variant: "destructive" });
      return;
    }
    setCryptoLoading(true);
    try {
      const response = await fetch("/api/payments/nowpayments/deposit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, currency: cryptoCurrency }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create invoice");
      window.open(data.invoiceUrl, "_blank", "noopener,noreferrer");
      toast({ title: "Crypto checkout ready", description: "Complete payment in the new tab. Your advertising wallet updates after confirmation." });
    } catch (error: any) {
      toast({ title: "Payment unavailable", description: error.message, variant: "destructive" });
    } finally {
      setCryptoLoading(false);
    }
  };

  const submitManualDeposit = () => {
    if (!txId.trim() || mutation.isPending) return;
    const usdAmount = localCurrency ? numericAmount / localCurrency.rate : numericAmount;
    mutation.mutate({ data: { amount: usdAmount, transactionId: txId.trim() } });
  };

  if (success) {
    return <div className="min-h-screen bg-background"><Sidebar /><main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-8 pt-16"><div className="rounded-3xl border border-border bg-card p-10 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"><Check size={32} className="text-emerald-300" /></div><h2 className="mb-2 text-2xl font-black">{t("deposit.submittedTitle")}</h2><p className="mb-6 text-muted-foreground">{t("deposit.submittedDesc")}</p><Button className="bg-primary text-primary-foreground" onClick={() => { setSuccess(false); setAmount(""); setTxId(""); setStep(1); }}>{t("deposit.another")}</Button></div></main></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="mx-auto max-w-4xl px-4 py-8 pt-16 sm:px-6 lg:py-12 lg:pl-72">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Wallet funding</p><h1 className="mt-2 text-3xl font-black">Deposit funds</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Choose a verified funding route. Bank deposits are reviewed manually; crypto checkout is handled by NowPayments.</p></div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300"><ShieldCheck size={14} /> Secure processing</div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-3xl border border-primary/25 bg-card p-6 shadow-lg shadow-primary/5">
            <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><ArrowDownLeft size={19} /></span><div><h2 className="font-bold">Choose a deposit method</h2><p className="text-xs text-muted-foreground">Funds are added after confirmation.</p></div></div>
            <div className="mb-6 grid grid-cols-2 gap-3">
              <button onClick={() => setDepositMethod("bank")} className={`rounded-2xl border p-4 text-left transition-colors ${depositMethod === "bank" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}><p className="text-sm font-bold">Bank / PayPal</p><p className="mt-1 text-xs text-muted-foreground">Send and submit a reference</p></button>
              <button onClick={() => setDepositMethod("crypto")} className={`rounded-2xl border p-4 text-left transition-colors ${depositMethod === "crypto" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}><p className="text-sm font-bold">Crypto checkout</p><p className="mt-1 text-xs text-muted-foreground">NowPayments · minimum $5</p></button>
            </div>

            {depositMethod === "crypto" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4"><p className="font-semibold">Fund your Advertising Wallet</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">NowPayments deposits are credited at 80% after the payment webhook confirms them; 20% is the platform commission.</p></div>
                <div className="grid gap-3 sm:grid-cols-[1fr_170px]"><Input type="number" min="5" step="0.01" value={cryptoAmount} onChange={(event) => setCryptoAmount(event.target.value)} placeholder="Amount in USD" /><select value={cryptoCurrency} onChange={(event) => setCryptoCurrency(event.target.value)} className="rounded-lg border border-border bg-background px-3 text-sm outline-none"><option value="usd">Choose crypto at checkout</option><option value="btc">Bitcoin</option><option value="eth">Ethereum</option><option value="usdttrc20">USDT TRC20</option><option value="ltc">Litecoin</option></select></div>
                <Button onClick={createCryptoInvoice} disabled={cryptoLoading} className="w-full bg-primary font-bold text-primary-foreground">{cryptoLoading ? "Creating checkout..." : "Continue to NowPayments"}</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-background/50 p-4">
                  {accountLoading ? <div className="h-20 animate-pulse rounded-lg bg-muted" /> : !myAccount ? <p className="text-sm text-muted-foreground">{t("deposit.notConfigured")}</p> : myAccount.type === "bank" && myAccount.accountNumber ? <div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Bank</span><b>{myAccount.bankName}</b></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Account name</span><b>{myAccount.accountName}</b></div>{myAccount.routingNumber && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Routing / support number</span><b className="font-mono">{myAccount.routingNumber}</b></div>}<div className="mt-3 flex items-center justify-between rounded-xl border border-primary/25 bg-primary/10 p-3"><div><p className="text-xs text-muted-foreground">Account number</p><p className="font-mono font-bold text-primary">{myAccount.accountNumber}</p></div><CopyButton value={myAccount.accountNumber} id="bank-account" /></div></div> : myAccount.type === "paypal" && myAccount.paypalEmail ? <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">PayPal email</span><span className="flex items-center gap-2 font-semibold">{myAccount.paypalEmail}<CopyButton value={myAccount.paypalEmail} id="paypal-email" /></span></div> : <p className="text-sm text-muted-foreground">Deposit details are not configured yet.</p>}
                </div>
                <div><label className="mb-2 block text-sm font-medium">Amount ({localSymbol})</label><Input type="number" min={minimumLocal || 1} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" />{belowLocalMinimum && <p className="mt-1 text-xs font-medium text-destructive">Minimum deposit is {localSymbol}{minimumLocal.toLocaleString()}</p>}{isNGN && !belowLocalMinimum && <p className="mt-1 text-xs text-muted-foreground">Minimum deposit: {localSymbol}{minimumLocal.toLocaleString()}</p>}</div>
                {step === 1 ? <Button className="w-full bg-primary font-bold text-primary-foreground" onClick={() => setStep(2)} disabled={!amount || numericAmount <= 0 || belowLocalMinimum}>I’ve sent the payment</Button> : <div className="space-y-3 border-t border-border pt-4"><label className="block text-sm font-medium">{t("deposit.txId")}</label><Input value={txId} onChange={(event) => setTxId(event.target.value)} placeholder="Paste your transaction reference" /><p className="text-xs text-muted-foreground">Use the exact reference from your bank or PayPal receipt.</p><Button className="w-full bg-primary font-bold text-primary-foreground" disabled={!txId.trim() || mutation.isPending} onClick={submitManualDeposit}>{mutation.isPending ? t("deposit.submitting") : t("deposit.submit")}</Button></div>}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center gap-3"><Wallet className="text-primary" size={20} /><h2 className="font-bold">Before you deposit</h2></div><ul className="mt-5 space-y-4 text-sm text-muted-foreground"><li>Use an account or wallet you control.</li><li>Check the destination details before sending.</li><li>Keep your payment reference until approval.</li><li>Never share your password or verification code.</li></ul></div>
            <div className="rounded-3xl border border-border/80 bg-background/40 p-6"><p className="text-sm font-bold">Need help?</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Pending manual deposits are reviewed by the Task Nest team. Check Transactions for the latest status.</p></div>
          </aside>
        </div>
      </main>
    </div>
  );
}