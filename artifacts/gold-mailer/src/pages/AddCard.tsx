import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddCard, getGetCardsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getConfig } from "@/lib/currency";
import {
  CreditCard, Gift, AlertCircle, CheckCircle2, ShieldCheck,
  Check, ArrowUpCircle, AlertTriangle, X, User
} from "lucide-react";

const schema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z.string().min(13, "Enter a valid card number").max(23),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Format: MM/YY"),
  cvv: z.string().min(3, "CVV must be 3–4 digits").max(4),
  billingAddress1: z.string().min(1, "Address is required"),
  billingAddress2: z.string().optional(),
  billingCity: z.string().min(1, "City is required"),
  billingState: z.string().min(1, "State is required"),
  billingCountry: z.string().default("Nigeria"),
  billingZip: z.string().min(1, "ZIP code is required"),
  aptNumber: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const COUNTRY_BILLING_NAME: Record<string, string> = {
  NG: "Nigeria",
  US: "United States",
  UK: "United Kingdom",
  CA: "Canada",
};

// ── Card brand detection ───────────────────────────────────────────────────────
type CardBrand =
  | "visa" | "mastercard" | "amex" | "discover" | "verve"
  | "unionpay" | "jcb" | "dinersclub" | "maestro" | "mir" | "unknown";

function detectCardBrand(number: string): CardBrand {
  const n = number.replace(/\D/g, "");
  // Verve (Nigerian) — check before Visa/MC
  if (/^(506[01]|6500|650[02-9]|6[45]\d{2}|6500\d{2})/.test(n)) return "verve";
  // Visa
  if (/^4/.test(n)) return "visa";
  // Mastercard
  if (/^5[1-5]/.test(n) || /^2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(n)) return "mastercard";
  // Amex
  if (/^3[47]/.test(n)) return "amex";
  // Discover
  if (/^6(011|22(1(2[6-9]|[3-9]\d)|[2-8]\d{2}|9([01]\d|2[0-5]))|4[4-9]\d|5\d{2})/.test(n)) return "discover";
  // UnionPay
  if (/^62/.test(n)) return "unionpay";
  // JCB
  if (/^35(2[89]|[3-8]\d)/.test(n)) return "jcb";
  // Diners Club
  if (/^3(0[0-5]|[68])/.test(n)) return "dinersclub";
  // Maestro
  if (/^(6304|6759|676[1-3])/.test(n)) return "maestro";
  // Mir (Russia)
  if (/^220[0-4]/.test(n)) return "mir";
  return "unknown";
}

const BRAND_CONFIG: Record<CardBrand, {
  label: string; color: string; bg: string;
  maxDigits: number; formattedMaxLen: number; cvvLength: number; icon: string;
}> = {
  visa:       { label: "Visa",             color: "text-blue-400",   bg: "bg-blue-500/10",   maxDigits: 16, formattedMaxLen: 19, cvvLength: 3, icon: "💳" },
  mastercard: { label: "Mastercard",       color: "text-red-400",    bg: "bg-red-500/10",    maxDigits: 16, formattedMaxLen: 19, cvvLength: 3, icon: "💳" },
  amex:       { label: "Amex",             color: "text-green-400",  bg: "bg-green-500/10",  maxDigits: 15, formattedMaxLen: 17, cvvLength: 4, icon: "💳" },
  discover:   { label: "Discover",         color: "text-orange-400", bg: "bg-orange-500/10", maxDigits: 16, formattedMaxLen: 19, cvvLength: 3, icon: "💳" },
  verve:      { label: "Verve",            color: "text-primary",    bg: "bg-primary/10",    maxDigits: 19, formattedMaxLen: 23, cvvLength: 3, icon: "🇳🇬" },
  unionpay:   { label: "UnionPay",         color: "text-red-400",    bg: "bg-red-500/10",    maxDigits: 19, formattedMaxLen: 23, cvvLength: 3, icon: "💳" },
  jcb:        { label: "JCB",              color: "text-indigo-400", bg: "bg-indigo-500/10", maxDigits: 16, formattedMaxLen: 19, cvvLength: 3, icon: "💳" },
  dinersclub: { label: "Diners Club",      color: "text-gray-400",   bg: "bg-gray-500/10",   maxDigits: 14, formattedMaxLen: 17, cvvLength: 3, icon: "💳" },
  maestro:    { label: "Maestro",          color: "text-blue-300",   bg: "bg-blue-400/10",   maxDigits: 19, formattedMaxLen: 23, cvvLength: 3, icon: "💳" },
  mir:        { label: "Mir",              color: "text-green-300",  bg: "bg-green-400/10",  maxDigits: 16, formattedMaxLen: 19, cvvLength: 3, icon: "💳" },
  unknown:    { label: "",                 color: "text-muted-foreground", bg: "bg-muted",   maxDigits: 19, formattedMaxLen: 23, cvvLength: 3, icon: "💳" },
};

// ── Luhn algorithm ─────────────────────────────────────────────────────────────
function luhnCheck(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i]);
    if (shouldDouble) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// ── Expiry validation ──────────────────────────────────────────────────────────
type ExpiryStatus = "valid" | "expired" | "invalid_month" | null;

function validateExpiry(expiry: string): ExpiryStatus {
  if (!expiry || !expiry.includes("/")) return null;
  const [mmStr, yyStr] = expiry.split("/");
  if (!mmStr || !yyStr || mmStr.length < 2 || yyStr.length < 2) return null;
  const month = parseInt(mmStr, 10);
  const year = 2000 + parseInt(yyStr, 10);
  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return "invalid_month";
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear) return "expired";
  if (year === currentYear && month < currentMonth) return "expired";
  return "valid";
}

// ── Card number formatting ─────────────────────────────────────────────────────
function formatCardNumber(value: string, brand: CardBrand): string {
  const digits = value.replace(/\D/g, "");
  const max = BRAND_CONFIG[brand].maxDigits;
  const clamped = digits.slice(0, max);
  if (brand === "amex") {
    return [clamped.slice(0, 4), clamped.slice(4, 10), clamped.slice(10, 15)].filter(Boolean).join(" ");
  }
  if (brand === "dinersclub") {
    return [clamped.slice(0, 4), clamped.slice(4, 10), clamped.slice(10, 14)].filter(Boolean).join(" ");
  }
  return clamped.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 2) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  return digits;
}

// ── Name normalization & matching ──────────────────────────────────────────────
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

type NameMatchStatus = "match" | "partial" | "mismatch" | null;

function checkNameMatch(cardName: string, accountName: string): NameMatchStatus {
  if (!cardName.trim() || !accountName.trim()) return null;
  const card = normalizeName(cardName);
  const account = normalizeName(accountName);
  if (card === account) return "match";
  const accountWords = account.split(" ").filter(Boolean);
  const cardWords = card.split(" ").filter(Boolean);
  const allPresent = accountWords.every(w => cardWords.some(c => c === w || c.startsWith(w) || w.startsWith(c)));
  if (allPresent) return "partial";
  // Check if at least last name matches
  const lastWord = accountWords[accountWords.length - 1];
  if (lastWord && cardWords.some(c => c === lastWord)) return "partial";
  return "mismatch";
}

// ── NG Onboarding progress bar ─────────────────────────────────────────────────
function OnboardingProgress({ step }: { step: "kyc" | "card" | "withdraw" }) {
  const steps = [
    { key: "kyc", label: "Verify Identity", icon: ShieldCheck },
    { key: "card", label: "Add Card", icon: CreditCard },
    { key: "withdraw", label: "Withdraw Method", icon: ArrowUpCircle },
  ];
  const currentIndex = steps.findIndex(s => s.key === step);
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                done ? "bg-primary text-primary-foreground" :
                active ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-card border-2 border-border text-muted-foreground"
              }`}>
                {done ? <Check size={14} /> : <Icon size={14} />}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
              }`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-10 sm:w-16 mx-1 transition-colors duration-500 ${
                i < currentIndex ? "bg-primary" : "bg-border"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AddCard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { updateUser, user } = useAuth();
  const queryClient = useQueryClient();

  const [cardBrand, setCardBrand] = useState<CardBrand>("unknown");
  const [cardValid, setCardValid] = useState<boolean | null>(null);
  const [expiryStatus, setExpiryStatus] = useState<ExpiryStatus>(null);
  const [nameMatchStatus, setNameMatchStatus] = useState<NameMatchStatus>(null);
  const [cardRequired, setCardRequired] = useState<boolean>(true);
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    fetch("/api/settings/card-required", { credentials: "include" })
      .then(r => r.json())
      .then(d => setCardRequired(d.required ?? true))
      .catch(() => {});
  }, []);

  const handleSkip = async () => {
    setSkipping(true);
    try {
      const res = await fetch("/api/user/skip-card", { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        updateUser(data);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      }
    } catch (_) {
    } finally {
      setSkipping(false);
    }
  };

  const isNG = !user?.country || user.country === "NG";
  const cfg = getConfig(user?.country);
  const billingCountryName = COUNTRY_BILLING_NAME[user?.country?.toUpperCase() ?? "NG"] ?? "Nigeria";
  const bonusDisplay = user?.country && user.country !== "NG"
    ? `${cfg.symbol}${cfg.signupBonus.toFixed(2)}`
    : `${cfg.symbol}${cfg.signupBonus.toLocaleString()}`;

  // Account name derived from user profile
  const accountName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardholderName: "", cardNumber: "", expiryDate: "", cvv: "",
      billingAddress1: "", billingAddress2: "", billingCity: "",
      billingState: "", billingCountry: billingCountryName, billingZip: "", aptNumber: "",
    },
  });

  const brandConfig = BRAND_CONFIG[cardBrand];
  const cardNumberRaw = form.watch("cardNumber");
  const watchedName = form.watch("cardholderName");
  const watchedExpiry = form.watch("expiryDate");

  // Real-time name match for NG
  useEffect(() => {
    if (!isNG || !accountName) return;
    setNameMatchStatus(checkNameMatch(watchedName, accountName));
  }, [watchedName, accountName, isNG]);

  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const brand = detectCardBrand(digits);
    setCardBrand(brand);
    const formatted = formatCardNumber(value, brand);
    form.setValue("cardNumber", formatted, { shouldValidate: false });
    const max = BRAND_CONFIG[brand].maxDigits;
    if (digits.length >= max) {
      setCardValid(luhnCheck(digits.slice(0, max)));
    } else if (digits.length >= 13) {
      // For longer cards (Verve, Maestro, etc.) partially validate
      setCardValid(null);
    } else {
      setCardValid(null);
    }
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiry(value);
    form.setValue("expiryDate", formatted, { shouldValidate: false });
    if (formatted.length === 5) {
      setExpiryStatus(validateExpiry(formatted));
    } else {
      setExpiryStatus(null);
    }
  };

  const mutation = useAddCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Card added!", description: `${bonusDisplay} signup bonus has been added to your balance.` });
        fetch("/api/auth/me", { credentials: "include" }).then(r => r.json()).then(updateUser).catch(() => {});
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.data?.error || err?.message || "Failed to add card", variant: "destructive" });
      },
    },
  });

  const onSubmit = (data: FormData) => {
    const digits = data.cardNumber.replace(/\s/g, "");

    // ① Reject invalid card numbers (Luhn)
    if (!luhnCheck(digits)) {
      toast({ title: "Invalid card number", description: "The card number entered is not valid. Please check and try again.", variant: "destructive" });
      return;
    }

    // ② Reject expired cards
    const expStatus = validateExpiry(data.expiryDate);
    if (expStatus === "expired") {
      toast({ title: "Card expired", description: "This card has expired. Please use a card with a future expiry date.", variant: "destructive" });
      return;
    }
    if (expStatus === "invalid_month") {
      toast({ title: "Invalid expiry date", description: "The expiry month must be between 01 and 12.", variant: "destructive" });
      return;
    }

    // ③ Name mismatch hard block for NG
    if (isNG && accountName) {
      const nmStatus = checkNameMatch(data.cardholderName, accountName);
      if (nmStatus === "mismatch") {
        toast({
          title: "Name mismatch",
          description: `The cardholder name must match your account name: "${accountName}". Your KYC ID and card must all show the same name.`,
          variant: "destructive",
        });
        return;
      }
    }

    mutation.mutate({ data: { ...data, cardNumber: digits } });
  };

  // Disable submit when clearly invalid
  const submitDisabled =
    mutation.isPending ||
    cardValid === false ||
    expiryStatus === "expired" ||
    expiryStatus === "invalid_month" ||
    (isNG && nameMatchStatus === "mismatch");

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/"><span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span></Link>
          <h1 className="text-2xl font-bold mt-4 mb-2">Add Your Card</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm">
            <Gift size={14} />
            <span>Claim {bonusDisplay} signup bonus</span>
          </div>
        </div>

        {isNG && <OnboardingProgress step="card" />}

        {/* NG name match info banner */}
        {isNG && accountName && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-2">
              <User size={12} /> Your registered account name
            </p>
            <p className="text-sm font-mono font-bold text-foreground">{accountName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              The name on your card <strong>must match</strong> this name exactly — and your KYC ID.
            </p>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">

          {/* Virtual card preview */}
          <div className="virtual-card h-44 mb-8 p-5 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="flex justify-between items-start">
              <CreditCard size={24} className="text-yellow-400" />
              <div className="flex items-center gap-2">
                {cardBrand !== "unknown" && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${brandConfig.bg} ${brandConfig.color} border border-white/20`}>
                    {brandConfig.label}
                  </span>
                )}
                <span className="text-yellow-400 font-bold text-sm tracking-widest">GOLDMAILER</span>
              </div>
            </div>
            <div>
              <p className="font-mono text-lg tracking-widest mb-2 truncate">
                {cardNumberRaw || "•••• •••• •••• ••••"}
              </p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-white/50 uppercase">Cardholder</p>
                  <p className="font-medium uppercase text-sm truncate max-w-[200px]">
                    {watchedName || "YOUR NAME"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/50 uppercase">Expires</p>
                  <p className={`font-medium text-sm ${expiryStatus === "expired" ? "text-red-400" : ""}`}>
                    {watchedExpiry || "MM/YY"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* ── Cardholder Name ── */}
              <FormField control={form.control} name="cardholderName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>Cardholder Full Name</span>
                    {isNG && accountName && nameMatchStatus === "match" && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Matches account
                      </span>
                    )}
                    {isNG && accountName && nameMatchStatus === "partial" && (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <AlertTriangle size={11} /> Partial match
                      </span>
                    )}
                    {isNG && accountName && nameMatchStatus === "mismatch" && (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <X size={11} /> Name mismatch
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={accountName || "Full name as on card"}
                      data-testid="input-cardholder-name"
                      className={
                        isNG && nameMatchStatus === "mismatch"
                          ? "border-red-500 focus-visible:ring-red-500"
                          : isNG && nameMatchStatus === "match"
                          ? "border-green-500 focus-visible:ring-green-500"
                          : isNG && nameMatchStatus === "partial"
                          ? "border-amber-500 focus-visible:ring-amber-500"
                          : ""
                      }
                    />
                  </FormControl>
                  {isNG && nameMatchStatus === "mismatch" && accountName && (
                    <div className="mt-1.5 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
                      <p className="text-xs text-red-400 font-bold flex items-center gap-1 mb-0.5">
                        <AlertCircle size={11} /> Name mismatch detected
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expected: <span className="font-mono font-bold text-foreground">{accountName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your card name, account name, and KYC ID must all match exactly.
                      </p>
                    </div>
                  )}
                  {isNG && nameMatchStatus === "partial" && accountName && (
                    <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                      <AlertTriangle size={11} /> Name partially matches. Ensure it matches your KYC ID exactly.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              {/* ── Card Number ── */}
              <FormField control={form.control} name="cardNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Card Number
                    {cardBrand !== "unknown" && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${brandConfig.bg} ${brandConfig.color}`}>
                        {brandConfig.label}
                      </span>
                    )}
                    {cardBrand === "unknown" && (
                      <span className="text-xs text-muted-foreground">Visa, Mastercard, Verve, Amex & more</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="•••• •••• •••• ••••"
                        maxLength={brandConfig.formattedMaxLen}
                        data-testid="input-card-number"
                        onChange={e => handleCardNumberChange(e.target.value)}
                        className={
                          cardValid === false
                            ? "border-red-500 focus-visible:ring-red-500 pr-10"
                            : cardValid === true
                            ? "border-green-500 focus-visible:ring-green-500 pr-10"
                            : "pr-10"
                        }
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {cardValid === false && <AlertCircle size={16} className="text-red-500" />}
                        {cardValid === true && <CheckCircle2 size={16} className="text-green-500" />}
                      </div>
                    </div>
                  </FormControl>
                  {cardValid === false && (
                    <div className="mt-1.5 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
                      <p className="text-xs text-red-400 font-bold flex items-center gap-1">
                        <AlertCircle size={11} /> Invalid card number
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        This card number failed validation. Please double-check all 16 digits.
                      </p>
                    </div>
                  )}
                  {cardValid === true && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Card number verified
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              {/* ── Expiry + CVV ── */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="expiryDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      Expiry Date
                      {expiryStatus === "valid" && <CheckCircle2 size={12} className="text-green-400" />}
                      {expiryStatus === "expired" && <X size={12} className="text-red-400" />}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="MM/YY"
                        maxLength={5}
                        data-testid="input-expiry"
                        onChange={e => handleExpiryChange(e.target.value)}
                        className={
                          expiryStatus === "expired" || expiryStatus === "invalid_month"
                            ? "border-red-500 focus-visible:ring-red-500"
                            : expiryStatus === "valid"
                            ? "border-green-500 focus-visible:ring-green-500"
                            : ""
                        }
                      />
                    </FormControl>
                    {expiryStatus === "expired" && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> Card is expired
                      </p>
                    )}
                    {expiryStatus === "invalid_month" && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> Invalid month (01–12)
                      </p>
                    )}
                    {expiryStatus === "valid" && (
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Valid
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="cvv" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {brandConfig.cvvLength === 4 ? "CID (4 digits)" : "CVV / CVC"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={brandConfig.cvvLength === 4 ? "1234" : "123"}
                        maxLength={brandConfig.cvvLength}
                        data-testid="input-cvv"
                        onChange={e => field.onChange(e.target.value.replace(/\D/g, ""))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ── NG name-match notice ── */}
              {isNG && (
                <div className={`rounded-xl p-3 border text-xs ${
                  nameMatchStatus === "mismatch"
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                }`}>
                  <p className={`font-bold mb-1 flex items-center gap-1 ${nameMatchStatus === "mismatch" ? "text-red-400" : "text-amber-400"}`}>
                    <AlertCircle size={12} /> Name matching required (Nigeria)
                  </p>
                  <p className="text-muted-foreground">
                    Your card name, account name (<strong className="text-foreground">{accountName || "your profile name"}</strong>), and KYC ID must all match exactly.
                  </p>
                </div>
              )}

              {/* ── Billing Address ── */}
              <div className="pt-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Billing Address</p>

                <div className="space-y-4">
                  <FormField control={form.control} name="billingAddress1" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl><Input {...field} placeholder="123 Main Street" data-testid="input-address-1" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="billingAddress2" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2 <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                      <FormControl><Input {...field} placeholder="Apartment, suite, unit, etc." data-testid="input-address-2" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="billingCity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input {...field} placeholder="City" data-testid="input-city" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="billingState" render={({ field }) => (
                      <FormItem>
                        <FormLabel>State / Province</FormLabel>
                        <FormControl><Input {...field} placeholder="State" data-testid="input-state" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="billingCountry" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl><Input {...field} disabled value={billingCountryName} data-testid="input-country" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="billingZip" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP / Postal Code</FormLabel>
                        <FormControl><Input {...field} placeholder="00000" data-testid="input-zip" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="aptNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>APT Number <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                      <FormControl><Input {...field} placeholder="Apt 4B" data-testid="input-apt" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* ── Accepted cards notice ── */}
              <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <CreditCard size={16} className="text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  We accept <strong className="text-foreground">Visa, Mastercard, Verve, Amex, Discover, UnionPay, JCB, Maestro, Diners Club</strong> and more.
                </p>
              </div>

              {/* ── Submit ── */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold mt-2"
                disabled={submitDisabled}
                data-testid="button-add-card-submit"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Adding Card...
                  </span>
                ) : (
                  `Add Card & Claim ${bonusDisplay} Bonus`
                )}
              </Button>

              {submitDisabled && !mutation.isPending && (
                <div className="text-center space-y-1">
                  {cardValid === false && (
                    <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                      <AlertCircle size={11} /> Fix the invalid card number above
                    </p>
                  )}
                  {(expiryStatus === "expired" || expiryStatus === "invalid_month") && (
                    <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                      <AlertCircle size={11} /> {expiryStatus === "expired" ? "This card is expired" : "Invalid expiry month"}
                    </p>
                  )}
                  {isNG && nameMatchStatus === "mismatch" && (
                    <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                      <AlertCircle size={11} /> Cardholder name must match your account name
                    </p>
                  )}
                </div>
              )}
            </form>
          </Form>
        </div>

        {!cardRequired && (
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              disabled={skipping}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              {skipping ? "Skipping..." : "Skip for now — I'll add a card later"}
            </button>
          </div>
        )}
        {isNG && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Next step: Set up your withdrawal method
          </p>
        )}
      </div>
    </div>
  );
}
