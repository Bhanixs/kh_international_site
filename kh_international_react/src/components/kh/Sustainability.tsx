import img from "@/assets/farmer-section.jpeg";
import { img1, img2, img3, img4, img5, img6 } from "@/assets/photo-card";
import { Sprout, Palette } from "lucide-react";

export function Sustainability() {
  return (
    <section id="sustainability" className="border-b border-border/60 bg-alabaster py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <span className="text-[11px] tracking-[0.3em] font-semibold text-gold uppercase block mb-2">
            Social Impact & Regenerative Sourcing · Page 5
          </span>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl font-normal">
            Sustainability & Farmer Partnerships
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground font-light">
            Two distinct, countable livelihood programs in Tamil Nadu — providing direct traceability and audited ESG impact for global trade partners.
          </p>
        </div>

        {/* 2 Program Grid */}
        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Program 1 */}
          <div className="rounded-2xl border border-border bg-background p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-6 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-forest/10 flex items-center justify-center text-forest">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] tracking-[0.2em] text-gold uppercase font-semibold block">Program 01</span>
                    <h3 className="font-serif text-2xl text-foreground">The Farming Partnership Program</h3>
                  </div>
                </div>
                <span className="text-xl font-serif font-bold text-forest bg-forest/10 px-3 py-1 rounded-md shrink-0">
                  500+ Women
                </span>
                <span className="text-xl font-serif font-bold text-forest bg-forest/10 px-3 py-1 rounded-md shrink-0">
                  100+ Acres
                </span>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                Every litre of KH International vetiver oil is connected to a farmer partnership, not an anonymous commodity purchase. We provide our partner farmers with quality seedlings, soil testing, and cultivation guidance — and in return, we secure a stable, quality-controlled supply of mature root, harvested at the right time for optimal oil yield. Today, more than 500 women farm vetiver across more than 100 acres of partner land under this program — earning stable income from a crop that restores the soil it grows in, rather than depleting it.
              </p>
            </div>
          </div>

          {/* Program 2 */}
          <div className="rounded-2xl border border-border bg-background p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-6 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                    <Palette className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] tracking-[0.2em] text-gold uppercase font-semibold block">Program 02</span>
                    <h3 className="font-serif text-2xl text-foreground">The Vetiver Craft Program</h3>
                  </div>
                </div>
                <span className="text-xl font-serif font-bold text-gold bg-gold/10 px-3 py-1 rounded-md shrink-0">
                  400+ Women
                </span>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                Not every part of the harvest goes to distillation. Alongside oil production, we run a parallel livelihood program built around traditional vetiver root craft — more than 400 women artisans handweaving root into mats, screens, and fragrance products using techniques passed down for generations. This program gives artisan families income that doesn't depend on the oil market alone, and keeps a genuinely traditional craft economically alive rather than letting it fade out.
              </p>
            </div>
          </div>
        </div>

        {/* Combined Impact & Photo Card */}
        <div className="mt-14 rounded-2xl bg-forest p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center relative z-10">
            <div className="lg:col-span-3">
              <h3 className="font-serif text-3xl sm:text-4xl">900+ Women's Livelihoods Supported</h3>
              <p className="text-sm text-white/80 mt-4 leading-relaxed max-w-2xl font-light">
                Together, these two programs put KH International's direct impact at over 900 women's livelihoods — a real, specific number worth stating plainly rather than folding into vaguer "community impact" language. This is a genuine commercial asset for a French buyer, not just a values statement: European due-diligence and sourcing-transparency expectations, and buyers' own downstream ESG reporting needs, make a documented, numbered impact story a real differentiator rather than a nice-to-have.
              </p>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-xl overflow-hidden border border-white/20 shadow-xl">
                <img
                  src={img}
                  alt="Farming community harvesting vetiver at golden hour in South India"
                  width={1200}
                  height={1400}
                  className="h-[260px] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Photo Cards */}
        <div className="bg-[hsl(130,70%,20%)] border border-[hsla(120,60%,60%,0.7)] rounded-2xl mt-8 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 items-center">
            {[img1, img2, img3, img4, img5, img6].map((photo, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 h-40 sm:h-36 border border-white/20 hover:border-[hsla(120,70%,70%,0.9)] bg-black/20"
              >
                <img
                  src={photo}
                  alt={`Vetiver farming & artisan craft highlight ${idx + 1}`}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}