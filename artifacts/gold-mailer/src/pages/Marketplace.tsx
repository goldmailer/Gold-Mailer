import { useMemo, useState, useRef } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Search,
  X,
  ExternalLink,
  Upload,
  AlertCircle,
  Share2,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { AdUnit } from "@/components/AdUnit";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { taskTypes, type MarketplaceTask } from "@/lib/marketplace";

function SubmissionModal({
  task,
  onClose,
}: {
  task: MarketplaceTask;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const client = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-fill username if available from social handles
  const getDefaultUsername = () => {
    const t = (task.title + " " + task.taskType).toLowerCase();
    if (t.includes("telegram")) return (user as any)?.telegramHandle || "";
    if (t.includes("instagram")) return (user as any)?.instagramHandle || "";
    if (t.includes("tiktok")) return (user as any)?.tiktokHandle || "";
    if (t.includes("twitter") || t.includes(" x ")) return (user as any)?.twitterHandle || "";
    if (t.includes("youtube")) return (user as any)?.youtubeLink || "";
    if (t.includes("facebook")) return (user as any)?.facebookLink || "";
    return "";
  };

  const [submittedUsername, setSubmittedUsername] = useState(getDefaultUsername());
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [proofText, setProofText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isTelegram = task.title.toLowerCase().includes("telegram") ||
    task.taskType.toLowerCase().includes("telegram") ||
    (task.taskUrl && task.taskUrl.includes("t.me"));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setScreenshotUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!screenshotUrl) throw new Error("Upload Screenshot is required to verify task completion");
      if (!submittedUsername.trim()) throw new Error("Please enter your username used for this task");

      const response = await fetch(`/api/tasks/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          websiteName: task.title,
          websiteUrl: task.taskUrl || task.url || `https://tasknest.name.ng/tasks/${task.id}`,
          screenshotUrl,
          submittedUsername: submittedUsername.trim(),
          proofText: proofText.trim() || `Submitted by ${submittedUsername.trim()}`,
          taskType: task.taskType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not submit proof");
      return data;
    },
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ["tasks-my"] });
      client.invalidateQueries({ queryKey: ["marketplace-submissions"] });
      if (data.autoApproved) {
        toast({
          title: "Telegram Verified! 🎉",
          description: data.message || "Reward has been credited to your balance.",
        });
      } else {
        toast({
          title: "Proof submitted",
          description: "Your submission is waiting for admin review.",
        });
      }
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-[#262626] bg-[#141414] p-6 sm:p-8 shadow-2xl my-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">{task.taskType}</p>
            <h2 className="mt-1 text-2xl font-black text-white">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 p-4 text-sm text-zinc-300">
          <span className="font-black text-[#00ff88]">Earn ${task.payPerTask.toFixed(2)}</span> when your proof is approved. {task.description}
        </div>

        {isTelegram && (
          <div className="mt-4 rounded-xl bg-sky-500/10 border border-sky-500/20 p-3 text-xs text-sky-300 leading-relaxed">
            <strong>Telegram Bot Auto-Check:</strong> We verify Telegram joins automatically. Make sure your Telegram handle below is accurate.
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* Upload Screenshot (Required) */}
          <div>
            <label className="block text-sm font-bold text-white mb-1.5">
              Upload Screenshot <span className="text-red-400">*</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {imagePreview ? (
              <div className="relative rounded-2xl border border-[#00ff88]/40 bg-[#0a0a0a] p-3 text-center">
                <img
                  src={imagePreview}
                  alt="Proof preview"
                  className="max-h-44 mx-auto rounded-xl object-contain border border-[#262626]"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs font-bold text-[#00ff88] hover:underline"
                >
                  Change screenshot
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-[#333333] hover:border-[#00ff88] bg-[#0a0a0a] p-5 text-center cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-2 text-[#00ff88]">
                  <Upload size={18} />
                </div>
                <p className="text-sm font-bold text-white">Click to upload screenshot</p>
                <p className="text-xs text-[#71717a] mt-0.5">Required proof of task completion</p>
              </div>
            )}
          </div>

          {/* Enter your username used for task */}
          <div>
            <label className="block text-sm font-bold text-white mb-1.5">
              Enter your username used for task <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={submittedUsername}
              onChange={(e) => setSubmittedUsername(e.target.value)}
              placeholder="e.g. @your_username"
              className="w-full rounded-xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#00ff88]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-white mb-1.5">Proof details (optional)</label>
            <textarea
              value={proofText}
              onChange={(event) => setProofText(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-[#262626] bg-[#0a0a0a] p-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#00ff88]"
              placeholder="Any comments, details, or profile link..."
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-[#262626] bg-transparent text-white hover:bg-white/5 h-12"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#00ff88] text-black font-extrabold hover:bg-[#00dd77] h-12"
            disabled={!screenshotUrl || !submittedUsername.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Submitting..." : "Submit Proof"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [selected, setSelected] = useState<MarketplaceTask | null>(null);

  const { data: tasks = [], isLoading, isError } = useQuery<MarketplaceTask[]>({
    queryKey: ["marketplace-tasks", search, type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (type) params.set("type", type);
      const response = await fetch(`/api/marketplace/tasks?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load tasks");
      return response.json();
    },
  });

  const handleStartTask = (task: MarketplaceTask) => {
    // 1. Social account requirement check
    const t = (task.title + " " + task.taskType).toLowerCase();
    if (t.includes("telegram") && !(user as any)?.telegramHandle) {
      toast({
        title: "Telegram account required",
        description: "Please link your Telegram username in your Profile before performing this task.",
        variant: "destructive",
      });
      return;
    }
    if (t.includes("instagram") && !(user as any)?.instagramHandle) {
      toast({
        title: "Instagram account required",
        description: "Please link your Instagram username in your Profile before performing this task.",
        variant: "destructive",
      });
      return;
    }
    if (t.includes("tiktok") && !(user as any)?.tiktokHandle) {
      toast({
        title: "TikTok account required",
        description: "Please link your TikTok username in your Profile before performing this task.",
        variant: "destructive",
      });
      return;
    }
    if ((t.includes("twitter") || t.includes(" x ")) && !(user as any)?.twitterHandle) {
      toast({
        title: "X / Twitter account required",
        description: "Please link your X / Twitter username in your Profile before performing this task.",
        variant: "destructive",
      });
      return;
    }

    // 2. Open task link in new tab
    const targetUrl = task.taskUrl || task.url || "https://tasknest.name.ng";
    window.open(targetUrl, "_blank", "noopener,noreferrer");

    // 3. Open Submit Proof modal
    setSelected(task);
  };

  const grouped = useMemo(
    () =>
      tasks.reduce<MarketplaceTask[][]>((groups, task, index) => {
        if (index % 4 === 0) groups.push([]);
        groups[groups.length - 1].push(task);
        return groups;
      }, []),
    [tasks]
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#00ff88] selection:text-black">
      <Sidebar />
      {selected && <SubmissionModal task={selected} onClose={() => setSelected(null)} />}

      <main className="px-4 pb-16 pt-20 sm:ml-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00ff88]">
                Earn online
              </p>
              <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight">Browse Tasks</h1>
              <p className="mt-1.5 text-sm text-[#888888]">
                Click Start Task to open in a new tab, complete the instructions, and submit screenshot proof.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/profile">
                <Button variant="outline" className="border-[#262626] bg-[#141414] text-white hover:border-[#00ff88]/50 gap-2">
                  <Share2 size={15} className="text-[#00ff88]" /> Link Social Accounts
                </Button>
              </Link>
              <Link href="/post-task">
                <Button className="bg-[#00ff88] text-black font-extrabold hover:bg-[#00dd77]">
                  Post a task <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[#262626] bg-[#141414] p-3 md:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-[#0a0a0a] px-3">
              <Search size={17} className="text-[#888888]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks, comments, follows, reviews..."
                className="w-full bg-transparent py-3 text-sm text-white placeholder:text-zinc-600 outline-none"
              />
            </div>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded-xl border border-[#262626] bg-[#0a0a0a] px-3 py-3 text-sm text-white outline-none md:w-72"
            >
              <option value="">All task types & comments</option>
              {taskTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-8 space-y-8">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-48 animate-pulse rounded-2xl border border-[#262626] bg-[#141414]" />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center text-sm text-red-300">
                Tasks could not be loaded. Try again shortly.
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-2xl border border-[#262626] bg-[#141414] p-12 text-center">
                <p className="font-bold text-white text-lg">No tasks match that search.</p>
                <p className="mt-2 text-sm text-[#888888]">
                  Browse our partner tasks or check back soon for new user campaigns.
                </p>
                <Link href="/post-task">
                  <Button className="mt-4 bg-[#00ff88] text-black font-extrabold hover:bg-[#00dd77]">
                    Post a new task
                  </Button>
                </Link>
              </div>
            ) : (
              grouped.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {group.map((task) => (
                      <article
                        key={task.id}
                        className="group rounded-2xl border border-[#262626] bg-[#141414] p-5 transition hover:-translate-y-0.5 hover:border-[#00ff88]/35"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <span className="rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#00ff88]">
                              {task.taskType}
                            </span>
                            <h2 className="mt-3 truncate text-lg font-black text-white">{task.title}</h2>
                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#888888]">
                              {task.description}
                            </p>
                          </div>
                          <p className="shrink-0 text-xl font-black text-[#00ff88]">
                            ${task.payPerTask.toFixed(2)}
                          </p>
                        </div>
                        <div className="mt-5 flex items-center justify-between border-t border-[#262626] pt-4 text-xs text-[#888888]">
                          <span>{task.workersNeeded - task.workersCompleted} spots left</span>
                          <span className="flex items-center gap-1">
                            <Clock3 size={13} /> Screenshot proof
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleStartTask(task)}
                            className="bg-[#00ff88] text-black font-extrabold hover:bg-[#00dd77] gap-1"
                          >
                            Start Task <ExternalLink size={12} />
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                  {groupIndex < grouped.length - 1 && (
                    <AdUnit placement="general" zoneId={import.meta.env.VITE_MONETAG_ZONE_FEED || "284730"} label="Sponsored task" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
