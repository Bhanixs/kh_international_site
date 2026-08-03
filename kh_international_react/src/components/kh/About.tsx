import aboutImg from "@/assets/about-sourcing-2.jpeg";
import { Info, CheckCircle2, ShieldCheck } from "lucide-react";

const stats = [
  {
    value: "2012",
    label: "Founded",
    detail: "Over a decade of continuous operation in Villupuram, Tamil Nadu",
  },
  {
    value: "500+",
    label: "Women in Farming",
    detail: "Directly empowered in regenerative vetiver cultivation",
  },
  {
    value: "100+",
    label: "Acres Cultivated",
    detail: "Partner farmland under low-water, soil-restoring agriculture",
  },
  {
    value: "400+",
    label: "Women in Craft",
    detail: "Artisans handweaving mats, screens & root fragrance products",
  },
];

export function About() {
  return (
    <section id="about" className="border-b border-border/60 bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Image & Visual Card */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-forest">
              <img
                src={aboutImg}
                alt="Hands cradling freshly harvested vetiver roots in Villupuram, Tamil Nadu"
                width={1200}
                height={1400}
                loading="lazy"
                className="h-full min-h-[520px] w-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end text-white">
                <span className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold mb-1">
                  Villupuram, Tamil Nadu · Est. 2012
                </span>
                <h3 className="font-serif text-2xl">Rooted in Purpose & Regenerative Agriculture</h3>
                <p className="text-xs text-white/80 mt-1 max-w-md">
                  Organizing farming communities around low-water vetiver to build resilient livelihoods and prevent soil erosion.
                </p>
              </div>
            </div>
          </div>

          {/* Story & Copy Content */}
          <div className="flex flex-col justify-center">
            <span className="mb-4 text-[11px] tracking-[0.3em] font-semibold text-gold uppercase">
              Our Story · Page 2
            </span>
            <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl font-normal">
              About KH International
            </h2>

            <div className="mt-6 space-y-6 text-base leading-relaxed text-muted-foreground font-light">
              <p>
                Founded in 2012 in Villupuram, Tamil Nadu, KH International began with a simple conviction: that vetiver — a hardy, unglamorous grass most farmers overlooked — could become the foundation of a fairer, more resilient rural economy. Vetiver asks for almost nothing: little water, no chemical dependency, and a root system that holds soil together where erosion would otherwise win. What it gives back, when a farming community is organized around it properly, is a great deal.
              </p>
              <p>
                What started as a partnership with a handful of local farming families has grown, over more than a decade, into a structured livelihood network. Today, more than 500 women are directly engaged in vetiver farming across our partner network, cultivating over 100 acres of farmland using regenerative, low-water practices. Alongside that farming partnership, we built a second, parallel program around traditional vetiver root craft — more than 400 women artisans handweaving mats, screens, and fragrance products from surplus root, keeping a centuries-old craft tradition alive while creating income that doesn't depend on any single harvest.
              </p>
              <p className="font-normal text-foreground">
                From that foundation, KH International now distills export-grade vetiver oil for global perfumery, cosmetics, and wellness markets — currently supplying Canada, and building toward France and the wider European market. Every litre we export carries the same story: a rural economy built on women's livelihoods and regenerative farming, not extracted from it.
              </p>
            </div>
          </div>
        </div>

        {/* KH International, by the numbers */}
        <div className="mt-20 border-t border-border/60 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] tracking-[0.3em] text-gold uppercase font-semibold block mb-2">
              Verified Impact
            </span>
            <h3 className="font-serif text-3xl text-foreground">KH International, by the numbers</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Clean, citable operational figures supporting downstream ESG reporting for our global trade partners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((st) => (
              <div
                key={st.label}
                className="p-8 rounded-xl border border-border/80 bg-card hover:border-gold/60 transition-all text-center group hover:shadow-lg"
              >
                <div className="font-serif text-4xl sm:text-5xl font-bold text-forest group-hover:text-gold transition-colors">
                  {st.value}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-foreground mt-3">
                  {st.label}
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {st.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}