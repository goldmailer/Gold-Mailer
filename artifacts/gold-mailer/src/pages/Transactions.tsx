import { useGetTransactions } from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { ArrowDownCircle, ArrowUpCircle, Clock } from "lucide-react";

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/15 text-green-400 border-green-500/30",
    declined: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? styles.pending}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default function Transactions() {
  const { data: transactions, isLoading } = useGetTransactions();

  const deposits = transactions?.filter((t: any) => t.type === "deposit") ?? [];
  const withdrawals = transactions?.filter((t: any) => t.type === "withdrawal") ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 max-w-4xl mx-auto px-4 sm:pl-16 py-8">
        <h1 className="text-2xl font-black mb-1">Transactions</h1>
        <p className="text-muted-foreground text-sm mb-8">Your deposit and withdrawal history</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <Clock size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {deposits.length > 0 && (
              <section>
                <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <ArrowDownCircle size={14} className="text-green-400" /> Deposits
                </h2>
                <div className="space-y-2">
                  {deposits.map((t: any) => (
                    <div key={t.id} data-testid={`row-transaction-${t.id}`}
                      className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                          <ArrowDownCircle size={18} className="text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Deposit</p>
                          <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
                          {t.transactionId && <p className="text-xs text-muted-foreground font-mono">Ref: {t.transactionId}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-green-400" data-testid={`text-amount-${t.id}`}>+{fmt(t.amount)}</p>
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {withdrawals.length > 0 && (
              <section>
                <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <ArrowUpCircle size={14} className="text-destructive" /> Withdrawals
                </h2>
                <div className="space-y-2">
                  {withdrawals.map((t: any) => (
                    <div key={t.id} data-testid={`row-transaction-${t.id}`}
                      className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                          <ArrowUpCircle size={18} className="text-destructive" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Withdrawal</p>
                          <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
                          {t.bankName && <p className="text-xs text-muted-foreground">{t.bankName} — {t.accountNumber}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-foreground" data-testid={`text-amount-${t.id}`}>-{fmt(t.amount)}</p>
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
