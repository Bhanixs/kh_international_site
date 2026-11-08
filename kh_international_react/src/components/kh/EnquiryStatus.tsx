import { AlertCircle, RotateCcw } from "lucide-react";
import { errorMessage, fallbackContacts, type SubmitErrorCode } from "@/lib/enquiry/client";

/** Inline failure notice with an optional Retry button and verified fallback contacts (if configured). */
export function EnquiryErrorNotice({
  id,
  code,
  retryable,
  retryAfterSeconds,
  onRetry,
  busy,
}: {
  id: string;
  code: SubmitErrorCode;
  retryable: boolean;
  retryAfterSeconds?: number;
  onRetry?: () => void;
  busy?: boolean;
}) {
  const fallback = fallbackContacts();
  const showFallback = code !== "validation" && (fallback.email || fallback.phone);
  const canRetry =
    retryable &&
    onRetry &&
    code !== "validation" &&
    code !== "rate_limited" &&
    code !== "verification_load_failed";
  return (
    <div
      id={id}
      role="alert"
      data-enquiry-error={code}
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-foreground"
    >
      <p className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
        <span>{errorMessage(code, retryAfterSeconds)}</span>
      </p>
      {showFallback ? (
        <p className="mt-2 text-xs text-muted-foreground">
          You can also contact us directly
          {fallback.email ? (
            <>
              {" "}
              at{" "}
              <a className="font-medium text-forest underline" href={`mailto:${fallback.email}`}>
                {fallback.email}
              </a>
            </>
          ) : null}
          {fallback.email && fallback.phone ? " or" : null}
          {fallback.phone ? (
            <>
              {" "}
              by phone on{" "}
              <a
                className="font-medium text-forest underline"
                href={`tel:${fallback.phone.replace(/[^0-9+]/g, "")}`}
              >
                {fallback.phone}
              </a>
            </>
          ) : null}
          .
        </p>
      ) : null}
      {canRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={busy}
          data-enquiry-retry
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-widest text-foreground hover:bg-muted disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {busy ? "Retrying…" : "Retry"}
        </button>
      ) : null}
    </div>
  );
}

/** Shown on success when the local mock transport handled the request. */
export function MockModeNotice() {
  return (
    <p
      data-enquiry-mock
      className="mt-4 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground"
    >
      Test mode: this enquiry was handled by the local mock. No email was sent and the reports page
      was not unlocked.
    </p>
  );
}
