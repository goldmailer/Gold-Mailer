import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChangePassword, useChangeEmail, useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

const COUNTRIES = [
  { code: "NG", label: "Nigeria (₦)" },
  { code: "US", label: "United States ($)" },
  { code: "UK", label: "United Kingdom (£)" },
  { code: "CA", label: "Canada (C$)" },
];

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [emailForm, setEmailForm] = useState({ newEmail: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: (user as any)?.phone ?? "",
    country: (user as any)?.country ?? "NG",
    gender: user?.gender ?? "",
  });

  const emailMutation = useChangeEmail({
    mutation: {
      onSuccess: () => {
        toast({ title: "Email updated", description: "Your email has been changed successfully." });
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
        toast({ title: "Password changed", description: "Your password has been updated successfully." });
        setPwForm({ currentPassword: "", newPassword: "" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to change password", description: err?.data?.error || err?.message || "Please try again", variant: "destructive" });
      },
    },
  });

  const profileMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        toast({ title: "Profile updated", description: "Your profile details have been saved." });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Failed to update profile", description: err?.data?.error || err?.message || "Please try again", variant: "destructive" });
      },
    },
  });

  const handleProfileSave = () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast({ title: "Name is required", description: "Please enter your first and last name.", variant: "destructive" });
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
        phone: profileForm.phone || undefined,
        avatarUrl: user?.avatarUrl ?? undefined,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 max-w-2xl mx-auto px-4 sm:pl-16 py-8">
        <h1 className="text-2xl font-black mb-1">Account Settings</h1>
        <p className="text-muted-foreground text-sm mb-8">Manage your account details and credentials</p>

        <div className="space-y-6">
          {/* Current email info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Email</p>
            <p className="font-semibold text-foreground">{user?.email}</p>
          </div>

          {/* Profile details */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold">Profile Details</h2>
                <p className="text-xs text-muted-foreground">Update your name, country, and phone number</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">First Name</label>
                  <Input
                    value={profileForm.firstName}
                    onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Last Name</label>
                  <Input
                    value={profileForm.lastName}
                    onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Country</label>
                <Select value={profileForm.country} onValueChange={val => setProfileForm({ ...profileForm, country: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <Input
                  type="tel"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="e.g. +2348012345678"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Gender</label>
                <Select value={profileForm.gender} onValueChange={val => setProfileForm({ ...profileForm, gender: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold"
                onClick={handleProfileSave}
                disabled={profileMutation.isPending}
              >
                {profileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>

          {/* Change email */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Mail size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold">Change Email</h2>
                <p className="text-xs text-muted-foreground">Update your login email address</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">New Email Address</label>
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
                {emailMutation.isPending ? "Updating..." : "Update Email"}
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
                <h2 className="font-bold">Change Password</h2>
                <p className="text-xs text-muted-foreground">Keep your account secure</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    placeholder="Your current password"
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">New Password</label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    placeholder="At least 6 characters"
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
                {pwMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
