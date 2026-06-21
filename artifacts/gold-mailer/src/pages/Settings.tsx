import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChangePassword, useChangeEmail, useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, User, Globe, Phone, ShieldCheck } from "lucide-react";
import { useLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from "@/i18n/LanguageContext";
import { ALL_COUNTRIES } from "@/lib/countries";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language, setLanguage } = useLanguage();

  const [emailForm, setEmailForm] = useState({ newEmail: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    country: "NG",
    gender: "",
  });

  // Phone verification state
  const [smsStatus, setSmsStatus] = useState<{ phoneVerified: boolean; phone: string | null } | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneOtpStep, setPhoneOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneInfo, setPhoneInfo] = useState("");

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        country: (user as any)?.country ?? "NG",
        gender: user.gender ?? "",
      });
    }
  }, [user?.id, user?.firstName, user?.lastName]);

  useEffect(() => {
    fetch("/api/sms/status", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setSmsStatus(d);
          if (d.phoneVerified) {
            setPhoneOtpStep("verified");
            setPhoneInput(d.phone ?? "");
          } else if (d.phone) {
            setPhoneInput(d.phone);
          }
        }
      })
      .catch(() => {});
  }, []);

  const requestPhoneOtp = async () => {
    setPhoneError("");
    setPhoneInfo("");
    if (!phoneInput.trim()) {
      setPhoneError("Enter your phone number with country code, e.g. +2348012345678");
      return;
    }
    setPhoneSending(true);
    try {
      const res = await fetch("/api/sms/verify/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneError(data.error ?? "Failed to send code"); return; }
      setPhoneOtpStep("sent");
      setPhoneInfo("A 6-digit code was sent to your phone. Enter it below.");
    } catch { setPhoneError("Network error. Please try again."); }
    finally { setPhoneSending(false); }
  };

  const confirmPhoneOtp = async () => {
    setPhoneError("");
    if (!phoneOtp.trim()) { setPhoneError("Enter the code you received."); return; }
    setPhoneSending(true);
    try {
      const res = await fetch("/api/sms/verify/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: phoneOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneError(data.error ?? "Invalid code. Try again."); return; }
      setPhoneOtpStep("verified");
      setSmsStatus({ phoneVerified: true, phone: data.phone });
      setPhoneInput(data.phone);
      setPhoneInfo("");
      toast({ title: "Phone verified!", description: "Your phone number has been verified successfully." });
    } catch { setPhoneError("Network error. Please try again."); }
    finally { setPhoneSending(false); }
  };

  const emailMutation = useChangeEmail({
    mutation: {
      onSuccess: () => {
        toast({ title: t("settings.changeEmail"), description: "Your email has been changed successfully." });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setEmailForm({ newEmail: "" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to update email", description: err?.data?.error || err?.message || "Please try again", variant: "destructive" });
      },
    },
  });

  const pwMutation = useChangePassword({
    mutation: {
      onSuccess: () => {
        toast({ title: t("settings.changePassword") });
        setPwForm({ currentPassword: "", newPassword: "" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to change password", description: err?.data?.error || err?.message || "Please try again", variant: "destructive" });
      },
    },
  });

  const profileMutation = useUpdateProfile({
    mutation: {
      onSuccess: (data: any) => {
        toast({ title: "Profile saved!", description: "Your profile has been updated." });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        if (data?.id) updateUser(data);
      },
      onError: (err: any) => {
        toast({ title: "Failed to update profile", description: err?.data?.error || err?.message || "Please try again", variant: "destructive" });
      },
    },
  });

  const handleProfileSave = () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast({ title: "First and last name are required", variant: "destructive" });
      return;
    }
    profileMutation.mutate({
      data: {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        middleName: (user as any)?.middleName ?? undefined,
        age: user?.age ?? undefined,
        gender: profileForm.gender || undefined,
        country: profileForm.country,
        avatarUrl: user?.avatarUrl ?? undefined,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 max-w-2xl mx-auto px-4 sm:pl-16 py-8">
        <h1 className="text-2xl font-black mb-1">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm mb-8">{t("settings.subtitle")}</p>

        <div className="space-y-6">
          {/* Account info summary */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Account Info</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("settings.currentEmail")}</span>
              <span className="font-semibold text-sm">{user?.email}</span>
            </div>
            {user?.firstName && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="font-semibold text-sm">{user.firstName} {user.lastName ?? ""}</span>
              </div>
            )}
            {(user as any)?.country && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Country</span>
                <span className="font-semibold text-sm">{ALL_COUNTRIES.find(c => c.code === (user as any).country)?.name ?? (user as any).country}</span>
              </div>
            )}
            {smsStatus?.phone && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="font-semibold text-sm flex items-center gap-1.5">
                  {smsStatus.phone}
                  {smsStatus.phoneVerified && <ShieldCheck size={13} className="text-green-400" />}
                </span>
              </div>
            )}
          </div>

          {/* Language */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Globe size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold">{t("settings.language")}</h2>
                <p className="text-xs text-muted-foreground">{t("settings.languageSubtitle")}</p>
              </div>
            </div>
            <Select
              value={language}
              onValueChange={(val) => {
                setLanguage(val as any);
                toast({ title: t("settings.languageSaved") });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_NAMES[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Profile details */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold">{t("settings.profileDetails")}</h2>
                <p className="text-xs text-muted-foreground">{t("settings.profileSubtitle")}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("settings.firstName")}</label>
                  <Input
                    value={profileForm.firstName}
                    onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    placeholder={t("settings.firstName")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("settings.lastName")}</label>
                  <Input
                    value={profileForm.lastName}
                    onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    placeholder={t("settings.lastName")}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t("settings.country")}</label>
                <Select value={profileForm.country} onValueChange={val => setProfileForm({ ...profileForm, country: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.country")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ALL_COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t("settings.gender")}</label>
                <Select value={profileForm.gender} onValueChange={val => setProfileForm({ ...profileForm, gender: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.gender")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t("settings.male")}</SelectItem>
                    <SelectItem value="female">{t("settings.female")}</SelectItem>
                    <SelectItem value="other">{t("settings.other")}</SelectItem>
                    <SelectItem value="prefer_not_to_say">{t("settings.preferNotToSay")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold"
                onClick={handleProfileSave}
                disabled={profileMutation.isPending}
              >
                {profileMutation.isPending ? t("settings.saving") : t("settings.saveProfile")}
              </Button>
            </div>
          </div>

          {/* Phone Number & Verification */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Phone size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold">Phone Number</h2>
                <p className="text-xs text-muted-foreground">Add and verify your phone for 2-way SMS messaging</p>
              </div>
              {phoneOtpStep === "verified" && (
                <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                  <ShieldCheck size={12} /> Verified
                </span>
              )}
            </div>

            {phoneError && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {phoneError}
              </div>
            )}
            {phoneInfo && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                {phoneInfo}
              </div>
            )}

            {phoneOtpStep === "verified" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                  <ShieldCheck size={18} className="text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-400">{phoneInput}</p>
                    <p className="text-xs text-muted-foreground">Phone number verified</p>
                  </div>
                </div>
                <button
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => { setPhoneOtpStep("idle"); setPhoneInput(""); setPhoneOtp(""); setPhoneError(""); setPhoneInfo(""); setSmsStatus(null); }}
                >
                  Change phone number
                </button>
              </div>
            ) : phoneOtpStep === "sent" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">6-Digit Code</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={phoneOtp}
                    onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={e => { if (e.key === "Enter") confirmPhoneOtp(); }}
                    className="font-mono text-center text-xl tracking-widest"
                    autoFocus
                  />
                </div>
                <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold" onClick={confirmPhoneOtp} disabled={phoneSending}>
                  <ShieldCheck size={16} className="mr-2" />
                  {phoneSending ? "Verifying..." : "Confirm Code"}
                </Button>
                <button
                  className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => { setPhoneOtpStep("idle"); setPhoneOtp(""); setPhoneInfo(""); setPhoneError(""); }}
                >
                  Use a different number
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+2348012345678"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") requestPhoneOtp(); }}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Include country code, e.g. +234 (Nigeria), +1 (USA), +44 (UK)</p>
                </div>
                <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold" onClick={requestPhoneOtp} disabled={phoneSending}>
                  {phoneSending ? "Sending..." : "Send Verification Code"}
                </Button>
              </div>
            )}
          </div>

          {/* Change email */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Mail size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold">{t("settings.changeEmail")}</h2>
                <p className="text-xs text-muted-foreground">{t("settings.changeEmailSubtitle")}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t("settings.newEmail")}</label>
                <Input
                  type="email"
                  value={emailForm.newEmail}
                  onChange={e => setEmailForm({ newEmail: e.target.value })}
                  placeholder="newemail@example.com"
                />
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold"
                onClick={() => emailMutation.mutate({ data: emailForm })}
                disabled={!emailForm.newEmail || emailMutation.isPending}
              >
                {emailMutation.isPending ? t("settings.updating") : t("settings.updateEmail")}
              </Button>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Lock size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold">{t("settings.changePassword")}</h2>
                <p className="text-xs text-muted-foreground">{t("settings.changePasswordSubtitle")}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t("settings.currentPassword")}</label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    placeholder={t("settings.currentPassword")}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t("settings.newPassword")}</label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    placeholder={t("settings.newPassword")}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold"
                onClick={() => pwMutation.mutate({ data: pwForm })}
                disabled={!pwForm.currentPassword || !pwForm.newPassword || pwMutation.isPending}
              >
                {pwMutation.isPending ? t("settings.updating") : t("settings.updatePassword")}
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
