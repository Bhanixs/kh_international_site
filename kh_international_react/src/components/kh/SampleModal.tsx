import { useState } from "react";
import { X, Download, CheckCircle2, Send, ShieldCheck, Unlock } from "lucide-react";
import { Link } from "@tanstack/react-router";
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
      sessionStorage.setItem("kh_doc_access", "true");
      setLoading(false);
      setSubmitted(true);
      toast.success("Request received! Document access granted.");
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
            <h3 className="font-serif text-3xl text-foreground">Access Granted</h3>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
              Your request has been routed to our export desk (<span className="text-forest font-medium">export@khinternational.org.in</span>).
              You now have full access to view and download all 5 official compliance & technical report files.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link
                to="/reports"
                onClick={onClose}
                className="inline-flex items-center gap-2 border border-gold bg-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-forest transition-colors rounded-lg shadow-sm"
              >
                <Unlock className="w-4 h-4" /> View Technical Reports (5 Files)
              </Link>
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-foreground hover:bg-muted transition-colors rounded-lg"
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
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1 font-semibold">
                    Name / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marie Laurent / Parfums SA"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1 font-semibold">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. France / Canada / USA"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1 font-semibold">
                    Product of Interest
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bulk Vetriver Oil / 100g Sample"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1 font-semibold">
                    Estimated Order Volume
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 25 kg Drum / 5 kg Trial"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1 font-semibold">
                  Message
                </label>
                <input
                  type="text"
                  placeholder="e.g. Target delivery date, Incoterms, or specifications"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none"
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
