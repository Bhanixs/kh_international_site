import { useState } from "react";
import img from "@/assets/market-france.jpeg";
import { Globe2, FileCheck2, Truck, ShieldCheck, ArrowRight, Languages, FileText, ExternalLink } from "lucide-react";
import graph from "@/assets/graph.png";

interface MarketsFranceProps {
  onOpenSampleModal?: (type?: "sample" | "partner" | "gcms") => void;
}

const stepsEN = [
  { step: "01", desc: "Request a sample and current lab specification sheet " },
  { step: "02", desc: "Review our GC-MS report and traceability documentation " },
  { step: "03", desc: "Place a trial order at agreed terms " },
  { step: "04", desc: "Move to a long-term supply agreement with agreed volumes and pricing " },
];

const stepsFR = [
  { step: "01", desc: "Demande un échantillon et la fiche technique actuelle du laboratoire." },
  { step: "02", desc: "Passe en revue notre rapport GC-MS et la documentation de traçabilité." },
  { step: "03", desc: "Passer une commande d'essai selon les termes convenus." },
  { step: "04", desc: "Passer à un accord d'approvisionnement à long terme avec des volumes et des prix convenus." },
];

export function MarketsFrance({ onOpenSampleModal }: MarketsFranceProps) {
  const [lang, setLang] = useState<"en" | "fr">("en");

  const steps = lang === "en" ? stepsEN : stepsFR;

  return (
    <section id="markets" className="border-b border-border/60 bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Visual Column */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-2xl">
              <img
                src={img}
                alt="French perfumer atelier formulation laboratory"
                width={1200}
                height={1400}
                loading="lazy"
                className="h-full min-h-[480px] w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-8 flex flex-col justify-end text-white">
                <span className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold mb-1">
                  Proven International Trade
                </span>
                <h3 className="font-serif text-2xl">Supplying Canada · Opening France & Europe</h3>
                <p className="text-xs text-white/80 mt-1">
                  Active, compliant export operation offering direct-from-source pricing to global ingredient distributors.
                </p>
              </div>
            </div>
          </div>

          {/* Copy Column */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-[11px] tracking-[0.3em] font-semibold text-gold uppercase">
                Global Trade & Partnerships · Page 6
              </span>

              {/* Language Switcher */}
              <div className="flex items-center gap-1.5 bg-alabaster p-1 rounded-lg border border-border">
                <Languages className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
                <button
                  onClick={() => setLang("en")}
                  className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-all ${lang === "en" ? "bg-forest text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("fr")}
                  className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-all ${lang === "fr" ? "bg-forest text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  FR
                </button>
              </div>
            </div>

            <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl font-normal">
              {lang === "en"
                ? "A Proven Export Supply Chain — Now Open to France and Europe"
                : "Un Réseau d'Approvisionnement Éprouvé — Ouvert à la France et à l'Europe"}
            </h2>

            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground font-light">
              <p>
                {lang === "en"
                  ? "KH International currently supplies vetriver oil to the Canadian market — a live, working export operation, not a first-time attempt at international trade. We're now building the same long-term relationships with trade houses, buying houses, and perfumery ingredient distributors in France and across Europe."
                  : "KH International fournit actuellement de l'huile essentielle de vétriver au marché canadien — une opération d'exportation active et éprouvée. Nous développons aujourd'hui les mêmes partenariats à long terme avec les maisons de négoce et les distributeurs d'ingrédients de parfumerie en France et en Europe."}
              </p>
              <p className="font-normal text-foreground">
                {lang === "en"
                  ? "Direct-from-source pricing, consistent laboratory-verified quality, and a supply chain story ready to support your own brand and sustainability narrative."
                  : "Tarification directe à la source, qualité constante vérifiée en laboratoire et traçabilité complète pour enrichir l'histoire et les engagements RSE de votre propre marque."}
              </p>
            </div>
          </div>
        </div>

        {/* How a Partnership Starts Workflow */}
        <div className="mt-12 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="font-serif text-3xl text-foreground">
              {lang === "en" ? "How a Partnership Starts" : "Comment Débute un Partenariat"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st) => (
              <div key={st.step} className="p-8 rounded-xl border border-gold bg-card transition-all hover:shadow-lg relative">
                <span className="font-serif text-4xl font-bold text-gold/60 block mb-3">{st.step}</span>
                <p className="text-sm">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
        {/* GC-MS Chromatogram & Analysis Table */}
        <div className="mt-16 pt-16 border-t border-border/60">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] tracking-[0.3em] font-semibold text-gold uppercase block mb-2">
              {lang === "en" ? "Laboratory Verification" : "Vérification en Laboratoire"}
            </span>
            <h3 className="font-serif text-3xl text-foreground">
              {lang === "en"
                ? "GC-MS Chromatogram & Key Compounds Data"
                : "Chromatogramme GC-MS & Données des Composés Clés"}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 font-light max-w-lg mx-auto">
              {lang === "en"
                ? "Detailed gas chromatography-mass spectrometry peak analysis confirming essential oil purity and chemical composition."
                : "Analyse détaillée des pics par chromatographie en phase gazeuse et spectrométrie de masse confirmant la pureté et la composition de l'huile essentielle."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Graph Image Column */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full rounded-2xl overflow-hidden border border-border/80 bg-background p-4 shadow-lg">
                <img
                  src={graph}
                  alt="Graph Image"
                  className="w-full h-auto object-contain rounded-lg transition-transform duration-500 hover:scale-[1.02]"
                />
                <div className="mt-3 text-center">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {lang === "en"
                      ? "Image: (Time vs. Voltage [mV])"
                      : "Image: (Temps vs. Tension [mV])"}
                  </span>
                </div>
              </div>
            </div>

            {/* Table Column */}
            <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-border/80 bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60 text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold text-foreground">
                        {lang === "en" ? "Compound Name" : "Nom du composé"}
                      </th>
                      <th className="py-3.5 px-3 text-right">
                        {lang === "en" ? "Reten. Time [min]" : "Temps Rét. [min]"}
                      </th>
                      <th className="py-3.5 px-3 text-right">
                        {lang === "en" ? "Area [mV.s]" : "Aire [mV.s]"}
                      </th>
                      <th className="py-3.5 px-3 text-right">
                        {lang === "en" ? "Height [mV]" : "Hauteur [mV]"}
                      </th>
                      <th className="py-3.5 px-3 text-right">
                        {lang === "en" ? "Height [%]" : "Hauteur [%]"}
                      </th>
                      <th className="py-3.5 px-3 text-right font-semibold text-foreground">
                        {lang === "en" ? "Area [%]" : "Aire [%]"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                    {[
                      {
                        compound: "b Vetivenene",
                        retenTime: "27.707",
                        areaMVs: "70.007",
                        heightMV: "12.367",
                        heightPct: "3.7",
                        areaPct: "3.116",
                      },
                      {
                        compound: "Khusimol",
                        retenTime: "33.840",
                        areaMVs: "358.965",
                        heightMV: "56.082",
                        heightPct: "16.8",
                        areaPct: "11-14",
                      },
                      {
                        compound: "Isovalencenol",
                        retenTime: "34.992",
                        areaMVs: "245.661",
                        heightMV: "46.103",
                        heightPct: "13.8",
                        areaPct: "10.935",
                      },
                      {
                        compound: "b Vetivone",
                        retenTime: "35.379",
                        areaMVs: "72.888",
                        heightMV: "13.750",
                        heightPct: "4.1",
                        areaPct: "3.244",
                      },
                      {
                        compound: "a Vetivone",
                        retenTime: "35.893",
                        areaMVs: "74.161",
                        heightMV: "16.040",
                        heightPct: "4.8",
                        areaPct: "3.301",
                      },
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 font-sans font-medium text-foreground text-xs flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shrink-0" />
                          {row.compound}
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground">{row.retenTime}</td>
                        <td className="py-3 px-3 text-right text-muted-foreground">{row.areaMVs}</td>
                        <td className="py-3 px-3 text-right text-muted-foreground">{row.heightMV}</td>
                        <td className="py-3 px-3 text-right text-muted-foreground">{row.heightPct}%</td>
                        <td className="py-3 px-3 text-right font-semibold text-forest">{row.areaPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}