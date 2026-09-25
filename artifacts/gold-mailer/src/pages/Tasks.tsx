import { useState } from "react";
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
  DollarSign,
  AlertCircle,
} from "lucide-react";

type Task = { name: string; url: string; earn: number; forNG: boolean };
type Submission = {
  id: number;
  websiteName: string;
  websiteUrl: string;
  proofText: string;
  status: string;
  earnedAmount: number;
  createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/30 px-2.5 py-0.5 rounded-full">
        <CheckCircle2 size={10} /> Approved
      </span>
    );
  if (status === "declined")
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full">
        <XCircle size={10} /> Declined
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded-full">
      <Clock size={10} /> Pending
    </span>
  );
}

function ProofModal({
  task,
  onClose,
  onSubmit,
}: {
  task: Task;
  onClose: () => void;
  onSubmit: (proof: string) => void;
}) {
  const [proof, setProof] = useState("");
  const [step, setStep] = useState<"info" | "proof">("info");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {step === "info" ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#00ff88]/15 flex items-center justify-center">
                <ClipboardList size={20} className="text-[#00ff88]" />
              </div>
              <div>
                <h3 className="font-bold text-white">{task.name}</h3>
                <p className="text-xs text-[#888888]">Earn ${task.earn.toFixed(2)} per completed task</p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-3.5 mb-5">
              <p className="text-xs font-bold text-white flex items-center gap-1 mb-1.5">
                <AlertCircle size={12} className="text-[#00ff88]" /> How it works
              </p>
              <ol className="text-xs text-[#888888] space-y-1.5 list-decimal list-inside">
                <li>Click "Open Website" to visit the task site</li>
                <li>Complete a survey or task on that site</li>
                <li>Come back here and describe what you completed</li>
                <li>Submit and wait for admin approval (24–48h)</li>
                <li>Once approved, ${task.earn.toFixed(2)} is credited to your balance</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-[#262626] text-white hover:bg-white/5"
                onClick={onClose}
              >
                Cancel
              </Button>
              <a href={task.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button
                  className="w-full bg-[#00ff88] text-black font-extrabold hover:bg-[#00dd77]"
                  onClick={() => setStep("proof")}
                >
                  Open Website <ExternalLink size={14} className="ml-1" />
                </Button>
              </a>
            </div>

            {step === "info" && (
              <button
                onClick={() => setStep("proof")}
                className="w-full text-center text-xs text-[#888888] hover:text-[#00ff88] mt-3.5 transition-colors cursor-pointer"
              >
                I already completed this task → Submit proof
              </button>
            )}
          </>
        ) : (
          <>
            <h3 className="font-bold text-white mb-1">Submit Proof</h3>
            <p className="text-xs text-[#888888] mb-4">
              Describe the task you completed on <span className="text-white font-medium">{task.name}</span>
            </p>
            <textarea
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="e.g. Completed a survey about consumer habits. Detailed description or screenshot proof link."
              rows={5}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-[#00ff88] mb-4 placeholder:text-zinc-600"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-[#262626] text-white hover:bg-white/5"
                onClick={() => setStep("info")}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-[#00ff88] text-black font-extrabold hover:bg-[#00dd77]"
                disabled={!proof.trim() || proof.trim().length < 20}
                onClick={() => onSubmit(proof.trim())}
              >
                Submit Proof
              </Button>
            </div>
            <p className="text-xs text-[#888888] text-center mt-2">Minimum 20 characters required</p>
          </>
        )}
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
    mutationFn: async ({ task, proof }: { task: Task; proof: string }) => {
      const res = await fetch("/api/tasks/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteName: task.name, websiteUrl: task.url, proofText: proof }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Task submitted!",
        description: "Awaiting approval. Reward will be credited to your balance upon approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["tasks-my"] });
      setSelectedTask(null);
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setSelectedTask(null);
    },
  });

  const pendingMap: Record<string, boolean> = {};
  const approvedMap: Record<string, boolean> = {};
  for (const s of submissions) {
    if (s.status === "pending") pendingMap[s.websiteName] = true;
    if (s.status === "approved") approvedMap[s.websiteName] = true;
  }

  const totalEarned = submissions
    .filter((s) => s.status === "approved")
    .reduce((sum, s) => sum + s.earnedAmount, 0);

  const generalTasks = tasks.filter((t) => !t.forNG);
  const ngTasks = tasks.filter((t) => t.forNG);
  const isNG = user?.country === "NG" || !user?.country;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#00ff88] selection:text-black">
      {selectedTask && (
        <ProofModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmit={(proof) => submitMutation.mutate({ task: selectedTask, proof })}
        />
      )}
      <Sidebar />
      <main className="pl-0 pt-0">
        <div className="border-b border-[#262626] bg-[#0a0a0a]">
          <div className="max-w-4xl mx-auto px-4 sm:pl-16 pt-6 pb-6">
            <p className="text-[#888888] text-sm mb-1">Earn rewards</p>
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">Total Earned from Tasks</p>
                <p className="text-4xl font-black text-[#00ff88]">${totalEarned.toFixed(2)}</p>
              </div>
              <div className="mb-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] text-xs font-semibold">
                  <DollarSign size={12} />
                  Per approved task
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:pl-16 py-8">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-[#1a1a1a] border border-[#262626] rounded-xl p-1 w-fit">
            {[
              { key: "available", label: "Available Tasks" },
              { key: "history", label: `My Submissions (${submissions.length})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                  activeTab === t.key
                    ? "bg-[#00ff88] text-black"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "available" && (
            <div className="space-y-8">
              {/* General Tasks */}
              <div>
                <h2 className="font-bold text-white text-lg mb-1">Partner & Survey Websites</h2>
                <p className="text-sm text-[#888888] mb-4">Complete tasks, submit proof, and receive earnings</p>
                {tasksLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-20 rounded-xl bg-[#1a1a1a] border border-[#262626] animate-pulse" />
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
                          className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 flex items-center justify-between gap-3 hover:border-[#00ff88]/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{task.name}</p>
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
                                className="h-8 text-xs bg-[#00ff88] text-black font-extrabold hover:bg-[#00dd77]"
                                onClick={() => setSelectedTask(task)}
                              >
                                Start <ChevronRight size={12} />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* NG-specific Tasks */}
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
                          className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 flex items-center justify-between gap-3 hover:border-[#00ff88]/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{task.name}</p>
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
                                className="h-8 text-xs bg-[#00ff88] text-black font-extrabold hover:bg-[#00dd77]"
                                onClick={() => setSelectedTask(task)}
                              >
                                Start <ChevronRight size={12} />
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
                    <div key={i} className="h-20 rounded-xl bg-[#1a1a1a] border border-[#262626] animate-pulse" />
                  ))}
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-16 bg-[#1a1a1a] border border-[#262626] rounded-2xl">
                  <ClipboardList size={40} className="text-[#888888] mx-auto mb-3" />
                  <p className="text-[#888888]">No submissions yet. Complete a task to earn payouts!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((s) => (
                    <div key={s.id} className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-white text-sm">{s.websiteName}</p>
                            <StatusBadge status={s.status} />
                          </div>
                          <p className="text-xs text-[#888888] line-clamp-2">{s.proofText}</p>
                          <p className="text-xs text-[#888888] mt-1">{new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={`text-sm font-black ${
                              s.status === "approved" ? "text-[#00ff88]" : "text-[#888888]"
                            }`}
                          >
                            {s.status === "approved"
                              ? `+$${s.earnedAmount.toFixed(2)}`
                              : `$${s.earnedAmount.toFixed(2)}`}
                          </p>
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
