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
import { CreditCard, Gift } from "lucide-react";

const schema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z.string().min(16, "Enter a valid 16-digit card number").max(19),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Format: MM/YY"),
  cvv: z.string().min(3, "CVV must be 3 digits").max(4),
  billingAddress1: z.string().min(1, "Address is required"),
  billingAddress2: z.string().optional(),
  billingCity: z.string().min(1, "City is required"),
  billingState: z.string().min(1, "State is required"),
  billingCountry: z.string().default("Nigeria"),
  billingZip: z.string().min(1, "ZIP code is required"),
  aptNumber: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 2) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  return digits;
}

export default function AddCard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardholderName: "", cardNumber: "", expiryDate: "", cvv: "",
      billingAddress1: "", billingAddress2: "", billingCity: "",
      billingState: "", billingCountry: "Nigeria", billingZip: "", aptNumber: "",
    },
  });

  const mutation = useAddCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Card added!", description: "₦3,000 signup bonus has been added to your balance." });
        fetch("/api/auth/me", { credentials: "include" }).then(r => r.json()).then(updateUser).catch(() => {});
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.response?.data?.error || "Failed to add card", variant: "destructive" });
      },
    },
  });

  const onSubmit = (data: FormData) => {
    const cleaned = { ...data, cardNumber: data.cardNumber.replace(/\s/g, "") };
    mutation.mutate({ data: cleaned });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span></Link>
          <h1 className="text-2xl font-bold mt-4 mb-2">Add Your Card</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm">
            <Gift size={14} />
            <span>Claim ₦3,000 signup bonus</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {/* Card preview */}
          <div className="virtual-card h-48 mb-8 p-6 flex flex-col justify-between text-white relative">
            <div className="flex justify-between items-start">
              <CreditCard size={28} className="text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm tracking-widest">GOLDMAILER</span>
            </div>
            <div>
              <p className="font-mono text-xl tracking-widest mb-2">
                {form.watch("cardNumber") || "•••• •••• •••• ••••"}
              </p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-white/50 uppercase">Cardholder</p>
                  <p className="font-medium uppercase text-sm">{form.watch("cardholderName") || "YOUR NAME"}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase">Expires</p>
                  <p className="font-medium text-sm">{form.watch("expiryDate") || "MM/YY"}</p>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="cardNumber" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Card Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1234 5678 9012 3456" maxLength={19} data-testid="input-card-number"
                        onChange={e => field.onChange(formatCardNumber(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
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
                    <FormLabel>CVV/CVC</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123" maxLength={4} data-testid="input-cvv"
                        onChange={e => field.onChange(e.target.value.replace(/\D/g, ""))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

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
                    <FormControl><Input {...field} placeholder="Lagos" data-testid="input-city" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="billingState" render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl><Input {...field} placeholder="Lagos State" data-testid="input-state" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="billingCountry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl><Input {...field} disabled value="Nigeria" data-testid="input-country" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="billingZip" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl><Input {...field} placeholder="100001" data-testid="input-zip" /></FormControl>
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

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold mt-4"
                disabled={mutation.isPending} data-testid="button-add-card-submit">
                {mutation.isPending ? "Adding Card..." : "Add Card & Claim ₦3,000 Bonus"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
