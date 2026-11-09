import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Send, CheckCircle2, Unlock } from "lucide-react";
import {
  CONTACT_FIELD_ORDER,
  HONEYPOT_FIELD,
  LIMITS,
  validateContactFields,
  type FieldErrors,
} from "@/lib/enquiry/schema";
import { useEnquirySubmission, type SubmitErrorCode } from "@/lib/enquiry/client";
import { grantDocAccess } from "@/lib/doc-access";
import { turnstileSiteKey } from "@/lib/enquiry/turnstile-key";
import { TurnstileWidget, type TurnstileHandle, type TurnstileStatus } from "./TurnstileWidget";
import { EnquiryErrorNotice, MockModeNotice } from "./EnquiryStatus";

const FIELD_IDS: Record<(typeof CONTACT_FIELD_ORDER)[number], string> = {
  fullName: "contact-name",
  company: "contact-company",
  email: "contact-email",
  country: "contact-country",
  phone: "contact-phone",
  product: "contact-product",
  volume: "contact-volume",
  message: "contact-message",
};

const labelClass =
  "block text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1.5 font-semibold";
const inputClass =
  "w-full bg-alabaster/60 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold/30 focus:outline-none transition-all placeholder:text-muted-foreground/50";

type Failure = { code: SubmitErrorCode; retryable: boolean; retryAfterSeconds?: number };
/** `unlocked`: a real (non-mock) provider-confirmed success from a visitor who did not fill the honeypot. */
type Result = { reference: string; mock: boolean; unlocked: boolean };

function readFields(form: HTMLFormElement, names: readonly string[]) {
  const data = new FormData(form);
  return Object.fromEntries(names.map((n) => [n, String(data.get(n) ?? "")]));
}

function Field({
  name,
  label,
  required,
  error,
  hint,
  children,
}: {
  name: (typeof CONTACT_FIELD_ORDER)[number];
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: (props: {
    id: string;
    name: string;
    "aria-invalid": true | undefined;
    "aria-describedby": string | undefined;
  }) => ReactNode;
}) {
  const id = FIELD_IDS[name];
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? " *" : <span className="normal-case tracking-normal font-normal"> (optional)</span>}
      </label>
      {children({ id, name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Contact() {
  const { submit, busy, markStarted, reset } = useEnquirySubmission("contact");
  const [result, setResult] = useState<Result | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [verifierStatus, setVerifierStatus] = useState<TurnstileStatus>("loading");
  const [showVerifier, setShowVerifier] = useState(false);
  const [messageLength, setMessageLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  // Load the security check only when the form approaches the viewport, so it never affects page load.
  useEffect(() => {
    const el = formRef.current;
    if (!el || showVerifier) return;
    if (!("IntersectionObserver" in window)) {
      setShowVerifier(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShowVerifier(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [showVerifier, result]);

  useEffect(() => {
    if (result) successHeadingRef.current?.focus();
  }, [result]);

  function showFieldErrors(form: HTMLFormElement, fieldErrors: FieldErrors) {
    // Render the errors first so the focused field is announced with its error.
    flushSync(() => setErrors(fieldErrors));
    const first = CONTACT_FIELD_ORDER.find((n) => fieldErrors[n]);
    const el = first ? form.elements.namedItem(first) : null;
    if (el instanceof HTMLElement) el.focus();
    toast.error(first ? fieldErrors[first]! : "Please review the form fields.");
  }

  async function attempt(form: HTMLFormElement) {
    if (busy) return;
    markStarted();
    const checked = validateContactFields(readFields(form, CONTACT_FIELD_ORDER));
    if (!checked.ok) {
      setFailure(null);
      showFieldErrors(form, checked.fieldErrors);
      return;
    }
    setErrors({});
    if (turnstileSiteKey() && !token) {
      // Never ask visitors to "complete" a challenge they cannot see.
      setFailure(
        verifierStatus === "error"
          ? { code: "verification_load_failed", retryable: false }
          : { code: "verification_loading", retryable: true },
      );
      return;
    }
    setFailure(null);
    const honeypotInput = form.elements.namedItem(HONEYPOT_FIELD);
    const honeypot = honeypotInput instanceof HTMLInputElement ? honeypotInput.value : "";
    const outcome = await submit({
      requestType: "contact",
      fields: checked.data as unknown as Record<string, string>,
      turnstileToken: token ?? "",
      honeypot,
    });
    if (!outcome) return;
    turnstileRef.current?.reset(); // tokens are single-use

    if (outcome.kind === "success") {
      // Only a real provider-confirmed acceptance opens the reports page: never a local mock success,
      // and never when this browser filled the honeypot (the server's decoy looks like a success).
      const unlocked = outcome.accepted && !outcome.mock && honeypot.trim() === "";
      if (unlocked) grantDocAccess();
      setResult({ reference: outcome.reference, mock: outcome.mock, unlocked });
      form.reset();
      setMessageLength(0);
      reset();
      toast.success(`Enquiry submitted. Reference ${outcome.reference}.`);
      return;
    }
    if (outcome.code === "validation" && outcome.fieldErrors) showFieldErrors(form, outcome.fieldErrors);
    setFailure({ code: outcome.code, retryable: outcome.retryable, retryAfterSeconds: outcome.retryAfterSeconds });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void attempt(e.currentTarget);
  }

  function submitAnother() {
    setResult(null);
    setFailure(null);
    setErrors({});
    reset();
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
                      href="mailto:info@khinternational.org.in"
                      className="text-base font-semibold text-foreground hover:text-forest transition-colors block"
                    >
                      info@khinternational.org.in
                    </a>
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
              {result ? (
                <div className="text-center py-12" data-enquiry-success>
                  <div className="mx-auto w-16 h-16 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
                  </div>
                  <h3 ref={successHeadingRef} tabIndex={-1} className="font-serif text-3xl text-foreground outline-none">
                    Enquiry Submitted
                  </h3>
                  <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
                    Thank you for contacting KH International. Your enquiry has been submitted.
                  </p>
                  <p className="text-sm text-foreground mt-3">
                    Your reference: <strong data-enquiry-reference>{result.reference}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Please quote this reference if you follow up.</p>
                  {result.mock ? <MockModeNotice /> : null}

                  <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    {result.unlocked ? (
                      <Link
                        to="/reports"
                        className="inline-flex items-center justify-center gap-2 border border-gold bg-gold text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-forest hover:border-forest transition-colors rounded-xl shadow-md"
                      >
                        <Unlock className="w-4 h-4" aria-hidden="true" /> View Technical Reports (5 Files)
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={submitAnother}
                      className="border border-border text-foreground px-6 py-3 text-xs uppercase tracking-widest font-medium hover:bg-muted transition-colors rounded-xl"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  ref={formRef}
                  onSubmit={onSubmit}
                  onFocusCapture={() => {
                    markStarted();
                    setShowVerifier(true);
                  }}
                  noValidate
                  aria-busy={busy || undefined}
                  className="space-y-6"
                >
                  <div className="border-b border-border/60 pb-4 mb-6">
                    <h3 className="font-serif text-2xl text-foreground">Trade Inquiry & Sample Request Form</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please complete the fields below to connect directly with our trade desk. Fields marked * are required.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Field name="fullName" label="Full Name" required error={errors.fullName}>
                      {(p) => (
                        <input {...p} type="text" required autoComplete="name" maxLength={LIMITS.fullName.max} placeholder="e.g. Marie Laurent" className={inputClass} />
                      )}
                    </Field>
                    <Field name="company" label="Company Name" required error={errors.company}>
                      {(p) => (
                        <input {...p} type="text" required autoComplete="organization" maxLength={LIMITS.company.max} placeholder="e.g. Parfums SA" className={inputClass} />
                      )}
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Field name="email" label="Business Email" required error={errors.email}>
                      {(p) => (
                        <input {...p} type="email" required autoComplete="email" inputMode="email" maxLength={LIMITS.email.max} placeholder="e.g. marie@parfums.fr" className={inputClass} />
                      )}
                    </Field>
                    <Field name="country" label="Country" required error={errors.country}>
                      {(p) => (
                        <input {...p} type="text" required autoComplete="country-name" maxLength={LIMITS.country.max} placeholder="e.g. France / Canada / USA" className={inputClass} />
                      )}
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <Field name="phone" label="Phone / WhatsApp" error={errors.phone}>
                      {(p) => (
                        <input {...p} type="tel" autoComplete="tel" maxLength={LIMITS.phone.max} placeholder="e.g. +33 1 23 45 67 89" className={inputClass} />
                      )}
                    </Field>
                    <Field name="product" label="Product of Interest" error={errors.product}>
                      {(p) => (
                        <input {...p} type="text" maxLength={LIMITS.product.max} placeholder="e.g. Bulk Vetriver Oil" className={inputClass} />
                      )}
                    </Field>
                    <Field name="volume" label="Estimated Order Volume" error={errors.volume}>
                      {(p) => (
                        <input {...p} type="text" maxLength={LIMITS.volume.max} placeholder="e.g. 25 kg Drum" className={inputClass} />
                      )}
                    </Field>
                  </div>

                  <Field
                    name="message"
                    label="Enquiry Message"
                    required
                    error={errors.message}
                    hint={`${messageLength} / ${LIMITS.message.max} characters (minimum ${LIMITS.message.min})`}
                  >
                    {(p) => (
                      <textarea
                        {...p}
                        required
                        rows={5}
                        maxLength={LIMITS.message.max}
                        onChange={(e) => setMessageLength(e.currentTarget.value.length)}
                        placeholder="e.g. Target delivery date, destination port, Incoterms or specifications"
                        className={`${inputClass} resize-y`}
                      />
                    )}
                  </Field>

                  {/* Honeypot: hidden from people and assistive technology; bots that fill it get a decoy response. */}
                  <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                    <label htmlFor="contact-kh-ref">Leave this field empty</label>
                    <input id="contact-kh-ref" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
                  </div>

                  {showVerifier ? (
                    <TurnstileWidget
                      ref={turnstileRef}
                      action="contact"
                      onToken={setToken}
                      onStatusChange={setVerifierStatus}
                    />
                  ) : null}

                  {failure ? (
                    <EnquiryErrorNotice
                      id="contact-form-error"
                      code={failure.code}
                      retryable={failure.retryable}
                      retryAfterSeconds={failure.retryAfterSeconds}
                      busy={busy}
                      onRetry={() => formRef.current && void attempt(formRef.current)}
                    />
                  ) : null}

                  <div className="pt-4 flex flex-wrap gap-4 items-center">
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gold bg-gold px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-white hover:bg-forest hover:border-forest transition-colors rounded-xl disabled:opacity-60 shadow-md"
                    >
                      <Send className="w-4 h-4" aria-hidden="true" />
                      {busy ? "Sending..." : "Submit Trade Inquiry"}
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
