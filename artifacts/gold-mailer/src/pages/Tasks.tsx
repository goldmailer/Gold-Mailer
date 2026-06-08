import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  ExternalLink, CheckCircle2, Clock, XCircle, ClipboardList,
  ChevronRight, DollarSign, AlertCircle
} from "lucide-react";

type Task = { name: string; url: string; earn: number; forNG: boolean };
type Submission = {
  id: number; websiteName: string; websiteUrl: string;
  proofText: string; status: string; earnedAmount: number; createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={10} /> Approved
    </span>
  );
  if (status === "declined") return (
    <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">
      <XCircle size={10} /> Declined
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-full">
      <Clock size={10} /> Pending
    </span>
  );
}

function ProofModal({ task, onClose, onSubmit }: {
  task: Task; onClose: () => void;
  onSubmit: (proof: string) => void;
}) {
  const [proof, setProof] = useState("");
  const [step, setStep] = useState<"info" | "proof">("info");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {step === "info" ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <ClipboardList size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold">{task.name}</h3>
                <p className="text-xs text-muted-foreground">Earn ${task.earn.toFixed(2)} per completed task</p>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-5">
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1 mb-1">
                <AlertCircle size={12} /> How it works
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Click "Open Website" to visit the task site</li>
                <li>Complete a survey or task on that site</li>
                <li>Come back here and describe what you completed</li>
                <li>Submit and wait for admin approval (24–48h)</li>
                <li>Once approved, ${task.earn.toFixed(2)} is credited to your balance</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <a href={task.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full bg-primary text-primary-foreground" onClick={() => setStep("proof")}>
                  Open Website <ExternalLink size={14} className="ml-1" />
                </Button>
              </a>
            </div>
            {step === "info" && (
              <button
                onClick={() => setStep("proof")}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary mt-3 transition-colors"
              >
                I already completed this task → Submit proof
              </button>
            )}
          </>
        ) : (
          <>
            <h3 className="font-bold mb-1">Submit Proof</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Describe the task you completed on <span className="text-primary font-medium">{task.name}</span>
            </p>
            <textarea
              value={proof}
              onChange={e => setProof(e.target.value)}
              placeholder="e.g. Completed a 5-question survey about consumer habits. Screenshot link: https://... or describe what you did in detail."
              rows={5}
              className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("info")}>Back</Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground"
                disabled={!proof.trim() || proof.trim().length < 20}
                onClick={() => onSubmit(proof.trim())}
              >
                Submit Proof
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Minimum 20 characters required</p>
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
      toast({ title: "Task submitted!", description: "Awaiting admin approval. You'll earn $0.70 once approved." });
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

  const totalEarned = submissions.filter(s => s.status === "approved").reduce((sum, s) => sum + s.earnedAmount, 0);

  const generalTasks = tasks.filter(t => !t.forNG);
  const ngTasks = tasks.filter(t => t.forNG);
  const isNG = user?.country === "NG" || !user?.country;

  return (
    <div className="min-h-screen bg-background">
      {selectedTask && (
        <ProofModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmit={(proof) => submitMutation.mutate({ task: selectedTask, proof })}
        />
      )}
      <Sidebar />

      <main className="pl-0 pt-0">
        <div className="border-b border-border bg-card/30">
          <div className="max-w-4xl mx-auto px-4 sm:pl-16 pt-6 pb-6">
            <p className="text-muted-foreground text-sm mb-1">Earn money</p>
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Earned from Tasks</p>
                <p className="text-4xl font-black text-primary">${totalEarned.toFixed(2)}</p>
              </div>
              <div className="mb-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium">
                  <DollarSign size={12} />
                  $0.70 per approved task
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:pl-16 py-8">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-card/50 border border-border rounded-xl p-1 w-fit">
            {[
              { key: "available", label: "Available Tasks" },
              { key: "history", label: `My Submissions (${submissions.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "available" && (
            <div className="space-y-8">
              {/* General Tasks */}
              <div>
                <h2 className="font-bold text-lg mb-1">Survey & Earning Websites</h2>
                <p className="text-sm text-muted-foreground mb-4">Complete surveys and tasks, earn $0.70 per approved submission</p>
                {tasksLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />)}</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {generalTasks.map(task => {
                      const isPending = pendingMap[task.name];
                      const isApproved = approvedMap[task.name];
                      return (
                        <div key={task.name} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{task.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{task.url.replace("https://", "")}</p>
                            <p className="text-xs text-green-400 font-bold mt-1">+${task.earn.toFixed(2)}</p>
                          </div>
                          <div className="shrink-0">
                            {isApproved ? (
                              <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                                <CheckCircle2 size={12} /> Done
                              </span>
                            ) : isPending ? (
                              <span className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                                <Clock size={12} /> Pending
                              </span>
                            ) : (
                              <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground"
                                onClick={() => setSelectedTask(task)}>
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
                  <h2 className="font-bold text-lg mb-1">Nigerian Micro-Task Sites</h2>
                  <p className="text-sm text-muted-foreground mb-4">Exclusive tasks for Nigerian accounts</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ngTasks.map(task => {
                      const isPending = pendingMap[task.name];
                      const isApproved = approvedMap[task.name];
                      return (
                        <div key={task.name} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{task.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{task.url.replace("https://www.", "").replace("https://", "")}</p>
                            <p className="text-xs text-green-400 font-bold mt-1">+${task.earn.toFixed(2)}</p>
                          </div>
                          <div className="shrink-0">
                            {isApproved ? (
                              <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                                <CheckCircle2 size={12} /> Done
                              </span>
                            ) : isPending ? (
                              <span className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                                <Clock size={12} /> Pending
                              </span>
                            ) : (
                              <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground"
                                onClick={() => setSelectedTask(task)}>
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
              <h2 className="font-bold text-lg mb-4">My Task Submissions</h2>
              {subsLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />)}</div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <ClipboardList size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No submissions yet. Complete a task to earn $0.70!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map(s => (
                    <div key={s.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-sm">{s.websiteName}</p>
                            <StatusBadge status={s.status} />
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{s.proofText}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-sm font-black ${s.status === "approved" ? "text-green-400" : "text-muted-foreground"}`}>
                            {s.status === "approved" ? `+$${s.earnedAmount.toFixed(2)}` : `$${s.earnedAmount.toFixed(2)}`}
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
