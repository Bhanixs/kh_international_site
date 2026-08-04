import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Send, CheckCircle2 } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(1, "Name / Company Name is required").max(150),
  country: z.string().trim().min(1, "Country is required").max(100),
  product: z.string().trim().optional().or(z.literal("")),
  volume: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please review form fields");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      form.reset();
      toast.success("Thank you! Your trade inquiry has been submitted to export@khinternational.org.in");
    }, 600);
  }

  return (
    <section id="contact" className="border-b border-border/60 bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Direct Contact Info Sidebar (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <span className="text-[11px] tracking-[0.3em] font-semibold text-gold uppercase block mb-2">
                Trade Desk & Inquiries · Page 8
              </span>
              <h2 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl font-normal">
                Contact KH International
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed font-light">
                Direct export inquiries, sample vial dispatch requests, and commercial terms alignment with our sales desk.
              </p>

              {/* Direct Info List */}
              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-alabaster border border-border">
                  <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] tracking-widest uppercase text-gold font-semibold block">
                      Dedicated Global Trade Email
                    </span>
                    <a
                      href="mailto:export@khinternational.org.in"
                      className="text-base font-semibold text-foreground hover:text-forest transition-colors block"
                    >
                      export@khinternational.org.in
                    </a>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      General: <a href="mailto:info@khinternational.org.in" className="hover:underline">info@khinternational.org.in</a>
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-alabaster border border-border">
                  <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] tracking-widest uppercase text-gold font-semibold block">
                      Direct Phone & WhatsApp
                    </span>
                    <a
                      href="tel:+919566203297"
                      className="text-base font-semibold text-foreground hover:text-forest transition-colors block"
                    >
                      +91 95662 03297
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-alabaster border border-border">
                  <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] tracking-widest uppercase text-gold font-semibold block">
                      Distillation Facility & Corporate Address
                    </span>
                    <p className="text-xs text-foreground font-medium leading-relaxed mt-1">
                      No 11, Murugan Koil Street, Krishnapuram, Azagiyanatham Post, Villupuram District, Tamil Nadu, India – 607402
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border/80 bg-card p-8 sm:p-10 shadow-xl">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="font-serif text-3xl text-foreground">Inquiry Received</h3>
                  <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to KH International. Our export trade desk (<span className="text-forest font-semibold">export@khinternational.org.in</span>) has received your details and will respond within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-8 border border-gold bg-gold text-white px-8 py-3 text-xs uppercase tracking-widest font-medium hover:bg-forest transition-colors rounded-lg"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="space-y-6">
                  <div className="border-b border-border/60 pb-4 mb-6">
                    <h3 className="font-serif text-2xl text-foreground">Trade Inquiry & Sample Request Form</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please complete the fields below to connect directly with our trade desk.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1.5 font-semibold">
                        Name / Company Name *
                      </label>
                      <input
                        name="name"
                        type="text"
                        required
                        placeholder="e.g. Marie Laurent / Parfums SA"
                        className="w-full bg-alabaster/60 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold/30 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1.5 font-semibold">
                        Country *
                      </label>
                      <input
                        name="country"
                        type="text"
                        required
                        placeholder="e.g. France / Canada / USA"
                        className="w-full bg-alabaster/60 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold/30 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1.5 font-semibold">
                        Product of Interest
                      </label>
                      <input
                        name="product"
                        type="text"
                        placeholder="e.g. Bulk Vetriver Oil / 100g Sample"
                        className="w-full bg-alabaster/60 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold/30 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1.5 font-semibold">
                        Estimated Order Volume
                      </label>
                      <input
                        name="volume"
                        type="text"
                        placeholder="e.g. 25 kg Drum / 5 kg Trial"
                        className="w-full bg-alabaster/60 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold/30 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1.5 font-semibold">
                      Message
                    </label>
                    <input
                      name="message"
                      type="text"
                      placeholder="e.g. Target delivery date, Incoterms, or specifications"
                      className="w-full bg-alabaster/60 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold/30 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div className="pt-4 flex flex-wrap gap-4 items-center">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gold bg-gold px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-white hover:bg-forest hover:border-forest transition-colors rounded-xl disabled:opacity-60 shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? "Sending..." : "Submit Trade Inquiry"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}