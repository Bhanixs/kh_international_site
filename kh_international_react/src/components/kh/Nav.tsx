import { useState } from "react";
import { Logo } from "./Logo";
import { Menu, X, ChevronRight, Globe2 } from "lucide-react";

interface NavProps {
  onOpenSampleModal?: (type?: "sample" | "partner" | "gcms") => void;
}

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "Story" },
  { href: "#product", label: "Vetiver Oil" },
  { href: "#why-kh", label: "Why KH" },
  { href: "#sustainability", label: "Sustainability" },
  { href: "#markets", label: "Global Trade" },
  { href: "#quality", label: "Compliance" },
  { href: "#farmers", label: "Farmers (தமிழ்)", isBadge: true },
  { href: "#contact", label: "Contact" },
];

export function Nav({ onOpenSampleModal }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Brand Logo & Title */}
        <a href="#home" className="flex items-center gap-3 shrink-0 group">
          <Logo className="h-12 sm:h-14 w-auto transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="font-serif text-lg sm:text-xl tracking-tight text-foreground font-semibold leading-none">
              KH International
            </span>
            <span className="text-[8.5px] sm:text-[9px] uppercase tracking-[0.2em] text-gold font-medium mt-1">
              Tamil Nadu · South India
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links (Spacious layout with xl breakpoint for clean fit) */}
        <nav className="hidden items-center gap-3 xl:gap-5 2xl:gap-6 text-[11px] font-medium tracking-wider text-muted-foreground uppercase xl:flex">
          {navLinks.map((l) =>
            l.isBadge ? (
              <a
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1 border border-gold/40 bg-gold/5 px-2.5 py-1 rounded-full text-gold hover:bg-gold hover:text-white transition-all text-[10.5px] font-semibold"
              >
                <span>{l.label}</span>
              </a>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-forest py-1 border-b-2 border-transparent hover:border-gold whitespace-nowrap"
              >
                {l.label}
              </a>
            )
          )}
        </nav>

        {/* Action Button & Mobile / Tablet Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenSampleModal?.("sample")}
            className="hidden sm:inline-flex items-center justify-center border border-gold bg-gold px-4 sm:px-5 py-2.5 text-[11px] font-medium tracking-[0.16em] text-white uppercase transition-all hover:bg-forest hover:border-forest shadow-sm whitespace-nowrap"
          >
            Request Sample
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden p-2 text-foreground hover:text-forest transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-border bg-background px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`text-xs uppercase tracking-wider font-medium py-2 px-3 rounded-lg border transition-colors flex items-center justify-between ${
                  l.isBadge
                    ? "border-gold/50 bg-gold/10 text-gold font-bold"
                    : "border-border/60 text-foreground hover:bg-alabaster hover:text-forest"
                }`}
              >
                <span>{l.label}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenSampleModal?.("sample");
              }}
              className="w-full text-center border border-gold bg-gold py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-forest transition-colors shadow-sm"
            >
              Request Sample Vial (100g)
            </button>
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenSampleModal?.("gcms");
              }}
              className="w-full text-center border border-border py-3 text-xs font-semibold uppercase tracking-widest text-foreground hover:bg-alabaster transition-colors"
            >
              Download GC-MS Report
            </button>
          </div>
        </div>
      )}
    </header>
  );
}