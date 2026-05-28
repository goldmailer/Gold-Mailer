import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ALL_COUNTRIES } from "@/lib/countries";
import { fmt as currencyFmt } from "@/lib/currency";

export default function Exchange() {
  const { user } = useAuth();
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState(user?.country ?? "NG");
  const [amount, setAmount] = useState("");

  const allCurrencyOptions = [
    { code: "USD", label: "USD — US Dollar", symbol: "$", rate: 1 },
    ...ALL_COUNTRIES
      .filter(c => c.currencyCode !== "USD")
      .map(c => ({ code: c.code, label: `${c.currencyCode} — ${c.name}`, symbol: c.currencySymbol, rate: c.exchangeRate }))
      .filter((v, i, arr) => arr.findIndex(x => x.label === v.label) === i),
  ];

  function getRate(code: string): { symbol: string; rate: number } {
    if (code === "USD") return { symbol: "$", rate: 1 };
    const c = ALL_COUNTRIES.find(x => x.code === code);
    return c ? { symbol: c.currencySymbol, rate: c.exchangeRate } : { symbol: "$", rate: 1 };
  }

  const numAmount = parseFloat(amount) || 0;
  const from = getRate(fromCurrency);
  const to = getRate(toCurrency);

  // Convert: from → USD → to
  const usdAmount = numAmount / from.rate;
  const toAmount = usdAmount * to.rate;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount(toAmount > 0 ? toAmount.toFixed(4) : "");
  };

  const popularPairs = [
    { from: "USD", to: "NG", label: "USD → NGN" },
    { from: "USD", to: "GB", label: "USD → GBP" },
    { from: "USD", to: "CA", label: "USD → CAD" },
    { from: "USD", to: "IN", label: "USD → INR" },
    { from: "NG", to: "USD", label: "NGN → USD" },
    { from: "GB", to: "USD", label: "GBP → USD" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 max-w-xl mx-auto px-4 sm:pl-16 py-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-black">Currency Exchange</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">Convert between currencies using live indicative rates</p>

        {/* Your balance */}
        <div className="bg-card border border-border rounded-xl px-5 py-4 mb-6 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Your Balance</span>
          <span className="font-black text-primary text-lg">{currencyFmt(user?.balance ?? 0)}</span>
        </div>

        {/* Converter card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            {/* From */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">From</label>
              <div className="flex gap-2">
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-48 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {allCurrencyOptions.map(opt => (
                      <SelectItem key={opt.code} value={opt.code}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">{from.symbol}</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwap}
                className="rounded-full w-10 h-10 p-0 border-primary/30 hover:border-primary text-primary"
              >
                <ArrowLeftRight size={16} />
              </Button>
            </div>

            {/* To */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">To</label>
              <div className="flex gap-2">
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-48 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {allCurrencyOptions.map(opt => (
                      <SelectItem key={opt.code} value={opt.code}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">{to.symbol}</span>
                  <Input
                    type="text"
                    readOnly
                    value={toAmount > 0 ? toAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : ""}
                    placeholder="0.00"
                    className="pl-8 bg-muted/50 cursor-default"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rate display */}
          {numAmount > 0 && toAmount > 0 && (
            <div className="mt-5 p-3 bg-primary/10 border border-primary/20 rounded-xl text-center">
              <p className="text-sm font-semibold text-primary">
                {from.symbol}1 = {to.symbol}{(to.rate / from.rate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Indicative rate — for reference only</p>
            </div>
          )}
        </div>

        {/* Popular pairs */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> Popular Pairs
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {popularPairs.map(pair => {
              const f = getRate(pair.from);
              const t2 = getRate(pair.to);
              const rate = t2.rate / f.rate;
              return (
                <button
                  key={pair.label}
                  onClick={() => { setFromCurrency(pair.from); setToCurrency(pair.to); }}
                  className="text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition-all"
                >
                  <p className="text-xs font-semibold text-foreground">{pair.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {f.symbol}1 = {t2.symbol}{rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Rates are indicative and for reference only. Actual withdrawal amounts may vary.
        </p>
      </main>
    </div>
  );
}
