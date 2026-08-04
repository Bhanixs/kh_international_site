import { Logo } from "./Logo";
import { Mail, Phone, MapPin, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-forest text-white border-t border-forest">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-white/10 pb-12">
          {/* Brand Col */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="bg-white rounded-xl p-3 inline-block shadow-md mb-6">
                <Logo className="h-16 w-auto" />
              </div>
              <h3 className="font-serif text-3xl font-light leading-snug">
                KH International
              </h3>
              <p className="mt-3 text-xs text-white/80 max-w-md leading-relaxed">
                Vertically integrated vetriver oil producer from Villupuram, Tamil Nadu, South India — supporting 900+ women's livelihoods across regenerative farming and handwoven root craft.
              </p>
            </div>
          </div>

          {/* Nav Links Col */}
          <div className="md:col-span-3 space-y-3 text-xs uppercase tracking-wider">
            <h4 className="text-gold font-semibold text-[11px] tracking-[0.25em] mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-white/80">
              <li><a href="#home" className="hover:text-gold transition-colors">Page 1 — Home</a></li>
              <li><a href="#about" className="hover:text-gold transition-colors">Page 2 — Our Story</a></li>
              <li><a href="#product" className="hover:text-gold transition-colors">Page 3 — Vetriver Oil</a></li>
              <li><a href="#why-kh" className="hover:text-gold transition-colors">Page 4 — Why India</a></li>
              <li><a href="#sustainability" className="hover:text-gold transition-colors">Page 5 — Sustainability</a></li>
              <li><a href="#markets" className="hover:text-gold transition-colors">Page 6 — Global Trade (France)</a></li>
              <li><a href="#quality" className="hover:text-gold transition-colors">Page 7 — Compliance Matrix</a></li>
              <li><a href="#farmers" className="hover:text-gold transition-colors">Farmers (தமிழ்)</a></li>
              <li><a href="#contact" className="hover:text-gold transition-colors">Page 8 — Trade Inquiry</a></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="md:col-span-4 space-y-4 text-xs">
            <h4 className="text-gold font-semibold text-[11px] uppercase tracking-[0.25em] mb-4">
              Contact Us
            </h4>

            <div className="space-y-3 text-white/80">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-white/60 uppercase">E-Mail - 1</span>
                  <a href="mailto:export@khinternational.org.in" className="font-semibold text-white hover:text-gold">
                    export@khinternational.org.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-white/60 uppercase">E-Mail - 02</span>
                  <a href="mailto:info@khinternational.org.in" className="text-white/90 hover:text-gold">
                    info@khinternational.org.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-white/60 uppercase">Phone Number</span>
                  <a href="tel:+919566203297" className="font-semibold text-white hover:text-gold">
                    +91 9566203297
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-white/60 uppercase">Address</span>
                  <p className="text-white/80 leading-relaxed">
                    No 11, Murugan Koil Street, Krishnapuram, Azagiyanatham Post, Villupuram District, Tamil Nadu, India – 607402
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/60 uppercase tracking-widest">
          <div>
            © {new Date().getFullYear()} KH International. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}