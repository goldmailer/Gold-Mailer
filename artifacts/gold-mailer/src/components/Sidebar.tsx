import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, CreditCard, TrendingUp, ArrowDownCircle,
  ArrowUpCircle, List, Settings, LogOut, Menu, X, User, Users, ArrowLeftRight, ClipboardList, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportChat } from "@/components/SupportChat";
import { useLanguage } from "@/i18n/LanguageContext";

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/cards", label: t("nav.viewCards"), icon: CreditCard },
    { href: "/stake", label: t("nav.stakeNow"), icon: TrendingUp },
    { href: "/deposit", label: t("nav.deposit"), icon: ArrowDownCircle },
    { href: "/withdraw", label: t("nav.withdraw"), icon: ArrowUpCircle },
    { href: "/transactions", label: t("nav.transactions"), icon: List },
    { href: "/exchange", label: "Exchange", icon: ArrowLeftRight },
    { href: "/tasks", label: "Earn Tasks", icon: ClipboardList },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/referrals", label: t("nav.referrals"), icon: Users },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        logout();
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
    },
  });

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "?";

  return (
    <>
      <button
        data-testid="button-menu-open"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-card border border-border text-foreground hover:bg-accent transition-colors"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <span className="text-primary font-bold text-lg tracking-widest">GOLDMAILER</span>
          <button
            data-testid="button-menu-close"
            onClick={() => setOpen(false)}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <Link href="/settings" onClick={() => setOpen(false)}>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "Profile"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <User size={14} className="text-muted-foreground shrink-0" />
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              <div
                data-testid={`nav-${href.replace("/", "")}`}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-all ${
                  location === href
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon size={18} className={location === href ? "text-primary" : ""} />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            data-testid="button-logout"
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut size={18} />
            <span>{t("nav.logOut")}</span>
          </Button>
        </div>
      </aside>

      <SupportChat />
    </>
  );
}
