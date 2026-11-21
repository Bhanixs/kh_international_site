import { useRef, useState, createContext, useContext, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { SampleModal } from "./SampleModal";
import { Breadcrumbs } from "./Breadcrumbs";
import { Toaster } from "@/components/ui/sonner";
import { type SitePageItem, findSitePage } from "@/lib/site-pages";

export const ModalContext = createContext<(type?: "sample" | "partner" | "gcms") => void>(() => {});
export const useSampleModal = () => useContext(ModalContext);

interface SubPageLayoutProps {
  page: SitePageItem;
  children?: ReactNode;
  render?: (openModal: (type?: "sample" | "partner" | "gcms") => void) => ReactNode;
}

export function SubPageLayout({ page, children, render }: SubPageLayoutProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"sample" | "partner" | "gcms">("sample");
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function handleOpenModal(type: "sample" | "partner" | "gcms" = "sample") {
    setModalType(type);
    setModalOpen(true);
  }

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: page.navLabel },
  ];

  const relatedPages = page.relatedPaths
    .map((p) => findSitePage(p))
    .filter((p): p is SitePageItem => Boolean(p));

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-gold selection:text-white flex flex-col justify-between">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to main content
      </a>

      <div>
        <Nav onOpenSampleModal={handleOpenModal} menuButtonRef={menuButtonRef} />

        {/* Top Breadcrumb Bar */}
        <div className="border-b border-border/40 bg-alabaster/50 py-3">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>

        <main id="main-content" tabIndex={-1} className="outline-none">
          <ModalContext.Provider value={handleOpenModal}>
            {render ? render(handleOpenModal) : children}
          </ModalContext.Provider>

          {/* Related Pages Section */}
          {relatedPages.length > 0 && (
            <section className="border-t border-border/60 bg-alabaster/40 py-16">
              <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                  <div>
                    <span className="text-[10px] tracking-[0.25em] text-gold uppercase font-semibold block mb-1">
                      Explore KH International
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
                      Related Sections & Portals
                    </h2>
                  </div>
                  <Link
                    to="/"
                    className="text-xs uppercase tracking-wider text-forest font-semibold hover:text-gold transition-colors inline-flex items-center gap-1.5"
                  >
                    View Main Overview <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPages.map((rel) => (
                    <Link
                      key={rel.slug}
                      to={rel.path}
                      className="group rounded-xl border border-border bg-card p-6 shadow-sm hover:border-gold/60 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] tracking-[0.2em] text-gold uppercase font-semibold block mb-1.5">
                          Section
                        </span>
                        <h3 className="font-serif text-xl text-foreground group-hover:text-forest transition-colors mb-2">
                          {rel.navLabel}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {rel.description}
                        </p>
                      </div>
                      <span className="mt-4 pt-3 border-t border-border/50 text-xs font-semibold text-forest group-hover:text-gold inline-flex items-center gap-1">
                        Explore {rel.navLabel} <ArrowRight size={12} />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <Footer />

      {/* Interactive B2B Inquiry & Sample Modal */}
      <SampleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
        returnFocusRef={menuButtonRef}
      />

      <Toaster position="bottom-center" />
    </div>
  );
}
