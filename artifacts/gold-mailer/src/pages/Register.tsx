import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Shield, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const TERMS = `TERMS OF SERVICE

By using Gold Mailer, you agree to the following terms:

1. ELIGIBILITY: You must be 18 years or older and a resident of Nigeria to use this platform.

2. STAKING: The minimum stake is ₦2,700 and maximum is ₦100,000. Funds are locked for 7 days.

3. PROFITS: Profit for a ₦2,700 stake is ₦8,000 after 7 days. Higher deposits earn proportionally more.

4. DAILY REWARDS: Users may claim ₦100 daily reward per active stake.

5. SIGNUP BONUS: A one-time ₦3,000 bonus is credited upon adding your first card.

6. WITHDRAWALS: Withdrawal requests are subject to admin approval within 24-48 hours.

7. DEPOSITS: All deposits require a valid transaction ID for verification.

8. PROHIBITED ACTIVITIES: Fraud, misrepresentation, or abuse of the platform will result in immediate account termination.

9. CHANGES: Gold Mailer reserves the right to modify terms at any time.

PRIVACY POLICY

Gold Mailer collects and uses your personal data (name, email, card details) solely to provide our services. We do not sell your data to third parties. Your financial information is encrypted and stored securely. You may request deletion of your data at any time by contacting support.`;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showTerms, setShowTerms] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data: any) => {
        const email = form.getValues("email");
        sessionStorage.setItem("verify_email", email);
        if (data?.devCode) {
          sessionStorage.setItem("verify_dev_code", data.devCode);
        } else {
          sessionStorage.removeItem("verify_dev_code");
        }
        setLocation("/verify-email");
      },
      onError: (err: any) => {
        toast({ title: "Registration failed", description: err?.data?.error || err?.message || "Something went wrong", variant: "destructive" });
      },
    },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate({ data });
  };

  if (showTerms) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-primary/10 border-b border-border p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <Shield size={24} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold">Terms of Service & Privacy Policy</h2>
            <p className="text-muted-foreground text-sm mt-1">Please read and agree to continue</p>
          </div>
          <div className="p-6">
            <div className="bg-background rounded-xl border border-border p-4 h-56 overflow-y-auto text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-6">
              {TERMS}
            </div>
            <label className="flex items-center gap-3 cursor-pointer mb-6 p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <input
                type="checkbox"
                data-testid="checkbox-terms"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="w-5 h-5 rounded accent-primary"
              />
              <span className="text-sm text-foreground">
                I have read and agree to the Terms of Service and Privacy Policy
              </span>
            </label>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setLocation("/")}>
                Decline
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
                disabled={!agreed}
                onClick={() => setShowTerms(false)}
                data-testid="button-terms-agree"
              >
                Agree & Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">Create Account</h1>
          <p className="text-muted-foreground text-sm">Start your investment journey today</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@example.com"
                          data-testid="input-email"
                          className="pl-9"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 6 characters"
                          data-testid="input-password"
                          className="pl-9 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
                disabled={registerMutation.isPending}
                data-testid="button-register-submit"
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary hover:underline cursor-pointer font-medium">Sign In</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
