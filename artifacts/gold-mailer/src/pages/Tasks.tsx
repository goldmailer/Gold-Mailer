import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  ClipboardList,
  ChevronRight,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  User,
  Share2,
} from "lucide-react";

type Task = { id?: number; name: string; url: string; earn: number; forNG: boolean; taskType?: string };
type Submission = {
  id: number;
  taskId?: number;
  websiteName: string;
  websiteUrl: string;
  screenshotUrl?: string;
  submittedUsername?: string;
  proofText: string;
  status: string;
  earnedAmount: number;
  telegramVerified?: string;
  createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/30 px-2.5 py-0.5 rounded-full">
        <CheckCircle2 size={10} /> Approved
      </span>
    );
  if (status === "rejected" || status === "declined")
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full">
        <XCircle size={10} /> Rejected
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded-full">
      <Clock size={10} /> Pending
    </span>
  );
}

function SubmitProofModal({
  task,
  onClose,
  onSubmit,
  isPending,
}: {
  task: Task;
  onClose: () => void;
  onSubmit: (data: { screenshotUrl: string; submittedUsername: string; proofText: string }) => void;
  isPending: boolean;
}) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-fill username if available from social handles
  const getDefaultUsername = () => {
    const t = (task.name + " " + (task.taskType || "")).toLowerCase();
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

  const isTelegram = task.name.toLowerCase().includes("telegram") ||
    task.url.toLowerCase().includes("t.me") ||
    Boolean(task.taskType && task.taskType.toLowerCase().includes("telegram"));

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotUrl) {
      alert("Screenshot upload is required.");
      return;
    }
    if (!submittedUsername.trim()) {
      alert("Please enter the username you used for this task.");
      return;
    }
    onSubmit({
      screenshotUrl,
      submittedUsername: submittedUsername.trim(),
      proofText: proofText.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl my-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] bg-[#00ff88]/10 px-2 py-0.5 rounded">
              Submit Proof
            </span>
            <h2 className="text-xl font-black text-white mt-1.5">{task.name}</h2>
          </div>
          <p className="text-xl font-black text-[#00ff88] shrink-0">+${task.earn.toFixed(2)}</p>
        </div>

        {isTelegram && (
          <div className="mb-5 rounded-2xl bg-sky-500/10 border border-sky-500/20 p-3.5 text-xs text-sky-300 leading-relaxed">
            <strong>Telegram Bot Auto-Check:</strong> We verify Telegram tasks automatically using the Telegram Bot API. Ensure your submitted username matches your Telegram handle.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Upload Screenshot (Required) */}
          <div>
            <label className="block text-sm font-bold text-white mb-1.5">
              Upload Screenshot <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-[#888888] mb-2.5">
              Proof image showing you completed the task (e.g. joined group, liked, or posted comment).
            </p>

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
                  className="max-h-48 mx-auto rounded-xl object-contain border border-[#262626]"
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
                className="rounded-2xl border-2 border-dashed border-[#333333] hover:border-[#00ff88] bg-[#0a0a0a] p-6 text-center cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-2 text-[#00ff88]">
                  <Upload size={20} />
                </div>
                <p className="text-sm font-bold text-white">Click to upload screenshot</p>
                <p className="text-xs text-[#71717a] mt-1">PNG, JPG, or WEBP (Max 5MB)</p>
              </div>
            )}
          </div>

          {/* Enter your username used for task */}
          <div>
            <label className="block text-sm font-bold text-white mb-1.5">
              Enter your username used for task <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={submittedUsername}
                onChange={(e) => setSubmittedUsername(e.target.value)}
                placeholder="e.g. @john_doe or your profile name"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00ff88] transition-colors"
                required
              />
            </div>
            <p className="text-[11px] text-[#71717a] mt-1">
              Enter the exact account name or handle used on this website/social platform.
            </p>
          </div>

          {/* Additional details */}
          <div>
            <label className="block text-sm font-bold text-white mb-1.5">
              Additional notes (optional)
            </label>
            <textarea
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="Any extra details, reference link, or comment text you posted..."
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00ff88] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent border-[#262626] text-white hover:bg-white/5 h-12"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#00ff88] text-black font-black hover:bg-[#00dd77] h-12"
              disabled={isPending || !screenshotUrl || !submittedUsername.trim()}
            >
              {isPending ? "Submitting..." : "Submit Proof"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "history">("available");

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["tasks-list"],
    queryFn: async () => {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: submissions = [], isLoading: subsLoading } = useQuery<Submission[]>({
    queryKey: ["tasks-my"],
    queryFn: async () => {
      const res = await fetch("/api/tasks/my", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { screenshotUrl: string; submittedUsername: string; proofText: string }) => {
      if (!selectedTask) throw new Error("No task selected");
      const res = await fetch("/api/tasks/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          websiteName: selectedTask.name,
          websiteUrl: selectedTask.url,
          screenshotUrl: data.screenshotUrl,
          submittedUsername: data.submittedUsername,
          proofText: data.proofText,
          taskType: selectedTask.taskType,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Submission failed");
      return resData;
    },
    onSuccess: (data) => {
      if (data.autoApproved) {
        toast({
          title: "Task Verified & Approved! 🎉",
          description: data.message || "Reward has been credited to your balance instantly.",
        });
      } else {
        toast({
          title: "Proof submitted!",
          description: "Awaiting admin approval. Reward will be added to your balance upon approval.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks-my"] });
      setSelectedTask(null);
    },
    onError: (e: any) => {
      toast({ title: "Submission Error", description: e.message, variant: "destructive" });
    },
  });

  const handleStartTask = (task: Task) => {
    // 1. Check social account requirement
    const t = (task.name + " " + (task.taskType || "")).toLowerCase();
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
    if (task.url) {
      window.open(task.url, "_blank", "noopener,noreferrer");
    }

    // 3. Open Submit Proof modal
    setSelectedTask(task);
  };

  const pendingMap: Record<string, boolean> = {};
  const approvedMap: Record<string, boolean> = {};
  for (const s of submissions) {
    if (s.status === "pending") pendingMap[s.websiteName] = true;
    if (s.status === "approved") approvedMap[s.websiteName] = true;
  }

  const generalTasks = tasks.filter((t) => !t.forNG);
  const ngTasks = tasks.filter((t) => t.forNG);
  const isNG = user?.country === "NG" || !user?.country;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#00ff88] selection:text-black">
      <Sidebar />

      {selectedTask && (
        <SubmitProofModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmit={(data) => submitMutation.mutate(data)}
          isPending={submitMutation.isPending}
        />
      )}

      <main className="px-4 pb-16 pt-20 sm:ml-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">
                Tasks & Earnings
              </p>
              <h1 className="text-3xl font-black mt-1">Earn by Completing Tasks</h1>
              <p className="text-sm text-[#888888] mt-1">
                Click Start Task to open in a new tab, complete the task, and submit proof to get paid.
              </p>
            </div>

            <Link href="/profile">
              <Button variant="outline" className="border-[#262626] bg-[#141414] text-white hover:border-[#00ff88]/50 gap-2">
                <Share2 size={15} className="text-[#00ff88]" /> Link Social Accounts
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-[#141414] p-1.5 rounded-xl border border-[#262626] w-fit">
            <button
              onClick={() => setActiveTab("available")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                activeTab === "available"
                  ? "bg-[#00ff88] text-black"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              Available Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#00ff88] text-black"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              My Submissions ({submissions.length})
            </button>
          </div>

          {activeTab === "available" && (
            <div className="space-y-8">
              <div>
                <h2 className="font-bold text-white text-lg mb-1">Partner & Micro-Tasks</h2>
                <p className="text-sm text-[#888888] mb-4">Complete actions and submit screenshot proof</p>

                {tasksLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-20 rounded-xl bg-[#141414] border border-[#262626] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {generalTasks.map((task) => {
                      const isPending = pendingMap[task.name];
                      const isApproved = approvedMap[task.name];

                      return (
                        <div
                          key={task.name}
                          className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[#00ff88]/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">{task.name}</p>
                            <p className="text-xs text-[#888888] truncate">{task.url.replace("https://", "")}</p>
                            <p className="text-xs text-[#00ff88] font-bold mt-1">+${task.earn.toFixed(2)}</p>
                          </div>
                          <div className="shrink-0">
                            {isApproved ? (
                              <span className="text-xs text-[#00ff88] font-bold flex items-center gap-1">
                                <CheckCircle2 size={12} /> Done
                              </span>
                            ) : isPending ? (
                              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                                <Clock size={12} /> Pending
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                className="h-9 px-3.5 text-xs bg-[#00ff88] text-black font-black hover:bg-[#00dd77]"
                                onClick={() => handleStartTask(task)}
                              >
                                Start Task <ExternalLink size={12} className="ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {isNG && ngTasks.length > 0 && (
                <div>
                  <h2 className="font-bold text-white text-lg mb-1">Regional Micro-Tasks</h2>
                  <p className="text-sm text-[#888888] mb-4">Exclusive tasks for your region</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ngTasks.map((task) => {
                      const isPending = pendingMap[task.name];
                      const isApproved = approvedMap[task.name];

                      return (
                        <div
                          key={task.name}
                          className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[#00ff88]/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">{task.name}</p>
                            <p className="text-xs text-[#888888] truncate">
                              {task.url.replace("https://www.", "").replace("https://", "")}
                            </p>
                            <p className="text-xs text-[#00ff88] font-bold mt-1">+${task.earn.toFixed(2)}</p>
                          </div>
                          <div className="shrink-0">
                            {isApproved ? (
                              <span className="text-xs text-[#00ff88] font-bold flex items-center gap-1">
                                <CheckCircle2 size={12} /> Done
                              </span>
                            ) : isPending ? (
                              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                                <Clock size={12} /> Pending
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                className="h-9 px-3.5 text-xs bg-[#00ff88] text-black font-black hover:bg-[#00dd77]"
                                onClick={() => handleStartTask(task)}
                              >
                                Start Task <ExternalLink size={12} className="ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <h2 className="font-bold text-white text-lg mb-4">My Task Submissions</h2>
              {subsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-[#141414] border border-[#262626] animate-pulse" />
                  ))}
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-16 bg-[#141414] border border-[#262626] rounded-2xl">
                  <ClipboardList size={40} className="text-[#888888] mx-auto mb-3" />
                  <p className="text-[#888888]">No submissions yet. Complete a task to start earning!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((s) => (
                    <div key={s.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <p className="font-bold text-white text-sm">{s.websiteName}</p>
                            <StatusBadge status={s.status} />
                            {s.telegramVerified === "verified" && (
                              <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded font-bold">
                                Telegram Bot Verified
                              </span>
                            )}
                          </div>
                          {s.submittedUsername && (
                            <p className="text-xs text-white/90 mb-1">
                              <span className="text-[#888888]">Username:</span> {s.submittedUsername}
                            </p>
                          )}
                          <p className="text-xs text-[#888888] line-clamp-2">{s.proofText}</p>
                          <p className="text-xs text-[#71717a] mt-1.5">
                            {new Date(s.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={`text-base font-black ${
                              s.status === "approved" ? "text-[#00ff88]" : "text-[#888888]"
                            }`}
                          >
                            {s.status === "approved"
                              ? `+$${s.earnedAmount.toFixed(2)}`
                              : `$${s.earnedAmount.toFixed(2)}`}
                          </p>
                          {s.screenshotUrl && (
                            <a
                              href={s.screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-[#00ff88] hover:underline block mt-1"
                            >
                              View Screenshot
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
