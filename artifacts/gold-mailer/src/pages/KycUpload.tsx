import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Upload, AlertTriangle, CheckCircle, ChevronRight, FileImage } from "lucide-react";

const ID_TYPES = [
  { value: "nin", label: "NIN (National Identity Number)", description: "National ID slip or card" },
  { value: "voters_card", label: "Voters Card", description: "INEC Voters Card" },
  { value: "passport", label: "International Passport", description: "Valid Nigerian passport" },
];

export default function KycUpload() {
  const [, setLocation] = useLocation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

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
      toast({ title: "File too large", description: "Please upload an image under 5MB", variant: "destructive" });
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
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black mb-3">KYC Submitted!</h1>
          <p className="text-muted-foreground mb-2">Your ID has been submitted for review. We'll verify it within 24–48 hours.</p>
          <p className="text-muted-foreground text-sm mb-8">Once approved, your <span className="text-primary font-bold">$20 bonus</span> will be credited and you'll have full access.</p>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} /> While you wait — Add your bank card
            </p>
            <p className="text-sm text-muted-foreground">
              Make sure to add your bank card for withdrawals. The name on your card must match the name on your ID.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation("/add-card")}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
            >
              Add Bank Card <ChevronRight size={16} className="ml-1" />
            </Button>
            <Button variant="outline" onClick={() => setLocation("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/dashboard">
            <span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span>
          </Link>
          <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mt-4 mb-3">
            <ShieldCheck size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Verify Your Identity</h1>
          <p className="text-muted-foreground text-sm">Upload a government-issued ID to verify your Nigerian account</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <p className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-1">
            <AlertTriangle size={16} /> Important Notice
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>The name on your ID must match your account name exactly</li>
            <li>The name on your bank card must also match your ID</li>
            <li>Upload a clear, readable photo of your document</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          {/* ID Type Selection */}
          <div>
            <label className="text-sm font-bold mb-3 block">Select ID Type</label>
            <div className="space-y-2">
              {ID_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setIdType(t.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    idType === t.value
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border hover:border-primary/40"
                  }`}
                >
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ID Image Upload */}
          <div>
            <label className="text-sm font-bold mb-3 block">Upload ID Photo</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                preview ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 bg-background"
              }`}
            >
              {preview ? (
                <img src={preview} alt="ID preview" className="max-h-36 max-w-full object-contain rounded-lg" />
              ) : (
                <>
                  <FileImage size={32} className="text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Click to upload ID photo</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG — max 5MB</p>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            {preview && (
              <button
                type="button"
                onClick={() => { setPreview(""); setImageData(""); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-xs text-muted-foreground hover:text-foreground mt-2 flex items-center gap-1"
              >
                <Upload size={12} /> Change photo
              </button>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!idType || !imageData || submitting}
            className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold"
          >
            {submitting ? "Submitting..." : "Submit for Verification"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your ID is securely stored and only reviewed by our admin team.
        </p>
      </div>
    </div>
  );
}
