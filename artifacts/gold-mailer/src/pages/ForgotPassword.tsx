import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgotPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const mutation = useForgotPassword({
    mutation: {
      onSuccess: () => {
        const email = form.getValues("email");
        sessionStorage.setItem("reset_email", email);
        toast({ title: "Reset code sent", description: "Check your email for the reset code." });
        setLocation("/reset-password");
      },
      onError: () => {
        toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      },
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span></Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">Forgot Password</h1>
          <p className="text-muted-foreground text-sm">Enter your email to receive a reset code</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => mutation.mutate({ data }))} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
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
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
                disabled={mutation.isPending} data-testid="button-forgot-submit">
                {mutation.isPending ? "Sending..." : "Send Reset Code"}
              </Button>
            </form>
          </Form>
          <Link href="/login">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto mt-6">
              <ArrowLeft size={14} /> Back to Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
