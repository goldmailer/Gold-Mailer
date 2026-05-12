import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChangePassword, useChangeEmail, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, Check } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [emailForm, setEmailForm] = useState({ newEmail: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const emailMutation = useChangeEmail({
    mutation: {
      onSuccess: () => {
        toast({ title: "Email updated", description: "Your email has been changed successfully." });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setEmailForm({ newEmail: "" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to update email", description: err?.response?.data?.error || "Please try again", variant: "destructive" });
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
        toast({ title: "Failed to change password", description: err?.response?.data?.error || "Please try again", variant: "destructive" });
      },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16 pt-16 max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-1">Account Settings</h1>
        <p className="text-muted-foreground text-sm mb-8">Manage your account credentials</p>

        <div className="space-y-6">
          {/* Current email info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Email</p>
            <p className="font-semibold text-foreground" data-testid="text-current-email">{user?.email}</p>
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
                  data-testid="input-new-email"
                />
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold"
                onClick={() => emailMutation.mutate({ data: emailForm })}
                disabled={!emailForm.newEmail || emailMutation.isPending}
                data-testid="button-change-email"
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
                    data-testid="input-current-password"
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
                    data-testid="input-new-password"
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
                data-testid="button-change-password"
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
