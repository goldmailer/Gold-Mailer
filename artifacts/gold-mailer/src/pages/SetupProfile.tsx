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
import { User, Camera, Check, ArrowLeft, ChevronRight, Globe, Phone, UserCircle2, ShieldCheck } from "lucide-react";
import { ALL_COUNTRIES } from "@/lib/countries";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  age: z.coerce.number().min(18, "Must be at least 18").max(100, "Invalid age").optional(),
  gender: z.string().optional(),
  avatarUrl: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
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

  // Phone verification state
  const [phoneOtpStep, setPhoneOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneInfo, setPhoneInfo] = useState("");

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
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    form.setValue("avatarUrl", "");
  };

  const requestPhoneOtp = async () => {
    setPhoneError("");
    setPhoneInfo("");
    const phone = form.getValues("phone");
    if (!phone?.trim()) { setPhoneError("Enter your phone number with country code, e.g. +2348012345678"); return; }
    setPhoneSending(true);
    try {
      const res = await fetch("/api/sms/verify/request", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneError(data.error ?? "Failed to send code"); return; }
      setPhoneOtpStep("sent");
      setPhoneInfo("A 6-digit code was sent to your phone.");
    } catch { setPhoneError("Network error. Please try again."); }
    finally { setPhoneSending(false); }
  };

  const confirmPhoneOtp = async () => {
    setPhoneError("");
    if (!phoneOtp.trim()) { setPhoneError("Enter the code you received."); return; }
    setPhoneSending(true);
    try {
      const res = await fetch("/api/sms/verify/confirm", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: phoneOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneError(data.error ?? "Invalid code. Try again."); return; }
      setPhoneOtpStep("verified");
      setPhoneInfo("");
    } catch { setPhoneError("Network error. Please try again."); }
    finally { setPhoneSending(false); }
  };

  const goNext = async () => {
    if (step === 0) {
      const ok = await form.trigger(["firstName", "lastName"]);
      if (!ok) return;
    }
    if (step === 1) {
      const ok = await form.trigger(["country"]);
      if (!ok) return;
      const phone = form.getValues("phone");
      if (phone?.trim() && phoneOtpStep !== "verified") {
        setPhoneError("Please verify your phone number before continuing, or clear the phone field to skip.");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const onSubmit = (data: FormData) => {
    mutation.mutate({ data: { ...data, phone: phoneOtpStep === "verified" ? data.phone : undefined } });
  };

  if (isLoading) return <ProfileSkeleton />;

  const country = form.watch("country");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/"><span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span></Link>
          <h1 className="text-2xl font-black mt-3 mb-1">Set Up Your Profile</h1>
          <p className="text-muted-foreground text-sm">{STEPS[step].description}</p>
        </div>

        <StepIndicator current={step} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>

            {/* Step 0 — Your Name */}
            {step === 0 && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="flex flex-col items-center mb-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    data-testid="button-avatar-upload"
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
                      <FormControl><Input {...field} placeholder="John" data-testid="input-first-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input {...field} placeholder="Doe" data-testid="input-last-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="middleName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                    <FormControl><Input {...field} placeholder="Optional" data-testid="input-middle-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="button" onClick={goNext} className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold">
                  Continue <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}

            {/* Step 1 — Location */}
            {step === 1 && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2">
                  <Globe size={16} className="text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">Your country determines your currency and platform limits.</p>
                </div>

                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-country">
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

                {/* Phone + inline OTP verification */}
                <div className="space-y-2">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>Phone Number <span className="text-muted-foreground text-xs font-normal">(optional)</span></span>
                        {phoneOtpStep === "verified" && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            {...field}
                            type="tel"
                            placeholder="+2348012345678"
                            data-testid="input-phone"
                            className="pl-9"
                            disabled={phoneOtpStep === "verified"}
                            onChange={e => { field.onChange(e); setPhoneOtpStep("idle"); setPhoneOtp(""); setPhoneError(""); setPhoneInfo(""); }}
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Include country code — works for all countries worldwide</p>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {phoneError && (
                    <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                      {phoneError}
                    </div>
                  )}
                  {phoneInfo && (
                    <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
                      {phoneInfo}
                    </div>
                  )}

                  {phoneOtpStep === "verified" ? (
                    <div className="flex items-center gap-2 p-2.5 bg-green-500/5 border border-green-500/20 rounded-xl">
                      <ShieldCheck size={15} className="text-green-400 shrink-0" />
                      <p className="text-xs text-green-400 font-medium">Phone number verified</p>
                      <button type="button" className="ml-auto text-xs text-muted-foreground hover:text-primary"
                        onClick={() => { setPhoneOtpStep("idle"); setPhoneOtp(""); form.setValue("phone", ""); }}>
                        Change
                      </button>
                    </div>
                  ) : phoneOtpStep === "sent" ? (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        value={phoneOtp}
                        onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); confirmPhoneOtp(); }}}
                        className="font-mono text-center tracking-widest"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="flex-1"
                          onClick={() => { setPhoneOtpStep("idle"); setPhoneOtp(""); setPhoneInfo(""); setPhoneError(""); }}>
                          Back
                        </Button>
                        <Button type="button" size="sm" className="flex-1 bg-primary text-primary-foreground font-bold"
                          onClick={confirmPhoneOtp} disabled={phoneSending}>
                          <ShieldCheck size={14} className="mr-1" />
                          {phoneSending ? "Verifying..." : "Confirm Code"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    form.watch("phone")?.trim() && (
                      <Button type="button" variant="outline" size="sm" className="w-full"
                        onClick={requestPhoneOtp} disabled={phoneSending}>
                        <Phone size={14} className="mr-2" />
                        {phoneSending ? "Sending..." : "Send Verification Code"}
                      </Button>
                    )
                  )}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1 py-5 gap-2">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button type="button" onClick={goNext} className="flex-1 bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold">
                    Continue <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2 — About You */}
            {step === 2 && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="25" data-testid="input-age" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-gender"><SelectValue placeholder="Select" /></SelectTrigger>
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

                {/* Profile review summary */}
                <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Profile Summary</p>
                  {[
                    { label: "Name", value: [form.getValues("firstName"), form.getValues("middleName"), form.getValues("lastName")].filter(Boolean).join(" ") },
                    { label: "Country", value: ALL_COUNTRIES.find(c => c.code === form.getValues("country"))?.name ?? form.getValues("country") },
                    { label: "Phone", value: form.getValues("phone") || "—" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-semibold text-foreground truncate max-w-[55%] text-right">{item.value || "—"}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 py-5 gap-2">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
                    disabled={mutation.isPending}
                    data-testid="button-profile-submit"
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
          Step {step + 1} of {STEPS.length} — {STEPS[step].label}
        </p>
      </div>
    </div>
  );
}
