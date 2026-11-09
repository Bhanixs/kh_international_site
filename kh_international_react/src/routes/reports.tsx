import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SampleModal } from "@/components/kh/SampleModal";
import { hasDocAccess } from "@/lib/doc-access";
import { Logo } from "@/components/kh/Logo";
import {
  FileText,
  Lock,
  Unlock,
  ExternalLink,
  ShieldCheck,
  Download,
  CheckCircle2,
  ArrowLeft,
  FileCheck2,
  Award,
  Globe2,
  Activity,
} from "lucide-react";

const TITLE = "Technical & Compliance Documents — KH International";
const DESC =
  "Official lab reports, Certificate of Analysis (CoA), Certificate of Origin, MSDS, and Environmental Monitoring documentation for KH International Vetriver Oil.";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: "https://www.khinternational.org.in/reports" },
    ],
    links: [{ rel: "canonical", href: "https://www.khinternational.org.in/reports" }],
  }),
  component: ReportsPage,
});

interface DocumentItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: typeof FileText;
  url: string;
}

const documents: DocumentItem[] = [
  {
    id: "coo",
    title: "Certificate of Origin",
    category: "Export & Trade Documentation",
    description:
      "Issued by the Chamber of Commerce confirming origin from Tamil Nadu, South India for international trade compliance.",
    icon: Globe2,
    url: "https://drive.google.com/file/d/1ilxK-41triF3QH80kNfiS95E80u5C0bj/view?usp=sharing",
  },
  {
    id: "coa",
    title: "Certificate of Analysis (CoA) & GC-MS Report",
    category: "Quality & Purity Testing",
    description:
      "Per-batch laboratory analysis detailing physical-chemical specifications, purity levels, and GC-MS compound breakdown.",
    icon: FileCheck2,
    url: "https://drive.google.com/file/d/1j62MrUs-pVLiStSMGgXkK0s08EYEha6Y/view?usp=sharing",
  },
  {
    id: "test-report",
    title: "Comprehensive Lab Test Report",
    category: "Technical Quality Analysis",
    description:
      "Full laboratory test report providing detailed compositional audit and chemical parameter verification.",
    icon: Award,
    url: "https://drive.google.com/file/d/15jOhlfgu7SD-xt1KAB7Ke69h-alkEw70/view?usp=sharing",
  },
  {
    id: "msds",
    title: "Safety Data Sheet (MSDS / SDS)",
    category: "Safety & Regulatory Compliance",
    description:
      "EU-compliant GHS/CLP formatted Safety Data Sheet detailing handling, storage, hazard identification, and safety guidelines.",
    icon: ShieldCheck,
    url: "https://drive.google.com/file/d/139cHzgOttmjw6F1XoGpqq6CCjkLyiQaQ/view?usp=sharing",
  },
  {
    id: "environmental",
    title: "Environmental Monitoring Service Report",
    category: "Sustainability & Ecological Audit",
    description:
      "Environmental impact, ecological monitoring, and sustainable harvesting verification report.",
    icon: Activity,
    url: "https://drive.google.com/file/d/1pqmkze-rB-n4JEUYzAeTxVPALdgQMGyT/view?usp=sharing",
  },
];

function ReportsPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"sample" | "partner" | "gcms">("gcms");
  // The unlock button disappears after a successful request, so focus returns to the page heading.
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Check if user has submitted the form (a session flag, not access control).
    if (hasDocAccess()) {
      setIsUnlocked(true);
    }
  }, []);

  function handleOpenModal(type: "sample" | "partner" | "gcms" = "gcms") {
    setModalType(type);
    setModalOpen(true);
  }

  function handleUnlockDemo() {
    sessionStorage.setItem("kh_doc_access", "true");
    setIsUnlocked(true);
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-gold selection:text-white flex flex-col justify-between">
      <main className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {/* Top Breadcrumb / Back Navigation */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-forest transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Main Site
            </Link>
          </div>

          {/* Header */}
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-gold bg-gold/10 px-3 py-1 rounded-full mb-3 border border-gold/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Technical Documentation Vault
            </div>
            <div className="flex gap-3 items-center">
              <Logo></Logo>
              <p className="font-serif text-4xl sm:text-5xl leading-tight text-foreground">
                KH International
              </p>
            </div>
            <h1 ref={headingRef} tabIndex={-1} className="font-serif text-4xl sm:text-5xl leading-tight text-foreground outline-none">
              Compliance & Quality Reports Portal
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed font-light">
              Official certificates, laboratory test reports, SDS safety sheets, and environmental auditing documentation for KH International essential vetriver oil exports.
            </p>
          </div>

          {!isUnlocked ? (
            /* Locked State Card */
            <div className="rounded-2xl border border-gold/40 bg-alabaster/70 p-8 sm:p-12 shadow-xl text-center max-w-3xl mx-auto my-10">
              <div className="mx-auto w-16 h-16 rounded-full bg-gold/10 text-gold border border-gold/30 flex items-center justify-center mb-6">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-3xl text-foreground font-normal">
                Restricted Documentation Access
              </h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Official certificates of analysis, test reports, safety sheets, and environmental audits are reserved for verified trade partners and buyers.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => handleOpenModal("gcms")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gold bg-gold px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-white hover:bg-forest hover:border-forest transition-colors rounded-xl shadow-md"
                >
                  <Unlock className="w-4 h-4" /> Submit Inquiry to Unlock Access
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground/80 mt-4">
                Submitting a trade inquiry or sample request automatically unlocks full access to all 5 official reports.
              </p>
            </div>
          ) : (
            /* Unlocked State View */
            <div className="space-y-8">
              {/* Document Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map((doc) => {
                  const IconComp = doc.icon;
                  return (
                    <div
                      key={doc.id}
                      className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs hover:border-gold/60 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-forest/10 border border-forest/20 text-forest flex items-center justify-center shrink-0">
                            <IconComp className="w-6 h-6" />
                          </div>
                        </div>
                        <span className="text-[10px] tracking-widest uppercase font-semibold text-gold block mb-1">
                          {doc.category}
                        </span>
                        <h3 className="font-serif text-2xl font-medium text-foreground">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-2 font-light">
                          {doc.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 border border-gold bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-forest hover:border-forest transition-colors rounded-xl shadow-xs"
                        >
                          <ExternalLink className="w-4 h-4" /> View & Download File
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <SampleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
        returnFocusRef={headingRef}
        // Update the page immediately after a confirmed request, without a reload.
        onSubmitted={() => setIsUnlocked(true)}
      />
    </div>
  );
}
