import { ShieldCheck } from "lucide-react";

interface StepItem {
  title: string;
  desc?: string;
}

interface Tier {
  tierNumber: string;
  title: string;
  desc?: string | null;
  items: StepItem[];
}

const tiersData: Tier[] = [
  {
    tierNumber: "Tier 1",
    title: "Mandatory to Export From India",
    items: [
      {
        title: "Import Export Code (IEC)",
        desc: "Issued by DGFT (Directorate General of Foreign Trade); legally required for any Indian export business.",
      },
      {
        title: "GST Registration",
        desc: "Required for all export documentation and invoicing.",
      },
      {
        title: "RCMC (Registration-cum-Membership Certificate)",
        desc: "From CHEMEXCIL (Basic Chemicals, Cosmetics & Dyes Export Promotion Council), the relevant export promotion council for essential oils; expected by most serious buyers as a baseline credibility signal.",
      },
      {
        title: "FSSAI License/Registration",
        desc: "Required if any product or claim touches food/ingestible use (relevant given vetiver's traditional use in cooling beverages).",
      },
    ],
  },
  {
    tierNumber: "Tier 2",
    title: "Required by Destination Market (Europe & Global)",
    desc: "This is the tier that actually resolves the \"can I import this\" question for a French or EU buyer — treated here with the same weight as the Indian export requirements above, not as a secondary concern.",
    items: [
      {
        title: "REACH compliance (EU/France)",
        desc: "Substances placed on the EU market must meet REACH (Registration, Evaluation, Authorisation and Restriction of Chemicals) requirements; compulsory for France/EU trade, not optional.",
      },
      {
        title: "SDS (Safety Data Sheet) in GHS/CLP format",
        desc: "The EU-compliant format buyers will expect, distinct from a basic MSDS.",
      },
      {
        title: "Canada-specific compliance",
        desc: "Requirements vary by end-use (cosmetic ingredient vs. food additive vs. industrial use) under Health Canada and CEPA; document whichever pathway you're currently compliant under.",
      },
    ],
  },
  {
    tierNumber: "Tier 3",
    title: "Per-Shipment Documentation",
    items: [
      {
        title: "Certificate of Analysis (CoA) / GC-MS report",
        desc: "Issued per batch.",
      },
      {
        title: "Certificate of Origin",
        desc: "Issued by Chamber of Commerce.",
      },
      {
        title: "Safety Data Sheet",
        desc: "Matching the specific shipment batch.",
      },
      {
        title: "Phytosanitary Certificate",
        desc: "Confirm with destination customs whether required for distilled oil (often waived for processed/distilled products, but varies by country).",
      },
    ],
  },
  {
    tierNumber: "Tier 4",
    title: "Voluntary but Valuable",
    items: [
      {
        title: "Organic certification",
        desc: "India NPOP, with EU or USDA equivalence — strengthens the sustainability story from Page 5.",
      },
      {
        title: "ISO 9001 / ISO 22716",
        desc: "Quality Management or Cosmetics GMP certification.",
      },
      {
        title: "IFRA Compliance Statement",
        desc: "Supplier declaration, based on testing, that the oil meets International Fragrance Association usage restrictions; specifically expected by perfumery buyers.",
      },
      {
        title: "Fair Trade / Fair for Life certification",
        desc: "Formalizes the farmer-partnership story into a certification buyers can cite in their marketing.",
      },
    ],
  },
];

export function Quality() {
  return (
    <section id="quality" className="border-b border-border/60 bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <span className="text-[11px] tracking-[0.3em] font-semibold text-gold uppercase block mb-2">
            Compliance Framework · Page 7
          </span>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl font-normal">
            Global Standards & Compliance
          </h2>
          <p className="mt-4 text-md leading-relaxed text-muted-foreground font-light">
            A European or international buyer's first real question isn't "is the oil good" — it's "can I legally and safely bring this into my market, and will it survive my own compliance review." This page answers that directly and specifically across four distinct requirement tiers.
          </p>
        </div>

        {/* Tier Boxes list */}
        <div className="mt-14 space-y-10">
          {tiersData.map((tier, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-alabaster/60 p-6 sm:p-10 shadow-xs hover:border-gold/40 transition-all"
            >
              {/* Box Header */}
              <div className="border-b border-border/60 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-gold bg-gold/10 px-3 py-1 rounded-full mb-2 border border-gold/20">
                    {tier.tierNumber}
                  </div>
                  <h3 className="font-serif text-2xl text-foreground font-normal">{tier.title}</h3>
                  {tier.desc && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2 max-w-3xl font-light">
                      {tier.desc}
                    </p>
                  )}
                </div>
              </div>

              {/* Steps inside the Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {tier.items.map((item, stepIdx) => (
                  <div
                    key={stepIdx}
                    className="p-5 rounded-xl bg-background border border-border/80 shadow-xs hover:border-gold/60 transition-colors flex gap-4 items-start"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest/10 font-mono text-xs font-semibold text-forest border border-forest/20 mt-0.5">
                      {stepIdx + 1}
                    </span>
                    <div>
                      <h4 className="font-serif text-lg text-foreground font-medium">{item.title}</h4>
                      {item.desc && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.desc}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}