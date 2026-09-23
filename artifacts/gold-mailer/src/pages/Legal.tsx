import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export function Privacy() {
  return <LegalPage title="Privacy Policy"><p>This policy explains how GoldMailer uses information to operate its account, wallet, task marketplace, support, and verification features.</p><h2>Information we collect</h2><p>We may collect your email address, name, country, age or gender information you choose to provide, payment references, bank or payout details you submit, KYC documents, task proofs, support messages, and basic device or activity information needed to protect the service.</p><h2>How we use it</h2><p>We use this information to create and secure your account, verify identity and contact details, review deposits and withdrawals, credit wallet activity, process task submissions, prevent fraud, provide support, and send important service messages. We do not sell your personal information.</p><h2>Payments and retention</h2><p>Payment providers may process payment information under their own privacy policies. GoldMailer keeps account and transaction records for as long as reasonably necessary for security, dispute handling, legal obligations, and service accounting.</p><h2>Your choices</h2><p>You may ask us to access, correct, or delete eligible personal information by contacting 1xemailsupportbox@gmail.com. Some records may need to be retained for security or legal reasons. Never share your password or verification code with anyone.</p></LegalPage>;
}

export function Terms() {
  return <LegalPage title="Terms of Service"><p>By creating or using a GoldMailer account, you agree to these terms, provide accurate information, protect your login details, and use the platform lawfully.</p><h2>Wallets, deposits, and withdrawals</h2><p>GoldMailer has separate earning and advertising wallets. Deposits and withdrawals are requests that may be reviewed before approval. A 20% platform commission is applied to approved user deposits and withdrawals and credited to the platform balance; the net amount is reflected in the user wallet or payout.</p><h2>Tasks and advertising</h2><p>Advertisers must fund tasks with their advertising wallet, follow the task instructions they publish, and provide truthful information. Workers must complete tasks honestly and submit genuine proof. We may reject submissions, pause tasks, or suspend accounts involved in fraud, spam, duplicate activity, or abuse.</p><h2>Verification and account safety</h2><p>We may request email, phone, or identity verification. Verification codes are private and expire after the period shown in the message. Never ask another person for their code or allow anyone else to access your account.</p><h2>Changes and support</h2><p>We may update these terms when the service changes. Continued use after an update means you accept the revised terms. Questions can be sent to 1xemailsupportbox@gmail.com.</p></LegalPage>;
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