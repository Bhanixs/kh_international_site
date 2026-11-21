import { useRef, useState } from "react";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Contact } from "./Contact";
import { Footer } from "./Footer";
import { SampleModal } from "./SampleModal";
import { Toaster } from "@/components/ui/sonner";

export function KHLanding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"sample" | "partner" | "gcms">("sample");
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
        <Hero onOpenSampleModal={handleOpenModal} />
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