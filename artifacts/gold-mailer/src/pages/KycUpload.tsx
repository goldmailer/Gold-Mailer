import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, Upload, AlertTriangle, CheckCircle, ChevronRight,
  FileImage, ArrowLeft, IdCard, Fingerprint, BookOpen, Check, Camera
} from "lucide-react";

const STEPS = ["Requirements", "Choose ID", "Upload Photo"];

const ID_TYPES = [
  {
    value: "nin",
    label: "NIN",
    sublabel: "National Identity Number",
    description: "Your NIN slip or National ID card issued by NIMC",
    icon: Fingerprint,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/40",
  },
  {
    value: "voters_card",
    label: "Voters Card",
    sublabel: "INEC Permanent Voter's Card",
    description: "Your PVC (Permanent Voter's Card) issued by INEC",
    icon: IdCard,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/40",
  },
  {
    value: "passport",
    label: "Passport",
    sublabel: "International Passport",
    description: "Valid Nigerian international passport (must not be expired)",
    icon: BookOpen,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/40",
  },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              i < current ? "bg-primary text-primary-foreground" :
              i === current ? "bg-primary text-primary-foreground ring-4 ring-primary/25" :
              "bg-card border-2 border-border text-muted-foreground"
            }`}>
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === current ? "text-primary" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
        ))}
        {/* connector lines */}
      </div>
      <div className="relative h-1 bg-border rounded-full mx-4">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function KycUpload() {
  const [, setLocation] = useLocation();
  const { updateUser } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [idType, setIdType] = useState("");
  const [preview, setPreview] = useState<string>("");
  const [imageData, setImageData] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Upload an image under 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreview(result);
      setImageData(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!idType) { toast({ title: "Select an ID type", variant: "destructive" }); return; }
    if (!imageData) { toast({ title: "Upload your ID photo", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idType, idImageUrl: imageData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      updateUser({ kycStatus: "pending" } as any);
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="w-24 h-24 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center">
              <CheckCircle size={44} className="text-green-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Check size={14} className="text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-black mb-2">KYC Submitted!</h1>
          <p className="text-muted-foreground mb-1">Your identity document is now under review.</p>
          <p className="text-muted-foreground text-sm mb-6">We verify all submissions within <strong className="text-foreground">24–48 hours</strong>. You'll receive an email once approved.</p>

          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5 mb-6 text-left space-y-3">
            <p className="font-bold text-sm text-primary">What happens next?</p>
            {[
              "Our team reviews your document",
              "You get an email with the result",
              "If approved, your $20 bonus is instantly credited",
              "Full platform access is unlocked",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-2">
              <AlertTriangle size={14} /> While you wait
            </p>
            <p className="text-sm text-muted-foreground">
              Make sure to add your bank card. The name on your card must match your ID exactly.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => setLocation("/dashboard")} className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold">
              Go to Dashboard <ChevronRight size={16} className="ml-1" />
            </Button>
            <Button variant="outline" onClick={() => setLocation("/add-card")} className="w-full">
              Add Bank Card Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <span className="text-primary font-black text-xl tracking-widest">GOLDMAILER</span>
          </div>
          <h1 className="text-2xl font-black mb-1">Identity Verification</h1>
          <p className="text-muted-foreground text-sm">Complete KYC to unlock full access + $20 bonus</p>
        </div>

        <StepBar current={step} />

        {/* Step 0 — Requirements */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-black text-lg mb-4">Before you start</h2>

              <div className="space-y-3 mb-6">
                {[
                  { ok: true, text: "Have a clear, well-lit photo of your ID" },
                  { ok: true, text: "Your full name on the ID must match your account name" },
                  { ok: true, text: "Your bank card name must also match your ID" },
                  { ok: true, text: "The entire document must be visible — no cut-off edges" },
                  { ok: false, text: "Blurry, dark, or partially covered photos will be declined" },
                  { ok: false, text: "Editing or altering the document is strictly prohibited" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.ok ? "bg-green-500/20" : "bg-red-500/20"}`}>
                      {item.ok
                        ? <Check size={11} className="text-green-400" />
                        : <span className="text-red-400 font-black text-xs">✕</span>
                      }
                    </div>
                    <p className={`text-sm ${item.ok ? "text-foreground" : "text-muted-foreground"}`}>{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <p className="text-xs font-bold text-primary mb-1">Accepted Documents</p>
                <div className="flex gap-2 flex-wrap">
                  {["NIN", "Voters Card", "International Passport"].map(doc => (
                    <span key={doc} className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">{doc}</span>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={() => setStep(1)} className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold">
              Continue <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

        {/* Step 1 — Choose ID */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-black text-lg mb-1">Choose your ID type</h2>
              <p className="text-sm text-muted-foreground mb-4">Select the document you'll be uploading</p>

              <div className="space-y-3">
                {ID_TYPES.map(t => {
                  const Icon = t.icon;
                  const selected = idType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setIdType(t.value)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                        selected
                          ? `${t.bg} ${t.border} shadow-sm`
                          : "bg-background border-border hover:border-border/80"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? t.bg : "bg-muted"}`}>
                        <Icon size={20} className={selected ? t.color : "text-muted-foreground"} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-sm ${selected ? t.color : "text-foreground"}`}>{t.label}</p>
                          <span className="text-xs text-muted-foreground">{t.sublabel}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                      </div>
                      {selected && (
                        <div className={`w-5 h-5 rounded-full ${t.bg.replace("/10", "")} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Check size={12} className={t.color} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1 py-5 gap-2">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!idType}
                className="flex-1 bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
              >
                Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Upload Photo */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="font-black text-lg mb-1">Upload your {ID_TYPES.find(t => t.value === idType)?.label} photo</h2>
                <p className="text-sm text-muted-foreground">Make sure the photo is clear and all text is readable</p>
              </div>

              {/* Upload area */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors relative overflow-hidden ${
                  preview
                    ? "border-primary/50 bg-primary/5 h-52"
                    : "border-border hover:border-primary/40 bg-background hover:bg-primary/5 h-44"
                }`}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="ID preview" className="max-h-full max-w-full object-contain p-2 rounded-lg" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                        <Camera size={16} className="text-white" />
                        <span className="text-sm font-bold text-white">Change photo</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <FileImage size={28} className="text-primary" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Click to upload photo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or HEIC — max 5MB</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Upload size={14} className="text-primary" />
                      <span className="text-xs text-primary font-medium">Browse files</span>
                    </div>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

              {preview && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                  <CheckCircle size={16} className="text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-400">Photo uploaded</p>
                    <p className="text-xs text-muted-foreground">Looks good? You can tap the image above to change it.</p>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-background border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Submission summary</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">ID Type</span>
                  <span className="text-xs font-bold text-primary">{ID_TYPES.find(t => t.value === idType)?.label}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-foreground">Photo</span>
                  <span className={`text-xs font-bold ${imageData ? "text-green-400" : "text-muted-foreground"}`}>
                    {imageData ? "Ready" : "Not uploaded"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 py-5 gap-2">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!imageData || submitting}
                className="flex-1 bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} /> Submit for Review
                  </span>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Your ID is encrypted and only reviewed by our admin team
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
