import { useState } from "react";
import { X, Download, CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface SampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "sample" | "partner" | "gcms";
}

export function SampleModal({ isOpen, onClose, defaultType = "sample" }: SampleModalProps) {
  const [requestType, setRequestType] = useState<"sample" | "partner" | "gcms">(defaultType);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Request received! Our international trade team will reach out within 24 hours.");
    }, 600);
  }

  function handleReset() {
    setSubmitted(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-background border border-gold/40 shadow-2xl p-6 sm:p-8 my-8 text-foreground animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-forest/10 border border-forest/30 flex items-center justify-center text-forest mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-serif text-3xl text-foreground">Thank You</h3>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
              Your request has been routed directly to our global trade desk (<span className="text-forest font-medium">export@khinternational.org.in</span>).
              A representative will email you our latest GC-MS Report, Certificate of Analysis (CoA), and sample dispatch terms.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => {
                  toast.info("Downloading KH_Vetriver_Oil_GCMS_Spec_Sheet.pdf");
                }}
                className="inline-flex items-center gap-2 border border-gold bg-gold/10 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-gold hover:bg-gold hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" /> Download Tech Spec Sheet (PDF)
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-foreground hover:bg-muted transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="border-b border-border/60 pb-4 mb-6">
              <span className="text-[11px] tracking-[0.3em] text-gold uppercase block mb-1">
                KH International · B2B Direct
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-foreground">
                {requestType === "gcms"
                  ? "Download Specification & GC-MS Report"
                  : requestType === "partner"
                  ? "Become a Global Trade Partner"
                  : "Request Export-Grade Vetriver Oil Sample"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Direct from Villupuram, Tamil Nadu to your lab or formulation facility.
              </p>
            </div>

            {/* Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6 bg-alabaster p-1.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setRequestType("sample")}
                className={`py-2 px-3 text-xs font-medium uppercase tracking-wider rounded-md transition-all ${
                  requestType === "sample"
                    ? "bg-forest text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sample (100g)
              </button>
              <button
                type="button"
                onClick={() => setRequestType("partner")}
                className={`py-2 px-3 text-xs font-medium uppercase tracking-wider rounded-md transition-all ${
                  requestType === "partner"
                    ? "bg-forest text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Trade Partner
              </button>
              <button
                type="button"
                onClick={() => setRequestType("gcms")}
                className={`py-2 px-3 text-xs font-medium uppercase tracking-wider rounded-md transition-all ${
                  requestType === "gcms"
                    ? "bg-forest text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                GC-MS & Specs
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jean Dupont"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maison de Fragrance SA"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="purchasing@company.com"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Country / Market *
                  </label>
                  <select
                    required
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  >
                    <option value="France">France</option>
                    <option value="Canada">Canada</option>
                    <option value="EU - Other">Europe / EU Other</option>
                    <option value="India">India</option>
                    <option value="USA">USA / North America</option>
                    <option value="Other">Other Global Location</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Target Volume Requirement
                  </label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none">
                    <option value="Sample Pack">Sample Pack (100g vial)</option>
                    <option value="5 kg Trial Drum">5 kg Trial Aluminium Drum</option>
                    <option value="25 kg Standard Drum">25 kg Standard HDPE/UN Drum</option>
                    <option value="180 kg ISO Drum">180 kg ISO Steel Drum</option>
                    <option value="1+ Tonne Annual Contract">1+ Tonne Annual Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Primary Application
                  </label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none">
                    <option value="Fine Fragrance">Fine Fragrance & Perfumery</option>
                    <option value="Cosmetics & Skincare">Cosmetics & Skincare Formulation</option>
                    <option value="Aromatherapy">Aromatherapy & Wellness</option>
                    <option value="Siddha & Ayurveda">Siddha & Traditional Medicine</option>
                    <option value="Beverages">Functional Beverages</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                  Specific Requirements / Lab Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Mention any specific GC-MS parameters, optical rotation range, REACH compliance needs, or delivery timelines."
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
                <span>Full traceability & batch-specific CoA documentation included with every dispatch.</span>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-gold border border-gold px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-forest hover:border-forest transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    "Processing..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Inquiry
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
