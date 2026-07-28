import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetDepositAccount, useSubmitDeposit, getGetTransactionsQueryKey, getGetDepositAccountQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, ExternalLink, Bitcoin } from "lucide-react";
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

  const cfg = getConfig((user as any)?.country);
  const country = (user as any)?.country ?? "NG";
  const localCurrency = getLocalCurrency(country);
  const isNGN = country === "NG";

  const { data: accountRaw, isLoading: accountLoading } = useGetDepositAccount({
    query: { queryKey: getGetDepositAccountQueryKey() },
  });

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
          <div className="text-center glass-card rounded-2xl p-10">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
              <Check size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-black mb-2">{t("deposit.submittedTitle")}</h2>
            <p className="text-muted-foreground mb-6">{t("deposit.submittedDesc")}</p>
            <Button className="bg-primary text-primary-foreground hover:opacity-90" onClick={() => { setSuccess(false); setAmount(""); setTxId(""); setStep(1); }}>
              {t("deposit.another")}
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

  const localSymbol = localCurrency ? localCurrency.symbol : cfg.symbol;
  const usdEquivalent = localCurrency && amount && parseFloat(amount) > 0
    ? parseFloat(amount) / localCurrency.rate
    : null;

  const numericAmount = parseFloat(amount) || 0;
  const NGN_MIN_DEPOSIT = 1000;
  const minLocalDeposit = isNGN ? NGN_MIN_DEPOSIT : 0;
  const belowMinDeposit = minLocalDeposit > 0 && numericAmount > 0 && numericAmount < minLocalDeposit;

  const AmountField = () => (
    <div className="mt-3">
      <label className="text-sm font-medium mb-2 block">
        {t("deposit.amount")} ({localSymbol})
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{localSymbol}</span>
        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" className="pl-7" />
      </div>
      {belowMinDeposit && (
        <p className="text-xs text-destructive mt-1 font-medium">
          Minimum deposit is {localSymbol}{minLocalDeposit.toLocaleString()}
        </p>
      )}
      {!belowMinDeposit && isNGN && (
        <p className="text-xs text-muted-foreground mt-1">
          Minimum deposit: {localSymbol}{minLocalDeposit.toLocaleString()}
        </p>
      )}
      {localCurrency && usdEquivalent !== null && !belowMinDeposit && (
        <div className="mt-2 px-3 py-2 bg-primary/8 border border-primary/20 rounded-lg flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Equivalent in USD</span>
          <span className="text-sm font-black text-primary">≈ ${usdEquivalent.toFixed(2)} USD</span>
        </div>
      )}
    </div>
  );

  const renderDepositInfo = () => {
    if (accountLoading) {
      return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}</div>;
    }
    if (!myAccount) {
      return <p className="text-muted-foreground text-sm">{t("deposit.notConfigured")}</p>;
    }

    if (myAccount.type === "bank") {
      if (!myAccount.accountNumber) {
        return <p className="text-muted-foreground text-sm">Bank account not fully configured yet.</p>;
      }
      return (
        <div className="space-y-3">
          {[{ label: t("withdraw.bankName"), value: myAccount.bankName }, { label: t("withdraw.accountName"), value: myAccount.accountName }].map(item => (
            <div key={item.label} className="flex justify-between p-3 bg-background rounded-lg">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-sm">{item.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">{t("withdraw.accountNumber")}</p>
              <p className="font-black text-lg text-primary">{myAccount.accountNumber}</p>
            </div>
            <CopyBtn val={myAccount.accountNumber} k="bank-acc" />
          </div>
          <AmountField />
          <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold" onClick={() => setStep(2)} disabled={!amount || parseFloat(amount) <= 0 || belowMinDeposit}>
            {t("deposit.madePmt")}
          </Button>
        </div>
      );
    }

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
          <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold" onClick={() => setStep(2)} disabled={!amount || parseFloat(amount) <= 0 || belowMinDeposit}>
            {t("deposit.sentPmt")}
          </Button>
        </div>
      );
    }

    return <p className="text-muted-foreground text-sm">{t("deposit.notConfigured")}</p>;
  };

  const isBank = myAccount?.type === "bank";
  const stepOneLabel = isBank ? t("deposit.step1Bank") : t("deposit.step1Paypal");
  const stepTwoHint = isBank ? t("deposit.txHintBank") : t("deposit.txHintPaypal");
  const subtitle = isBank ? t("deposit.subtitleBank") : t("deposit.subtitlePaypal");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 max-w-xl mx-auto px-4 sm:pl-16 py-8">
        <h1 className="text-2xl font-black mb-1">{t("deposit.title")}</h1>
        <p className="text-muted-foreground text-sm mb-6">{subtitle}</p>

        {/* ── Paybis: Buy Bitcoin section ─────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 mb-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 via-amber-500/5 to-yellow-500/5 rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                <Bitcoin size={20} className="text-orange-400" />
              </div>
              <div>
                <p className="font-bold text-sm">Buy Bitcoin &amp; Crypto</p>
                <p className="text-xs text-muted-foreground">Instant purchase via Paybis — card, bank, or Apple Pay</p>
              </div>
            </div>
            <a
              href="https://paybis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <Bitcoin size={15} />
              Top Up with Paybis
              <ExternalLink size={13} />
            </a>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Secure payments via paybis.com · 250+ coins supported
            </p>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or deposit via bank / PayPal</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Manual deposit flow ─────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
            <h2 className="font-bold">{stepOneLabel}</h2>
          </div>
          {renderDepositInfo()}
        </div>

        {step === 2 && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
              <h2 className="font-bold">{t("deposit.step2")}</h2>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">{t("deposit.txId")}</label>
              <Input value={txId} onChange={e => setTxId(e.target.value)} placeholder="Paste your transaction reference here" />
              <p className="text-xs text-muted-foreground mt-2">{stepTwoHint}</p>
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold"
              disabled={!txId || mutation.isPending}
              onClick={() => {
                const submitAmount = localCurrency && amount
                  ? parseFloat(amount) / localCurrency.rate
                  : parseFloat(amount);
                mutation.mutate({ data: { amount: submitAmount, transactionId: txId } });
              }}
            >
              {mutation.isPending ? t("deposit.submitting") : t("deposit.submit")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
