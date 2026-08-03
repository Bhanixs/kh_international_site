import { useState } from "react";
import { Sprout, HeartHandshake, Shield, Sparkles, PhoneCall, CheckCircle } from "lucide-react";

export function FarmersSection() {
  const [lang, setLang] = useState<"ta" | "en">("en");

  return (
    <section id="farmers" className="border-t border-b border-border/60 bg-alabaster py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <span className="text-[11px] tracking-[0.3em] text-forest uppercase font-semibold block mb-2">
              Livelihoods & Farmer Recruitment · Tamil Nadu
            </span>
            <h2 className="font-serif text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {lang === "en"
                ? "For Partner Farmers & Women Artisans"
                : "வெட்டிவேர் விவசாயிகள் மற்றும் கைவினைஞர்கள் சேர்க்கை"}
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              {lang === "en"
                ? "Empowering local agriculture through low-water vetiver farming and handwoven root craft. Building stable, dignified income across Villupuram district."
                : "குறைந்த நீர் தேவையில் அதிக வருமானம் தரும் வெட்டிவேர் சாகுபடி மற்றும் பாரம்பரிய கைவினைத் தொழில் பயிற்சி. விழுப்புரம் மாவட்ட விவசாயிகளின் வாழ்வாதார மேம்பாடு."}
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border shrink-0">
            <button
              onClick={() => setLang("en")}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all ${
                lang === "en"
                  ? "bg-forest text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("ta")}
              className={`px-4 py-2 text-xs font-semibold tracking-wider rounded-md transition-all ${
                lang === "ta"
                  ? "bg-forest text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              தமிழ் (Tamil)
            </button>
          </div>
        </div>

        {/* 4 Steps for Farmers / Artisans */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-background p-6 border border-border/80 shadow-sm hover:border-gold/60 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-forest/10 flex items-center justify-center text-forest mb-4">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">
              {lang === "en" ? "1. Premium Seedlings" : "1. தரமான நாற்றுகள் வழங்கும் திட்டம்"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === "en"
                ? "We supply healthy, high-yield Chrysopogon zizanioides slips directly to partner farming families."
                : "அதிக எண்ணெய் சத்து கொண்ட வீரியமிக்க வெட்டிவேர் நாற்றுகள் மற்றும் தொழில்நுட்ப வழிகாட்டல் வழங்கி ஆதரிக்கிறோம்."}
            </p>
          </div>

          <div className="rounded-xl bg-background p-6 border border-border/80 shadow-sm hover:border-gold/60 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-forest/10 flex items-center justify-center text-forest mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">
              {lang === "en" ? "2. Free Soil Testing" : "2. இலவச மண் & நீர் பரிசோதனை"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === "en"
                ? "Soil and irrigation testing support to maximize root biomass while conserving local groundwater."
                : "நிலத்தின் தன்மையை ஆராய்ந்து குறைந்த நீரில் அதிக வேர் விளைச்சல் பெற இயற்கை வழிமுறைகளை கற்றுத் தருகிறோம்."}
            </p>
          </div>

          <div className="rounded-xl bg-background p-6 border border-border/80 shadow-sm hover:border-gold/60 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-forest/10 flex items-center justify-center text-forest mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">
              {lang === "en" ? "3. Guaranteed Buyback" : "3. நிலையான கொள்முதல் உத்தரவாதம்"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === "en"
                ? "Assured, fair purchase prices for mature roots at harvest time for our steam distillation plant."
                : "அறுவடை செய்யப்படும் முதிர்ந்த வேர்களை குறித்த காலத்தில் நியாயமான விலையில் முழுமையாக கொள்முதல் செய்கிறோம்."}
            </p>
          </div>

          <div className="rounded-xl bg-background p-6 border border-border/80 shadow-sm hover:border-gold/60 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-forest/10 flex items-center justify-center text-forest mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">
              {lang === "en" ? "4. Craft Training" : "4. மகளிர் கைவினைப் பயிற்சி"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === "en"
                ? "Over 400 women trained in handweaving vetiver root mats, curtains, and aromatic wellness products."
                : "400-க்கும் மேற்பட்ட மகளிருக்கு வெட்டிவேர் பாய்கள், திரைச்சீலைகள் நெய்யும் பயிற்சி மற்றும் வருமான வாய்ப்பு."}
            </p>
          </div>
        </div>

        {/* Contact Banner for Farmers */}
        <div className="mt-12 rounded-xl bg-forest p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-gold text-xs uppercase tracking-widest font-semibold mb-1">
              <CheckCircle className="w-4 h-4" />
              {lang === "en" ? "Farmer Partnership Helpline" : "விவசாயிகள் உதவி எண்"}
            </div>
            <h4 className="font-serif text-2xl">
              {lang === "en"
                ? "Want to cultivate Vetiver on your land in Tamil Nadu?"
                : "உங்கள் நிலத்தில் வெட்டிவேர் பயிரிட விரும்புகிறீர்களா?"}
            </h4>
            <p className="text-xs text-white/80 mt-1 max-w-xl">
              {lang === "en"
                ? "Contact our Villupuram field team for seedling allocation, soil inspection, and contract details."
                : "நாற்றுகள் முன்பதிவு மற்றும் கள ஆய்வுக்கு எங்களது விழுப்புரம் அலுவலகத்தை தொடர்புகொள்ளவும்."}
            </p>
          </div>
          <a
            href="tel:+919566203297"
            className="inline-flex items-center gap-3 bg-gold hover:bg-white hover:text-forest text-white font-medium px-6 py-3.5 rounded-lg transition-colors text-sm uppercase tracking-wider shrink-0"
          >
            <PhoneCall className="w-5 h-5" />
            +91 95662 03297
          </a>
        </div>
      </div>
    </section>
  );
}
