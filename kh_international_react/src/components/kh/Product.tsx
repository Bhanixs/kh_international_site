import productImg from "@/assets/product-vetiver-2.jpeg";
import { Sparkles, FileSpreadsheet } from "lucide-react";

interface ProductProps {
  onOpenSampleModal?: (type?: "sample" | "partner" | "gcms") => void;
}

const applications = [
  {
    role: "Fine Fragrance & Perfumery",
    desc: "Renowned for its extraordinary tenacity, adding deep, woody, earthy, and smoky warmth while fixing lighter volatile notes.",
  },
  {
    role: "Cosmetics & Skincare",
    desc: "Provides natural botanical toning, skin conditioning, and characteristic luxury fragrance in high-end personal care.",
  },
  {
    role: "Aromatherapy & Wellness",
    desc: "Used in luxury aromatherapy blends, diffuser oils, and spa preparations for its grounding, stress-relieving scent profile.",
  },
  {
    role: "Siddha & Ayurvedic Medicine",
    desc: "Deeply rooted in traditional South Indian Siddha medicine for its natural cooling, restorative, and skin-soothing properties.",
  },
  {
    role: "Functional & Cooling Beverages",
    desc: "Utilized in traditional summer cooling infusions (Khus water) and functional botanical beverage formulations.",
  },
];

export function Product({ onOpenSampleModal }: ProductProps) {
  return (
    <section id="product" className="border-b border-border/60 bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Column Text */}
          <div>
            <span className="mb-4 text-[11px] tracking-[0.3em] font-semibold text-gold uppercase block">
              The Product · Page 3
            </span>
            <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl font-normal">
              Our Vetiver Oil
            </h2>
            <p className="mt-4 text-xs font-mono text-forest uppercase tracking-widest bg-forest/10 px-3 py-1.5 rounded-md inline-block">
              Botanical Name: Chrysopogon zizanioides (syn. Vetiveria zizanioides)
            </p>

            <p className="mt-4 text-xs font-mono text-forest uppercase tracking-widest bg-forest/10 px-3 py-1.5 rounded-md inline-block">
              Origin: Tamil Nadu, South India.
            </p>

            <p className="mt-6 text-base leading-relaxed text-muted-foreground font-light">
              An earthy, woody, smoky-sweet base note prized in fine fragrance, and a foundational ingredient across cosmetics, aromatherapy, and traditional Siddha and Ayurvedic medicine.            </p>
          </div>

          {/* Right Column Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-2xl">
              <img
                src={productImg}
                alt="Vetiver roots with amber essential oil vial in natural light"
                width={800}
                height={800}
                loading="lazy"
                className="h-full min-h-[460px] w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-black/75 backdrop-blur-md p-5 border border-white/10 text-white">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gold font-semibold uppercase tracking-wider">Extraction Method</span>
                  <span className="text-white/80">100% Pure Steam Distillation</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-2 border-t border-white/10 pt-2">
                  <span className="text-gold font-semibold uppercase tracking-wider">Harvest Origin</span>
                  <span className="text-white/80">Villupuram, Tamil Nadu, South India</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Section */}
        <div className="mt-2 pt-16">
          <div className="mb-10">
            <h3 className="font-serif text-3xl text-foreground">Applications & Key Use Cases</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app, i) => (
              <div key={i} className="p-6 rounded-xl border border-border/80 bg-card hover:border-gold/60 transition-all hover:shadow-lg">
                <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{app.role}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}