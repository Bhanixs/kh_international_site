import heroImg from "@/assets/hero-image.jpeg";
import { Award, Globe, Users, ShieldCheck, ArrowRight, FileCheck2, ExternalLink, FileText } from "lucide-react";

interface HeroProps {
  onOpenSampleModal?: (type?: "sample" | "partner" | "gcms") => void;
}

const trustItems = [
  {
    icon: Award,
    title: "Founded in 2012",
    detail: "Over a decade building rural livelihoods through vetriver",
  },
  {
    icon: Globe,
    title: "Active Canada Exporter",
    detail: "Now building our France & Europe trade partnerships",
  },
  {
    icon: Users,
    title: "900+ Women Empowered",
    detail: "Direct livelihoods across partner farming & root craft",
  },
  {
    icon: ShieldCheck,
    title: "100% Full Traceability",
    detail: "From planted root to laboratory-verified distilled oil",
  },
];

export function Hero({ onOpenSampleModal }: HeroProps) {
  return (
    <section id="home" className="border-b border-border/60 bg-background overflow-hidden relative">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-16 pb-12 lg:grid-cols-5 lg:gap-16 lg:px-10 lg:pt-24 lg:pb-20 items-center">
        {/* Left Headline Column */}
        <div className="flex flex-col justify-center lg:col-span-3">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="h-px w-8 bg-gold inline-block" />
            <span className="text-[11px] tracking-[0.3em] font-semibold text-gold uppercase">
              KH International · Tamil Nadu, South India
            </span>
          </div>

          <h1 className="font-serif text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[4.5rem] font-normal">
            India's Vetriver, Grown with Purpose. Distilled for the World.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground font-light">
            KH International is a vertically integrated vetriver oil producer from Tamil Nadu, South India — from farmer partnership and cultivation through to steam-distilled oil, ready for perfumery, cosmetics, and wellness markets worldwide.
          </p>

          {/* Primary Call to Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onOpenSampleModal?.("sample")}
              className="inline-flex items-center justify-center gap-3 border border-gold bg-gold px-8 py-4 text-[12px] font-medium tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-forest hover:border-forest shadow-md hover:shadow-xl"
            >
              <span>Request a Sample</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenSampleModal?.("partner")}
              className="inline-flex items-center justify-center border border-forest/40 bg-transparent px-8 py-4 text-[12px] font-medium tracking-[0.2em] text-forest uppercase transition-all duration-300 hover:bg-forest hover:text-white"
            >
              Become a Trade Partner
            </button>
          </div>
        </div>

        {/* Right Hero Image Card */}
        <div className="lg:col-span-2 relative">
          <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-2xl">
            <img
              src={heroImg}
              alt="Golden steam-distilled vetriver essential oil droplet with botanical root detail"
              width={1200}
              height={1500}
              className="h-[480px] w-full object-cover lg:h-[580px] transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
              <span className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium mb-1">
                Pure Steam Distillation
              </span>
              <h3 className="font-serif text-2xl">Chrysopogon zizanioides</h3>
              <p className="text-xs text-white/80 mt-1">100% Pure & Natural Vetriver Essential Oil · Tamil Nadu Origin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Strip Below the Fold (One Line Each / 4 Grid) */}
      <div className="border-t border-border/60 bg-alabaster/80 py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustItems.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-background/60 border border-border/40 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center text-forest shrink-0 mt-0.5">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center mt-4 mb-6">
        <h2 className="border border-forest/40 bg-gold/10 p-4 rounded-lg text-gold font-serif text-xl font-semibold">
          Our Certifications & Reports
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 items-center justify-center max-w-2xl mx-auto w-full px-4">
        <a
          href="https://drive.google.com/file/d/1ilxK-41triF3QH80kNfiS95E80u5C0bj/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 border border-gold bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-forest transition-colors rounded-xl shadow-xs w-full text-center"
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Certificate of Origin</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
        </a>
        <a
          href="https://drive.google.com/file/d/1j62MrUs-pVLiStSMGgXkK0s08EYEha6Y/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 border border-forest bg-forest px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-gold transition-colors rounded-xl shadow-xs w-full text-center"
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Certificate of Analysis (COA)</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
        </a>
        <a
          href="https://drive.google.com/file/d/15jOhlfgu7SD-xt1KAB7Ke69h-alkEw70/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 border border-gold bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-forest transition-colors rounded-xl shadow-xs w-full text-center"
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Test Report</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
        </a>
        <a
          href="https://drive.google.com/file/d/139cHzgOttmjw6F1XoGpqq6CCjkLyiQaQ/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 border border-forest bg-forest px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-gold transition-colors rounded-xl shadow-xs w-full text-center"
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>MSDS</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
        </a>
      </div>
    </section>
  );
}