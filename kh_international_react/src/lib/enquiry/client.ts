/**
 * Browser-side submission logic shared by both forms.
 *
 * Idempotency, exactly:
 * - A `submissionId` (UUID v4) is created on the first attempt for a given set of field values.
 * - Retrying the SAME values reuses the same id (and the same `submittedAt`), so the server sends
 *   with the same provider idempotency key `kh-enquiry/<submissionId>` and a byte-identical payload.
 * - Changing any field after a failed attempt creates a new id, so a corrected enquiry is never
 *   mistaken for a retry.
 * - The provider deduplicates for 24 hours only (Resend's documented retention). There is no
 *   database, so there is no permanent deduplication.
 */
import { useCallback, useRef, useState } from "react";
import {
  HONEYPOT_FIELD,
  type EnquiryErrorCode,
  type EnquiryResponse,
  type FieldErrors,
  type RequestType,
} from "./schema";

export const ENQUIRY_ENDPOINT = "/api/enquiry";
/** Longer than the server's worst case (verification + two provider attempts). */
export const CLIENT_TIMEOUT_MS = 25_000;

export type SubmitOutcome =
  | { kind: "success"; accepted: boolean; reference: string; mock: boolean }
  | {
      kind: "error";
      code:
        | EnquiryErrorCode
        | "network"
        | "timeout"
        | "aborted"
        | "verification_loading"
        | "verification_load_failed";
      retryable: boolean;
      fieldErrors?: FieldErrors;
      retryAfterSeconds?: number;
    };

type FormKind = "contact" | "sample";

function newId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Fallback for very old browsers: RFC 4122 v4 from getRandomValues.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function postEnquiry(
  body: unknown,
  timeoutMs = CLIENT_TIMEOUT_MS,
  externalSignal?: AbortSignal,
): Promise<SubmitOutcome> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  // The caller (e.g. a closing modal) can cancel the request; its result is then discarded.
  const onExternalAbort = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort);
  let res: Response;
  try {
    res = await fetch(ENQUIRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
      signal: controller.signal,
    });
  } catch {
    if (externalSignal?.aborted && !timedOut)
      return { kind: "error", code: "aborted", retryable: false };
    // Unknown whether the server received it: the user may retry safely with the same id.
    return { kind: "error", code: timedOut ? "timeout" : "network", retryable: true };
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }

  let data: EnquiryResponse | null = null;
  try {
    data = (await res.json()) as EnquiryResponse;
  } catch {
    data = null;
  }
  if (!data || typeof data !== "object") {
    return {
      kind: "error",
      code: res.status >= 500 ? "delivery_unconfirmed" : "bad_request",
      retryable: res.status >= 500,
    };
  }
  if (data.ok) {
    return {
      kind: "success",
      accepted: data.accepted === true,
      reference: data.reference,
      mock: data.mock === true,
    };
  }
  return {
    kind: "error",
    code: data.code,
    retryable: Boolean(data.retryable),
    fieldErrors: data.fieldErrors,
    retryAfterSeconds: data.retryAfterSeconds,
  };
}

/**
 * Tracks the submission identity for one form instance.
 * `begin` must be called with the cleaned field values of the attempt.
 */
export function useEnquirySubmission(form: FormKind) {
  const startedAt = useRef<number | null>(null);
  const current = useRef<{ id: string; submittedAt: number; fingerprint: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  /** Call when the form is first shown or touched. */
  const markStarted = useCallback(() => {
    if (startedAt.current === null) startedAt.current = Date.now();
  }, []);

  /** Start over (after success or "submit another"). */
  const reset = useCallback(() => {
    startedAt.current = null;
    current.current = null;
  }, []);

  const submit = useCallback(
    async (args: {
      requestType: RequestType;
      fields: Record<string, string>;
      turnstileToken: string;
      honeypot: string;
      signal?: AbortSignal;
    }): Promise<SubmitOutcome | null> => {
      if (busyRef.current) return null; // double-submit guard
      busyRef.current = true;
      setBusy(true);
      try {
        const now = Date.now();
        if (startedAt.current === null) startedAt.current = now;
        const fingerprint = JSON.stringify([form, args.requestType, args.fields]);
        if (!current.current || current.current.fingerprint !== fingerprint) {
          current.current = { id: newId(), submittedAt: now, fingerprint };
        }
        const body = {
          form,
          requestType: args.requestType,
          fields: args.fields,
          submissionId: current.current.id,
          startedAt: Math.min(startedAt.current, current.current.submittedAt),
          submittedAt: current.current.submittedAt,
          turnstileToken: args.turnstileToken,
          [HONEYPOT_FIELD]: args.honeypot,
        };
        const outcome = await postEnquiry(body, CLIENT_TIMEOUT_MS, args.signal);
        // A conflict means the id was reused with different content: never reuse it again.
        if (outcome.kind === "error" && outcome.code === "conflict") current.current = null;
        if (outcome.kind === "success") current.current = null;
        return outcome;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [form],
  );

  return { submit, busy, markStarted, reset };
}

/**
 * Alternative contact details shown on failure. Only values configured at build time are used;
 * nothing is assumed. Set them once the addresses are verified (VITE_ vars are public by design).
 */
export function fallbackContacts(): { email?: string; phone?: string } {
  const env = import.meta.env as Record<string, string | undefined>;
  const email = env.VITE_ENQUIRY_FALLBACK_EMAIL?.trim();
  const phone = env.VITE_ENQUIRY_FALLBACK_PHONE?.trim();
  return {
    email: email && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : undefined,
    phone: phone && /^\+?[0-9 ()-]{7,20}$/.test(phone) ? phone : undefined,
  };
}

/** User-facing copy for each failure. Never claims delivery; never blames the user for our faults. */
export type SubmitErrorCode = Extract<SubmitOutcome, { kind: "error" }>["code"];

export function errorMessage(code: SubmitErrorCode, retryAfterSeconds?: number): string {
  switch (code) {
    case "validation":
      return "Please check the highlighted fields.";
    case "verification_failed":
      return "The security check did not pass. Please wait for it to refresh, then submit again.";
    case "verification_loading":
      return "The security check is still loading. Please wait a moment, then submit again.";
    case "verification_load_failed":
      return 'The security check could not load, so the form cannot be sent right now. Please check your connection (content blockers can also stop it), then choose "Reload security check".';
    case "verification_unavailable":
      return "The security check is temporarily unavailable. Please try again in a moment.";
    case "rate_limited": {
      const minutes = retryAfterSeconds ? Math.max(1, Math.ceil(retryAfterSeconds / 60)) : null;
      return minutes
        ? `Too many attempts from this connection. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`
        : "Too many attempts from this connection. Please wait a few minutes and try again.";
    }
    case "delivery_failed":
      return "We could not send your enquiry. Please try again.";
    case "delivery_unconfirmed":
    case "timeout":
    case "network":
      return "We could not confirm that your enquiry was sent. Retrying is safe and will not create a duplicate.";
    case "conflict":
      return "This enquiry changed while it was being sent. Please submit it again.";
    case "unavailable":
      return "Online enquiries are temporarily unavailable. Please try again later.";
    default:
      return "Something went wrong while sending your enquiry. Please try again.";
  }
}
