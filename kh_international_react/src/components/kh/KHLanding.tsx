import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { About } from "./About";
import { Product } from "./Product";
import { WhyKH } from "./WhyKH";
import { Sustainability } from "./Sustainability";
import { MarketsFrance } from "./MarketsFrance";
import { Quality } from "./Quality";
import { FarmersSection } from "./FarmersSection";
import { Contact } from "./Contact";
import { Footer } from "./Footer";
import { SampleModal } from "./SampleModal";
import { Toaster } from "@/components/ui/sonner";
import { getSectionIdForPath } from "@/lib/site-pages";
import { HEADER_OFFSET_PX, scrollToSectionId } from "@/lib/section-scroll";

export function KHLanding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"sample" | "partner" | "gcms">("sample");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const hasMountedRef = useRef(false);

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    const sectionId = getSectionIdForPath(pathname);
    if (!sectionId) return;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (sectionId === "home") return;

      scrollToSectionId(sectionId, "auto");
      const rafId = window.requestAnimationFrame(() => {
        const target = document.getElementById(sectionId);
        if (!target) return;
        const delta = Math.abs(target.getBoundingClientRect().top - HEADER_OFFSET_PX);
        if (delta > 16) {
          scrollToSectionId(sectionId, "auto");
        }
      });
      return () => window.cancelAnimationFrame(rafId);
    }

    let innerRafId = 0;
    const outerRafId = window.requestAnimationFrame(() => {
      innerRafId = window.requestAnimationFrame(() => {
        scrollToSectionId(sectionId, "smooth");
      });
    });
    return () => {
      window.cancelAnimationFrame(outerRafId);
      if (innerRafId) window.cancelAnimationFrame(innerRafId);
    };
  }, [pathname]);

  function handleOpenModal(type: "sample" | "partner" | "gcms" = "sample") {
    setModalType(type);
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-gold selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to main content
      </a>
      <Nav onOpenSampleModal={handleOpenModal} menuButtonRef={menuButtonRef} />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {/* Page 1 — Home */}
        <Hero onOpenSampleModal={handleOpenModal} />

        {/* Page 2 — About KH International / Our Story */}
        <About />

        {/* Page 3 — Our Vetriver Oil */}
        <Product onOpenSampleModal={handleOpenModal} />

        {/* Page 4 — Why India, Why KH International */}
        <WhyKH />

        {/* Page 5 — Sustainability & Farmer Partnerships */}
        <Sustainability />

        {/* Page 6 — Global Trade & Partnerships (France-Facing & Export) */}
        <MarketsFrance onOpenSampleModal={handleOpenModal} />

        {/* Page 7 — Global Standards & Compliance */}
        <Quality />

        {/* Dedicated Farmers Section (Tamil & English) */}
        <FarmersSection />

        {/* Page 8 — Contact / Trade Inquiry */}
        <Contact />
      </main>
      <Footer />

      {/* Interactive B2B Inquiry & Sample Modal */}
      <SampleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
        returnFocusRef={menuButtonRef}
      />

      {/* Bottom placement keeps toasts clear of the sticky header and the mobile menu toggle. */}
      <Toaster position="bottom-center" />
    </div>
  );
}
