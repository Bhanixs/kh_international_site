import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle2, Send, ShieldCheck, Unlock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  HONEYPOT_FIELD,
  LIMITS,
  SAMPLE_FIELD_ORDER,
  validateSampleFields,
  type FieldErrors,
  type SampleRequestType,
} from "@/lib/enquiry/schema";
import { useEnquirySubmission, type SubmitErrorCode } from "@/lib/enquiry/client";
import { grantDocAccess } from "@/lib/doc-access";
import { turnstileSiteKey } from "@/lib/enquiry/turnstile-key";
import { TurnstileWidget, type TurnstileHandle, type TurnstileStatus } from "./TurnstileWidget";
import { EnquiryErrorNotice, MockModeNotice } from "./EnquiryStatus";

interface SampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: SampleRequestType;
  /** Focus target when the element that opened the modal no longer exists. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /**
   * Called only for a real provider-confirmed success in the CURRENT modal session: never for a local
   * mock success, never when the honeypot was filled, and never after the modal was closed.
   */
  onSubmitted?: () => void;
}

const FIELD_IDS: Record<(typeof SAMPLE_FIELD_ORDER)[number], string> = {
  fullName: "sample-name",
  company: "sample-company",
  email: "sample-email",
  country: "sample-country",
  note: "sample-note",
};

const labelClass = "block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1 font-semibold";
const inputClass =
  "w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-gold focus:outline-none";

type Failure = { code: SubmitErrorCode; retryable: boolean; retryAfterSeconds?: number };
/** `unlocked`: a real (non-mock) provider-confirmed success from a visitor who did not fill the honeypot. */
type Result = { reference: string; mock: boolean; unlocked: boolean };

function ModalOverlay({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        {/* The overlay stays the scroll container so tall forms still scroll on phones. */}
        <Dialog.Overlay className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          {children}
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  name,
  label,
  required,
  error,
  hint,
  children,
}: {
  name: (typeof SAMPLE_FIELD_ORDER)[number];
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
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const TYPE_TABS: { value: SampleRequestType; label: string }[] = [
  { value: "sample", label: "Sample (100g)" },
  { value: "partner", label: "Trade Partner" },
  { value: "gcms", label: "GC-MS & Specs" },
];

export function SampleModal({
  isOpen,
  onClose,
  defaultType = "sample",
  returnFocusRef,
  onSubmitted,
}: SampleModalProps) {
  const [requestType, setRequestType] = useState<SampleRequestType>(defaultType);
  const [result, setResult] = useState<Result | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [verifierStatus, setVerifierStatus] = useState<TurnstileStatus>("loading");
  const [noteLength, setNoteLength] = useState(0);
  const { submit, busy, markStarted, reset } = useEnquirySubmission("sample");
  const contentRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  /** Modal session: incremented on every close, so results from an earlier session are discarded. */
  const sessionRef = useRef(0);
  /** Cancels the request of the current session when the modal closes. */
  const requestRef = useRef<AbortController | null>(null);

  // Every open starts from the type chosen by the button that opened the modal.
  useEffect(() => {
    if (isOpen) setRequestType(defaultType);
  }, [isOpen, defaultType]);

  // Every close (X, Esc, Cancel, Close Window, link) ends the session: the in-flight request is
  // cancelled and its eventual result ignored, and the previous result and errors are cleared.
  useEffect(() => {
    if (isOpen) return;
    sessionRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    setResult(null);
    setFailure(null);
    setErrors({});
    setNoteLength(0);
    setToken(null);
    reset();
  }, [isOpen, reset]);

  function handleOpenAutoFocus(event: Event) {
    // Focus the dialog itself so its title is read and no phone keyboard opens.
    event.preventDefault();
    openerRef.current = document.activeElement;
    contentRef.current?.focus();
  }

  function handleCloseAutoFocus(event: Event) {
    // Radix only refocuses a Dialog.Trigger and this modal has none, so restore focus here.
    event.preventDefault();
    const opener = openerRef.current;
    // The mobile menu button that opens the modal disappears with the menu.
    const openerAvailable =
      opener instanceof HTMLElement && opener !== document.body && opener.isConnected;
    const target = openerAvailable ? opener : returnFocusRef?.current;
    target?.focus();
  }

  function showFieldErrors(form: HTMLFormElement, fieldErrors: FieldErrors) {
    flushSync(() => setErrors(fieldErrors));
    const first = SAMPLE_FIELD_ORDER.find((n) => fieldErrors[n]);
    const el = first ? form.elements.namedItem(first) : null;
    if (el instanceof HTMLElement) el.focus();
  }

  async function attempt(form: HTMLFormElement) {
    if (busy) return;
    markStarted();
    const data = new FormData(form);
    const checked = validateSampleFields(
      Object.fromEntries(SAMPLE_FIELD_ORDER.map((n) => [n, String(data.get(n) ?? "")])),
    );
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
    const session = sessionRef.current;
    const controller = new AbortController();
    requestRef.current = controller;
    const outcome = await submit({
      requestType,
      fields: checked.data as unknown as Record<string, string>,
      turnstileToken: token ?? "",
      honeypot,
      signal: controller.signal,
    });
    if (requestRef.current === controller) requestRef.current = null;
    // The modal was closed (and possibly reopened) while this request was in flight: discard it.
    if (session !== sessionRef.current || controller.signal.aborted) return;
    if (!outcome) return;
    turnstileRef.current?.reset(); // tokens are single-use

    if (outcome.kind === "success") {
      // Only a real provider-confirmed acceptance opens the reports page: never a local mock success,
      // and never when this browser filled the honeypot (the server's decoy looks like a success).
      const unlocked = outcome.accepted && !outcome.mock && honeypot.trim() === "";
      if (unlocked) {
        grantDocAccess();
        onSubmitted?.();
      }
      setResult({ reference: outcome.reference, mock: outcome.mock, unlocked });
      reset();
      toast.success(`Request submitted. Reference ${outcome.reference}.`);
      return;
    }
    if (outcome.code === "validation" && outcome.fieldErrors) showFieldErrors(form, outcome.fieldErrors);
    setFailure({ code: outcome.code, retryable: outcome.retryable, retryAfterSeconds: outcome.retryAfterSeconds });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void attempt(e.currentTarget);
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <Dialog.Content
        ref={contentRef}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        onInteractOutside={(event) => event.preventDefault()}
        // Focus lands on the dialog after submit; the status line below announces the result.
        {...(result ? { "aria-describedby": undefined } : {})}
        data-request-type={requestType}
        className="relative w-full max-w-2xl rounded-xl bg-background border border-gold/40 shadow-2xl p-6 sm:p-8 my-8 font-sans text-foreground antialiased selection:bg-gold selection:text-white outline-none animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Announces the result inside the dialog, because /reports has no toaster. */}
        <p role="status" className="sr-only">
          {result ? `Request submitted. Your reference is ${result.reference}.` : ""}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {result ? (
          <div className="text-center py-8" data-enquiry-success>
            <div className="mx-auto w-16 h-16 rounded-full bg-forest/10 border border-forest/30 flex items-center justify-center text-forest mb-4">
              <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
            </div>
            <Dialog.Title asChild>
              <h3 className="font-serif text-3xl text-foreground">Request Submitted</h3>
            </Dialog.Title>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
              Thank you. Your request has been submitted to KH International.
            </p>
            <p className="mt-3 text-sm text-foreground">
              Your reference: <strong data-enquiry-reference>{result.reference}</strong>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Please quote this reference if you follow up.</p>
            {result.mock ? <MockModeNotice /> : null}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {result.unlocked ? (
                <Link
                  to="/reports"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 border border-gold bg-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-forest transition-colors rounded-lg shadow-sm"
                >
                  <Unlock className="w-4 h-4" aria-hidden="true" /> View Technical Reports (5 Files)
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-foreground hover:bg-muted transition-colors rounded-lg"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="border-b border-border/60 pb-4 mb-6">
              <span className="text-[11px] tracking-[0.3em] text-gold uppercase block mb-1">
                KH International · B2B Direct
              </span>
              <Dialog.Title asChild>
                <h3 className="font-serif text-2xl sm:text-3xl text-foreground">
                  {requestType === "gcms"
                    ? "Download Specification & GC-MS Report"
                    : requestType === "partner"
                    ? "Become a Global Trade Partner"
                    : "Request Export-Grade Vetriver Oil Sample"}
                </h3>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p className="text-xs text-muted-foreground mt-1">
                  Direct from Villupuram, Tamil Nadu to your lab or formulation facility. Fields marked * are required.
                </p>
              </Dialog.Description>
            </div>

            {/* Selector Tabs */}
            <div role="group" aria-label="Request type" className="grid grid-cols-3 gap-2 mb-6 bg-alabaster p-1.5 rounded-lg border border-border">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={requestType === tab.value}
                  data-request-tab={tab.value}
                  onClick={() => setRequestType(tab.value)}
                  className={`py-2 px-3 text-xs font-medium uppercase tracking-wider rounded-md transition-all ${
                    requestType === tab.value
                      ? "bg-forest text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              onFocusCapture={markStarted}
              noValidate
              aria-busy={busy || undefined}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field name="fullName" label="Full Name" required error={errors.fullName}>
                  {(p) => (
                    <input {...p} type="text" required autoComplete="name" maxLength={LIMITS.fullName.max} placeholder="e.g. Marie Laurent" className={inputClass} />
                  )}
                </Field>
                <Field name="company" label="Company" required error={errors.company}>
                  {(p) => (
                    <input {...p} type="text" required autoComplete="organization" maxLength={LIMITS.company.max} placeholder="e.g. Parfums SA" className={inputClass} />
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <Field
                name="note"
                label="Note"
                error={errors.note}
                hint={`${noteLength} / ${LIMITS.note.max} characters · e.g. intended application or quantity`}
              >
                {(p) => (
                  <textarea
                    {...p}
                    rows={3}
                    maxLength={LIMITS.note.max}
                    onChange={(e) => setNoteLength(e.currentTarget.value.length)}
                    className={`${inputClass} resize-y`}
                  />
                )}
              </Field>

              {/* Honeypot: hidden from people and assistive technology; bots that fill it get a decoy response. */}
              <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="sample-kh-ref">Leave this field empty</label>
                <input id="sample-kh-ref" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
              </div>

              <TurnstileWidget
                ref={turnstileRef}
                action="sample"
                onToken={setToken}
                onStatusChange={setVerifierStatus}
              />

              <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-forest shrink-0" aria-hidden="true" />
                <span>Full traceability & batch-specific CoA documentation included with every dispatch.</span>
              </div>

              {failure ? (
                <EnquiryErrorNotice
                  id="sample-form-error"
                  code={failure.code}
                  retryable={failure.retryable}
                  retryAfterSeconds={failure.retryAfterSeconds}
                  busy={busy}
                  onRetry={() => formRef.current && void attempt(formRef.current)}
                />
              ) : null}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 bg-gold border border-gold px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-forest hover:border-forest transition-colors disabled:opacity-50"
                >
                  {busy ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" aria-hidden="true" /> Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </Dialog.Content>
    </ModalOverlay>
  );
}
