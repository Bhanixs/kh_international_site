import { useState } from "react";
import img from "@/assets/market-france.jpeg";
import { Globe2, FileCheck2, Truck, ShieldCheck, ArrowRight, Languages } from "lucide-react";

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
                  className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-all ${
                    lang === "en" ? "bg-forest text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("fr")}
                  className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-all ${
                    lang === "fr" ? "bg-forest text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
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
      </div>
    </section>
  );
}