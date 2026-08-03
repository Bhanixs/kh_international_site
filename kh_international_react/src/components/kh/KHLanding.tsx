import { useState } from "react";
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

export function KHLanding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"sample" | "partner" | "gcms">("sample");

  function handleOpenModal(type: "sample" | "partner" | "gcms" = "sample") {
    setModalType(type);
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-gold selection:text-white">
      <Nav onOpenSampleModal={handleOpenModal} />
      <main>
        {/* Page 1 — Home */}
        <Hero onOpenSampleModal={handleOpenModal} />

        {/* Page 2 — About KH International / Our Story */}
        <About />

        {/* Page 3 — Our Vetiver Oil */}
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
      />

      <Toaster position="top-center" />
    </div>
  );
}