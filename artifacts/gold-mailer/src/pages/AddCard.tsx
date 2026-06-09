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
import { CreditCard, Gift, AlertCircle, CheckCircle2 } from "lucide-react";

const schema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z.string().min(13, "Enter a valid card number").max(19),
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

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "verve" | "unionpay" | "jcb" | "dinersclub" | "unknown";

function detectCardBrand(number: string): CardBrand {
  const n = number.replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(011|22(1(2[6-9]|[3-9]\d)|[2-8]\d{2}|9([01]\d|2[0-5]))|4[4-9]\d|5\d{2})/.test(n)) return "discover";
  if (/^(506[01]|6500|650[02-9]|6[45]\d{2})/.test(n)) return "verve";
  if (/^62/.test(n)) return "unionpay";
  if (/^35(2[89]|[3-8]\d)/.test(n)) return "jcb";
  if (/^3(0[0-5]|[68])/.test(n)) return "dinersclub";
  return "unknown";
}

function luhnCheck(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i]);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function getExpectedLength(brand: CardBrand): number {
  if (brand === "amex") return 15;
  if (brand === "dinersclub") return 14;
  return 16;
}

const BRAND_CONFIG: Record<CardBrand, { label: string; color: string; bg: string; maxLength: number; cvvLength: number }> = {
  visa: { label: "Visa", color: "text-blue-400", bg: "bg-blue-500/10", maxLength: 19, cvvLength: 3 },
  mastercard: { label: "Mastercard", color: "text-red-400", bg: "bg-red-500/10", maxLength: 19, cvvLength: 3 },
  amex: { label: "American Express", color: "text-green-400", bg: "bg-green-500/10", maxLength: 17, cvvLength: 4 },
  discover: { label: "Discover", color: "text-orange-400", bg: "bg-orange-500/10", maxLength: 19, cvvLength: 3 },
  verve: { label: "Verve", color: "text-primary", bg: "bg-primary/10", maxLength: 19, cvvLength: 3 },
  unionpay: { label: "UnionPay", color: "text-red-400", bg: "bg-red-500/10", maxLength: 19, cvvLength: 3 },
  jcb: { label: "JCB", color: "text-indigo-400", bg: "bg-indigo-500/10", maxLength: 19, cvvLength: 3 },
  dinersclub: { label: "Diners Club", color: "text-gray-400", bg: "bg-gray-500/10", maxLength: 17, cvvLength: 3 },
  unknown: { label: "", color: "text-muted-foreground", bg: "bg-muted", maxLength: 19, cvvLength: 3 },
};

function formatCardNumber(value: string, brand: CardBrand) {
  const digits = value.replace(/\D/g, "");
  if (brand === "amex") {
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(" ");
  }
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 2) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  return digits;
}

export default function AddCard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { updateUser, user } = useAuth();
  const queryClient = useQueryClient();
  const [cardBrand, setCardBrand] = useState<CardBrand>("unknown");
  const [cardValid, setCardValid] = useState<boolean | null>(null);

  const cfg = getConfig(user?.country);
  const billingCountryName = COUNTRY_BILLING_NAME[user?.country?.toUpperCase() ?? "NG"] ?? "Nigeria";
  const bonusDisplay = user?.country && user.country !== "NG"
    ? `${cfg.symbol}${cfg.signupBonus.toFixed(2)}`
    : `${cfg.symbol}${cfg.signupBonus.toLocaleString()}`;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardholderName: "", cardNumber: "", expiryDate: "", cvv: "",
      billingAddress1: "", billingAddress2: "", billingCity: "",
      billingState: "", billingCountry: billingCountryName, billingZip: "", aptNumber: "",
    },
  });

  const cardNumberRaw = form.watch("cardNumber");
  const brandConfig = BRAND_CONFIG[cardBrand];

  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const brand = detectCardBrand(digits);
    setCardBrand(brand);
    const formatted = formatCardNumber(digits, brand);
    form.setValue("cardNumber", formatted, { shouldValidate: true });

    const expectedLen = getExpectedLength(brand);
    if (digits.length >= expectedLen) {
      setCardValid(luhnCheck(digits));
    } else {
      setCardValid(null);
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
    if (!luhnCheck(digits)) {
      toast({ title: "Invalid card number", description: "Please check your card number and try again.", variant: "destructive" });
      return;
    }
    const cleaned = { ...data, cardNumber: digits };
    mutation.mutate({ data: cleaned });
  };

  const watchedName = form.watch("cardholderName");
  const watchedExpiry = form.watch("expiryDate");

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span></Link>
          <h1 className="text-2xl font-bold mt-4 mb-2">Add Your Card</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm">
            <Gift size={14} />
            <span>Claim {bonusDisplay} signup bonus</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {/* Card preview */}
          <div className="virtual-card h-48 mb-8 p-6 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="flex justify-between items-start">
              <CreditCard size={28} className="text-yellow-400" />
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
              <p className="font-mono text-xl tracking-widest mb-2">
                {cardNumberRaw || "•••• •••• •••• ••••"}
              </p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-white/50 uppercase">Cardholder</p>
                  <p className="font-medium uppercase text-sm">{watchedName || "YOUR NAME"}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase">Expires</p>
                  <p className="font-medium text-sm">{watchedExpiry || "MM/YY"}</p>
                </div>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="cardholderName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cardholder Full Name</FormLabel>
                  <FormControl><Input {...field} placeholder="John Doe" data-testid="input-cardholder-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cardNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Card Number
                    {cardBrand !== "unknown" && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${brandConfig.bg} ${brandConfig.color}`}>
                        {brandConfig.label}
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Card number"
                        maxLength={brandConfig.maxLength}
                        data-testid="input-card-number"
                        onChange={e => handleCardNumberChange(e.target.value)}
                        className={
                          cardValid === false
                            ? "border-red-500 focus-visible:ring-red-500"
                            : cardValid === true
                            ? "border-green-500 focus-visible:ring-green-500"
                            : ""
                        }
                      />
                      {cardValid === false && (
                        <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                      )}
                      {cardValid === true && (
                        <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                      )}
                    </div>
                  </FormControl>
                  {cardValid === false && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> Invalid card number — please check and try again
                    </p>
                  )}
                  {cardValid === true && (
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <CheckCircle2 size={12} /> Card number verified
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="expiryDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="MM/YY" maxLength={5} data-testid="input-expiry"
                        onChange={e => field.onChange(formatExpiry(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cvv" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVV{brandConfig.cvvLength === 4 ? "/CID (4 digits)" : "/CVC"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={brandConfig.cvvLength === 4 ? "1234" : "123"} maxLength={brandConfig.cvvLength} data-testid="input-cvv"
                        onChange={e => field.onChange(e.target.value.replace(/\D/g, ""))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {user?.country === "NG" && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Name matching required
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The name on your card must exactly match your KYC ID name and your GoldMailer account name.
                  </p>
                </div>
              )}

              <FormField control={form.control} name="billingAddress1" render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Address Line 1</FormLabel>
                  <FormControl><Input {...field} placeholder="123 Main Street" data-testid="input-address-1" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="billingAddress2" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Apartment, suite, etc." data-testid="input-address-2" /></FormControl>
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

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold mt-4"
                disabled={mutation.isPending || cardValid === false}
                data-testid="button-add-card-submit"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Adding Card...
                  </span>
                ) : `Add Card & Claim ${bonusDisplay} Bonus`}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
