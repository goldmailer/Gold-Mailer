import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export function Privacy() {
  return <LegalPage title="Privacy Policy"><p>GoldMailer collects the information needed to create and secure your account, process deposits and withdrawals, provide support, and prevent abuse.</p><h2>Information we use</h2><p>This may include your email address, profile details, transaction references, support messages, and technical information needed to keep the service reliable. We do not sell personal information.</p><h2>Payments and security</h2><p>Payment providers process payment data according to their own policies. GoldMailer stores only the transaction information needed to reconcile your account. Keep your password private and contact support if you notice suspicious activity.</p><h2>Your choices</h2><p>You may request account information or ask us to correct or delete information where applicable by contacting support at 1xemailsupportbox@gmail.com.</p></LegalPage>;
}

export function Terms() {
  return <LegalPage title="Terms of Service"><p>By using GoldMailer, you agree to use the service lawfully, provide accurate account information, and keep your login details secure.</p><h2>Wallet activity</h2><p>Deposits and withdrawals may be reviewed before approval. Requests that appear fraudulent, duplicated, or inconsistent with the account may be held or declined while we investigate.</p><h2>Acceptable use</h2><p>Do not attempt to bypass access controls, misuse payment callbacks, submit false information, or interfere with another user’s account. We may suspend accounts involved in abuse.</p><h2>Changes and support</h2><p>We may update these terms as the service changes. Continued use after an update means you accept the revised terms. Questions can be sent to 1xemailsupportbox@gmail.com.</p></LegalPage>;
}

function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Back to GoldMailer</Link>
        <article className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/10 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">GoldMailer</p>
          <h1 className="mt-3 text-4xl font-black">{title}</h1>
          <div className="legal-copy mt-8">{children}</div>
        </article>
      </div>
    </main>
  );
}