import { ShieldCheck, Sprout, Compass, AlertTriangle, Layers, Award } from "lucide-react";

export function WhyKH() {
  return (
    <section id="why-kh" className="border-b border-border/60 bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <span className="text-[11px] tracking-[0.3em] text-gold uppercase block mb-3">
            Strategic Sourcing · Page 4
          </span>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Why India, Why KH International
          </h2>
        </div>

        {/* 3 Core Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Pillar 1 */}
          <div className="group relative rounded-xl border border-border/80 bg-card p-8 transition-all hover:border-gold/60 hover:shadow-xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-forest/10 text-forest group-hover:bg-forest group-hover:text-white transition-colors">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <span className="text-[10px] tracking-[0.25em] text-gold uppercase font-semibold block mb-2">
              Pillar 01
            </span>
            <h3 className="font-serif text-2xl text-foreground mb-4">
              Supply security, not just an alternative source
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Global perfumery has depended on a small number of source regions for vetriver — principally Haiti, Java, and Réunion — and that concentration has become a real vulnerability. Haiti's political and economic instability in particular has repeatedly disrupted supply in recent years. KH International offers what the market currently lacks: a scalable, traceable, quality-consistent source outside that fragile supply concentration.             </p>
          </div>

          {/* Pillar 2 */}
          <div className="group relative rounded-xl border border-border/80 bg-card p-8 transition-all hover:border-gold/60 hover:shadow-xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-forest/10 text-forest group-hover:bg-forest group-hover:text-white transition-colors">
              <Sprout className="h-7 w-7" />
            </div>
            <span className="text-[10px] tracking-[0.25em] text-gold uppercase font-semibold block mb-2">
              Pillar 02
            </span>
            <h3 className="font-serif text-2xl text-foreground mb-4">
              Regenerative by nature, not by marketing claim
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Vetriver is one of the few crops where sustainability and commercial quality point in the same direction. It requires minimal irrigation, tolerates drought, and its root system actively prevents soil erosion — every acre under our cultivation is land that improves rather than depletes while it produces.            </p>
          </div>

          {/* Pillar 3 */}
          <div className="group relative rounded-xl border border-border/80 bg-card p-8 transition-all hover:border-gold/60 hover:shadow-xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-forest/10 text-forest group-hover:bg-forest group-hover:text-white transition-colors">
              <Layers className="h-7 w-7" />
            </div>
            <span className="text-[10px] tracking-[0.25em] text-gold uppercase font-semibold block mb-2">
              Pillar 03
            </span>
            <h3 className="font-serif text-2xl text-foreground mb-4">
              Full traceability & field-level documentation
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Because we manage the relationship with our farmer partners directly — from seedling quality and soil testing through to harvest timing — we can tell you exactly which fields, which season, and which harvest any given batch of oil came from. That traceability is increasingly a requirement for European buyers, not a nice-to-have.            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
