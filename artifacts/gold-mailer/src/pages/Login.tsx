import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data: any) => {
        login(data.user);
        if (!data.user.isVerified) {
          sessionStorage.setItem("verify_email", data.user.email);
          setLocation("/verify-email");
        } else if (!data.user.profileComplete) {
          setLocation("/setup-profile");
        } else if (!data.user.cardAdded) {
          setLocation("/add-card");
        } else {
          setLocation("/dashboard");
        }
      },
      onError: (err: any) => {
        toast({ title: "Login failed", description: err?.data?.error || err?.message || "Invalid credentials", variant: "destructive" });
      },
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">{t("auth.welcomeBack")}</h1>
          <p className="text-muted-foreground text-sm">{t("auth.signInToAccount")}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => loginMutation.mutate({ data }))} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.emailAddress")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="you@example.com" data-testid="input-email" className="pl-9" />
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
                    <FormLabel>{t("auth.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder={t("auth.password")}
                          data-testid="input-password"
                          className="pl-9 pr-10"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Link href="/forgot-password">
                  <span className="text-sm text-primary hover:underline cursor-pointer">{t("auth.forgotPassword")}</span>
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
                disabled={loginMutation.isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.noAccount")}{" "}
            <Link href="/register">
              <span className="text-primary hover:underline cursor-pointer font-medium">{t("auth.createAccount")}</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
