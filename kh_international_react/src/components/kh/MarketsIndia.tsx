import { SmallList } from "./SmallList";

const customers = [
  "Indian perfume brands",
  "Fragrance compounders",
  "Incense & devotional makers",
  "Beauty & wellness brands",
  "Raw material distributors",
];

const advantages = [
  "Faster response & coordination",
  "Flexible order support",
  "Sample-based evaluation",
  "Assistance for repeat orders",
];

export function MarketsIndia() {
  return (
    <section id="markets" className="border-t border-border/60">
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-20 lg:px-16 lg:py-28">
          <span className="mb-6 text-[11px] tracking-[0.3em] text-gold uppercase">
            Markets · India
          </span>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground lg:text-5xl">
            Dependable domestic supply for Indian fragrance and devotional makers.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
            Our domestic approach is built for easy communication, faster coordination,
            and practical B2B support across perfume, devotional, and beauty
            manufacturing.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-12 sm:grid-cols-2">
            <div className="p-4 border-1 border-green-400 shadow-lg rounded-lg">
              <SmallList title="Ideal customers" items={customers} />
            </div>
            <div className="p-4 border-1 border-green-400 shadow-lg rounded-lg">
              <SmallList title="Domestic advantages" items={advantages} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center bg-alabaster px-6 py-20 lg:px-16 lg:py-28">
          <IndiaMark />
        </div>
      </div>
    </section>
  );
}


function IndiaMark() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="font-serif text-[10rem] leading-none tracking-tight text-forest">
        IN
      </div>
      <div className="mt-2 h-px w-24 bg-gold" />
      <div className="mt-3 text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        Domestic Supply
      </div>
    </div>
  );
}