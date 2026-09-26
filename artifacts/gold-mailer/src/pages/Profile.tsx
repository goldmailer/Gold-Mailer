import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Share2,
  CheckCircle2,
  Save,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  FaInstagram,
  FaFacebookF,
  FaTiktok,
  FaYoutube,
  FaXTwitter,
  FaTelegram,
} from "react-icons/fa6";

export default function Profile() {
  const { user, login } = useAuth();
  const { toast } = useToast();

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  const [socials, setSocials] = useState({
    instagram_handle: "",
    facebook_link: "",
    tiktok_handle: "",
    youtube_link: "",
    twitter_handle: "",
    telegram_handle: "",
  });

  useEffect(() => {
    // 1. Preload from current user auth state
    if (user) {
      setSocials((prev) => ({
        instagram_handle: (user as any).instagramHandle || prev.instagram_handle || "",
        facebook_link: (user as any).facebookLink || prev.facebook_link || "",
        tiktok_handle: (user as any).tiktokHandle || prev.tiktok_handle || "",
        youtube_link: (user as any).youtubeLink || prev.youtube_link || "",
        twitter_handle: (user as any).twitterHandle || prev.twitter_handle || "",
        telegram_handle: (user as any).telegramHandle || prev.telegram_handle || "",
      }));
    }

    // 2. Fetch fresh from API
    fetch("/api/user/socials", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSocials({
            instagram_handle: data.instagram_handle || "",
            facebook_link: data.facebook_link || "",
            tiktok_handle: data.tiktok_handle || "",
            youtube_link: data.youtube_link || "",
            twitter_handle: data.twitter_handle || "",
            telegram_handle: data.telegram_handle || "",
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const updateField = (key: keyof typeof socials, value: string) => {
    setSocials((prev) => ({ ...prev, [key]: value }));
  };

  const saveSocialField = async (key: keyof typeof socials, label: string) => {
    setSavingKey(key);
    try {
      // Save to backend database (updates profiles table and users table)
      const res = await fetch("/api/user/socials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: socials[key] }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }

      // Update local auth user state
      if (user) {
        const camelMap: Record<string, string> = {
          instagram_handle: "instagramHandle",
          facebook_link: "facebookLink",
          tiktok_handle: "tiktokHandle",
          youtube_link: "youtubeLink",
          twitter_handle: "twitterHandle",
          telegram_handle: "telegramHandle",
        };
        const prop = camelMap[key];
        login({ ...user, [prop]: socials[key] });
      }

      toast({
        title: `${label} saved`,
        description: "Your social account is linked and ready for task verification.",
      });
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.message || "Could not save account details",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const saveAllSocials = async () => {
    setSavingAll(true);
    try {
      const res = await fetch("/api/user/socials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(socials),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save accounts");
      }

      if (user) {
        login({
          ...user,
          instagramHandle: socials.instagram_handle,
          facebookLink: socials.facebook_link,
          tiktokHandle: socials.tiktok_handle,
          youtubeLink: socials.youtube_link,
          twitterHandle: socials.twitter_handle,
          telegramHandle: socials.telegram_handle,
        });
      }

      toast({
        title: "All social accounts saved",
        description: "Your social profiles have been linked to Task Nest.",
      });
    } catch (err: any) {
      toast({
        title: "Error saving accounts",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingAll(false);
    }
  };

  const fields = [
    {
      key: "instagram_handle" as const,
      label: "Instagram Username",
      icon: FaInstagram,
      iconColor: "text-pink-400",
      iconBg: "bg-pink-500/10 border-pink-500/20",
      placeholder: "@your_instagram or username",
      helper: "Used to verify Instagram follows, likes, and comment tasks.",
    },
    {
      key: "facebook_link" as const,
      label: "Facebook Profile Link",
      icon: FaFacebookF,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10 border-blue-500/20",
      placeholder: "https://facebook.com/yourname",
      helper: "Used to verify Facebook page follows, shares, and comment tasks.",
    },
    {
      key: "tiktok_handle" as const,
      label: "TikTok Username",
      icon: FaTiktok,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/10 border-cyan-500/20",
      placeholder: "@your_tiktok",
      helper: "Used to verify TikTok follows, video likes, and custom comments.",
    },
    {
      key: "youtube_link" as const,
      label: "YouTube Channel Link",
      icon: FaYoutube,
      iconColor: "text-red-400",
      iconBg: "bg-red-500/10 border-red-500/20",
      placeholder: "https://youtube.com/@channel",
      helper: "Used to verify YouTube subscriptions, video watch, and comments.",
    },
    {
      key: "twitter_handle" as const,
      label: "X / Twitter Username",
      icon: FaXTwitter,
      iconColor: "text-zinc-200",
      iconBg: "bg-zinc-700/20 border-zinc-700/30",
      placeholder: "@your_handle",
      helper: "Used to verify X / Twitter follows, retweets, likes, and replies.",
    },
    {
      key: "telegram_handle" as const,
      label: "Telegram Username",
      icon: FaTelegram,
      iconColor: "text-sky-400",
      iconBg: "bg-sky-500/10 border-sky-500/20",
      placeholder: "@your_telegram",
      helper: "Used for instant auto-verification via Telegram Bot API on join tasks.",
    },
  ];

  const linkedCount = Object.values(socials).filter((v) => v && v.trim()).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#00ff88] selection:text-black">
      <Sidebar />
      <main className="px-4 pb-16 pt-20 sm:ml-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-[#888888] hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 text-sm text-[#00ff88] font-bold hover:underline"
            >
              Browse tasks <ExternalLink size={14} />
            </Link>
          </div>

          {/* Profile Overview Card */}
          <div className="rounded-3xl border border-[#262626] bg-[#141414] p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] text-2xl font-black">
                  {user?.firstName?.[0] || user?.email?.[0] || "T"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black">
                      {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "My Profile"}
                    </h1>
                    {user?.isVerified && (
                      <span className="flex items-center gap-1 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 px-2.5 py-0.5 text-xs font-bold text-[#00ff88]">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#888888] mt-1">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-center">
                  <p className="text-xs text-[#888888] font-medium">Social Accounts</p>
                  <p className="text-xl font-black text-[#00ff88]">{linkedCount} / 6</p>
                </div>
              </div>
            </div>
          </div>

          {/* Link Social Accounts Section */}
          <section className="rounded-3xl border border-[#262626] bg-[#141414] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#262626]">
              <div>
                <div className="flex items-center gap-2">
                  <Share2 className="text-[#00ff88]" size={20} />
                  <h2 className="text-xl font-black tracking-tight">Link Your Social Accounts</h2>
                </div>
                <p className="text-sm text-[#888888] mt-1">
                  Connect your accounts to unlock task rewards and allow automatic or instant admin verification.
                </p>
              </div>

              <Button
                onClick={saveAllSocials}
                disabled={savingAll}
                className="bg-[#00ff88] text-black font-extrabold hover:bg-[#00dd77] h-10 px-5 shrink-0"
              >
                <Save size={16} className="mr-1.5" />
                {savingAll ? "Saving..." : "Save All Accounts"}
              </Button>
            </div>

            <div className="mt-8 space-y-6">
              {fields.map(({ key, label, icon: Icon, iconColor, iconBg, placeholder, helper }) => {
                const isLinked = Boolean(socials[key] && socials[key].trim());
                const isSaving = savingKey === key;

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-[#262626] bg-[#0a0a0a] p-5 transition hover:border-[#383838]"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0 md:w-64">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${iconBg} ${iconColor}`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-white truncate">{label}</label>
                            {isLinked && (
                              <span className="text-[10px] bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 px-1.5 py-0.5 rounded font-bold">
                                Linked
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#71717a] truncate">{helper}</p>
                        </div>
                      </div>

                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={socials[key]}
                          onChange={(e) => updateField(key, e.target.value)}
                          placeholder={placeholder}
                          className="w-full rounded-xl border border-[#262626] bg-[#141414] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#00ff88] transition-colors"
                        />
                        <Button
                          size="sm"
                          onClick={() => saveSocialField(key, label)}
                          disabled={isSaving}
                          className="bg-[#1f1f1f] text-white hover:bg-[#00ff88] hover:text-black font-bold border border-[#333333] px-4 h-10 shrink-0 transition-colors"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note banner */}
            <div className="mt-8 rounded-2xl bg-[#00ff88]/5 border border-[#00ff88]/20 p-4 flex items-start gap-3">
              <ShieldCheck className="text-[#00ff88] shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-[#a1a1aa] leading-relaxed">
                <strong className="text-white">Why link your accounts?</strong> Task advertisers require verified usernames to confirm follows, likes, reviews, and comments. For Telegram tasks, linking your handle allows our automated bot system to instantly verify channel joins without waiting!
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
