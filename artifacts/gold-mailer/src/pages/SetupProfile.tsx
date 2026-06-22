import { useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateProfile, getGetMeQueryKey, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, Camera, Check, ArrowLeft, ChevronRight, Globe, Phone, UserCircle2, ShieldCheck, MessageSquare } from "lucide-react";
import { ALL_COUNTRIES } from "@/lib/countries";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  age: z.coerce.number().min(18, "Must be at least 18").max(100, "Invalid age").optional(),
  gender: z.string().optional(),
  avatarUrl: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(7, "Phone number is required"),
});
type FormData = z.infer<typeof schema>;

const STEPS = [
  { label: "Your Name", icon: UserCircle2, description: "How should we address you?" },
  { label: "Location", icon: Globe, description: "Where are you based?" },
  { label: "About You", icon: User, description: "A few more details" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                done ? "bg-primary text-primary-foreground" :
                active ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-card border-2 border-border text-muted-foreground"
              }`}>
                {done ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-16 sm:w-24 mx-1 transition-colors duration-500 ${i < current ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8 space-y-2">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-5 w-56 mx-auto" />
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function SetupProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");
  const [step, setStep] = useState(0);

  // Step 1 has two phases: "enter" (country + phone) → "otp" (confirm code)
  const [step1Phase, setStep1Phase] = useState<"enter" | "otp">("enter");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const { isLoading } = useGetMe();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", middleName: "", lastName: "", age: undefined, gender: "", avatarUrl: "", country: "NG", phone: "" },
    mode: "onTouched",
  });

  const mutation = useUpdateProfile({
    mutation: {
      onSuccess: (data: any) => {
        updateUser(data);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/add-card");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.data?.error || err?.message || "Failed to save profile", variant: "destructive" });
      },
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    form.setValue("avatarUrl", "");
  };

  // Called when user taps "Continue" on Step 1 — sends OTP automatically
  const sendOtpAndProceed = async () => {
    const ok = await form.trigger(["country", "phone"]);
    if (!ok) return;

    const phone = form.getValues("phone").trim();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/sms/verify/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send verification code. Please try again.");
        return;
      }
      // OTP sent — switch to confirmation phase
      setStep1Phase("otp");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  // Called when user enters OTP and taps "Confirm & Continue"
  const confirmOtpAndContinue = async () => {
    if (!phoneOtp.trim()) { setError("Please enter the 6-digit code you received."); return; }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/sms/verify/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: phoneOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid or expired code. Please try again.");
        return;
      }
      // Verified — proceed to Step 2
      setPhoneOtp("");
      setStep(2);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const goNext = async () => {
    if (step === 0) {
      const ok = await form.trigger(["firstName", "lastName"]);
      if (ok) setStep(1);
    }
  };

  const onSubmit = (data: FormData) => {
    mutation.mutate({ data });
  };

  if (isLoading) return <ProfileSkeleton />;

  const headerDescription =
    step === 0 ? STEPS[0].description :
    step === 1 && step1Phase === "otp" ? "Verify your phone number" :
    step === 1 ? STEPS[1].description :
    STEPS[2].description;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link href="/"><span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span></Link>
          <h1 className="text-2xl font-black mt-3 mb-1">Set Up Your Profile</h1>
          <p className="text-muted-foreground text-sm">{headerDescription}</p>
        </div>

        <StepIndicator current={step} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>

            {/* ─── Step 0: Your Name ─── */}
            {step === 0 && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="flex flex-col items-center mb-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center relative overflow-hidden hover:border-primary transition-colors"
                  >
                    {preview ? (
                      <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-primary/50" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera size={18} className="text-white" />
                    </div>
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">Photo (optional)</p>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input {...field} placeholder="John" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input {...field} placeholder="Doe" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="middleName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                    <FormControl><Input {...field} placeholder="Optional" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="button" onClick={goNext} className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold">
                  Continue <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}

            {/* ─── Step 1, Phase "enter": Country + Phone ─── */}
            {step === 1 && step1Phase === "enter" && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2">
                  <Globe size={16} className="text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">Your country sets your currency and platform limits.</p>
                </div>

                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-72">
                        {ALL_COUNTRIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone Number <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type="tel"
                          placeholder="+2348012345678"
                          className="pl-9"
                          onChange={e => { field.onChange(e); setError(""); }}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Include your country code — e.g. +234 (Nigeria), +1 (USA), +44 (UK), +91 (India)
                    </p>
                    <FormMessage />
                  </FormItem>
                )} />

                {error && (
                  <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1 py-5 gap-2">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={sendOtpAndProceed}
                    disabled={sending}
                    className="flex-1 bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Sending code...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Continue <ChevronRight size={16} />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ─── Step 1, Phase "otp": Confirm verification code ─── */}
            {step === 1 && step1Phase === "otp" && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                {/* Icon + info */}
                <div className="flex flex-col items-center text-center pt-2 pb-1">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <MessageSquare size={28} className="text-primary" />
                  </div>
                  <p className="font-bold text-base">Check your phone</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We sent a 6-digit code to <span className="font-semibold text-foreground">{form.getValues("phone")}</span>
                  </p>
                </div>

                {/* OTP input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Verification Code</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={phoneOtp}
                    onChange={e => { setPhoneOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); confirmOtpAndContinue(); } }}
                    className="font-mono text-center text-2xl tracking-[0.5em] py-6"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={confirmOtpAndContinue}
                  disabled={sending || phoneOtp.length < 6}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={16} /> Confirm & Continue
                    </span>
                  )}
                </Button>

                {/* Resend + change number */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => { setStep1Phase("enter"); setPhoneOtp(""); setError(""); }}
                  >
                    ← Change number
                  </button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={async () => {
                      setPhoneOtp("");
                      setError("");
                      setSending(true);
                      try {
                        const res = await fetch("/api/sms/verify/request", {
                          method: "POST", credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ phone: form.getValues("phone").trim() }),
                        });
                        const data = await res.json();
                        if (!res.ok) setError(data.error ?? "Failed to resend");
                      } catch { setError("Network error."); }
                      finally { setSending(false); }
                    }}
                    disabled={sending}
                  >
                    Resend code →
                  </button>
                </div>
              </div>
            )}

            {/* ─── Step 2: About You ─── */}
            {step === 2 && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                  <ShieldCheck size={16} className="text-green-400 shrink-0" />
                  <p className="text-xs text-green-400 font-medium">
                    Phone verified — <span className="opacity-70">{form.getValues("phone")}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="25" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Profile summary */}
                <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Profile Summary</p>
                  {[
                    { label: "Name", value: [form.getValues("firstName"), form.getValues("middleName"), form.getValues("lastName")].filter(Boolean).join(" ") },
                    { label: "Country", value: ALL_COUNTRIES.find(c => c.code === form.getValues("country"))?.name ?? form.getValues("country") },
                    { label: "Phone", value: form.getValues("phone"), verified: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-semibold text-foreground truncate max-w-[55%] text-right flex items-center gap-1">
                        {item.value || "—"}
                        {item.verified && item.value && <ShieldCheck size={11} className="text-green-400 shrink-0" />}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => { setStep(1); setStep1Phase("enter"); }} className="flex-1 py-5 gap-2">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2"><Check size={16} /> Save & Continue</span>
                    )}
                  </Button>
                </div>
              </div>
            )}

          </form>
        </Form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {step === 1 && step1Phase === "otp"
            ? "Step 2 of 3 — Verify Phone"
            : `Step ${step + 1} of ${STEPS.length} — ${STEPS[step].label}`}
        </p>
      </div>
    </div>
  );
}
