import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import type { MarketplaceTask } from "@/lib/marketplace";

type Submission = { id: number; taskId: number; title: string; taskType: string; proofText: string; proofUrl: string | null; status: string; amount: number; createdAt: string };

function Status({ status }: { status: string }) {
  const config = status === "approved" ? { icon: CheckCircle2, label: "Approved", className: "text-green-400 bg-green-400/10" } : status === "rejected" ? { icon: XCircle, label: "Rejected", className: "text-red-400 bg-red-400/10" } : { icon: Clock3, label: "Pending", className: "text-amber-300 bg-amber-300/10" };
  const Icon = config.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${config.className}`}><Icon size={12} />{config.label}</span>;
}

export default function Submissions() {
  const { data = [], isLoading } = useQuery<Submission[]>({ queryKey: ["marketplace-submissions"], queryFn: async () => { const response = await fetch("/api/marketplace/submissions", { credentials: "include" }); if (!response.ok) throw new Error("Unable to load submissions"); return response.json(); } });
  return <div className="min-h-screen bg-background"><Sidebar /><main className="px-4 pb-16 pt-20 sm:ml-16 sm:px-8"><div className="mx-auto max-w-4xl"><Link href="/tasks" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Browse tasks</Link><div className="mt-6"><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Your activity</p><h1 className="mt-2 text-4xl font-black">My submissions</h1><p className="mt-2 text-sm text-muted-foreground">Track proof you have sent and what has been approved.</p></div><div className="mt-8 space-y-3">{isLoading ? [1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-white/5 bg-card" />) : data.length === 0 ? <div className="rounded-3xl border border-white/5 bg-card p-12 text-center"><p className="font-bold">No submissions yet</p><p className="mt-2 text-sm text-muted-foreground">Complete a task to see your proof history here.</p><Link href="/tasks" className="mt-5 inline-flex text-sm font-bold text-primary">Browse tasks →</Link></div> : data.map((submission) => <article key={submission.id} className="rounded-2xl border border-white/5 bg-card p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{submission.taskType}</p><h2 className="mt-1 font-black">{submission.title}</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{submission.proofText}</p></div><div className="flex items-center gap-3 sm:flex-col sm:items-end"><Status status={submission.status} /><span className={`font-black ${submission.status === "approved" ? "text-green-400" : "text-muted-foreground"}`}>{submission.status === "approved" ? "+" : ""}${submission.amount.toFixed(2)}</span></div></div><p className="mt-4 text-xs text-muted-foreground">{new Date(submission.createdAt).toLocaleString()}</p></article>)}</div></div></main></div>;
}