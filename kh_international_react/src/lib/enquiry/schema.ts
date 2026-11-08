/**
 * Shared enquiry schema, used by the browser forms and by POST /api/enquiry.
 * The server is authoritative; the client runs the same rules only for faster feedback.
 * This module must stay free of secrets and server-only imports.
 */
import { z } from "zod";

export const REQUEST_TYPES = ["contact", "sample", "partner", "gcms"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];
export type SampleRequestType = Exclude<RequestType, "contact">;

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  contact: "Trade enquiry",
  sample: "Sample request (100 g)",
  partner: "Trade partnership",
  gcms: "GC-MS & specifications request",
};

/** Name of the hidden honeypot input. Deliberately unlike anything browsers autofill. */
export const HONEYPOT_FIELD = "kh_ref_code";

export const LIMITS = {
  fullName: { min: 2, max: 100 },
  company: { min: 2, max: 150 },
  email: { max: 254 },
  country: { min: 2, max: 100 },
  phone: { min: 7, max: 20, minDigits: 7 },
  product: { max: 150 },
  volume: { max: 100 },
  message: { min: 10, max: 2000 },
  note: { max: 500 },
  /** Upper bound for the raw JSON request body, in bytes. */
  bodyBytes: 10 * 1024,
} as const;

// ---------------------------------------------------------------------------
// Sanitisation (identical on client and server)
// ---------------------------------------------------------------------------

// Zero-width space, LRM/RLM, bidi embeddings/overrides/isolates, word joiner and BOM.
// ZWNJ/ZWJ (U+200C/U+200D) are kept because some scripts and emoji need them.
const INVISIBLE = /[\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g;

/** One-line value: no line breaks or control characters, whitespace collapsed, trimmed. */
export function cleanSingleLine(value: string): string {
  return (
    value
      .normalize("NFC")
      .replace(INVISIBLE, "")
      // Removing control characters is the purpose of this pattern.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Multi-line value: normalised line endings, control characters removed, at most 2 blank lines in a row. */
export function cleanMultiLine(value: string): string {
  return (
    value
      .normalize("NFC")
      .replace(INVISIBLE, "")
      .replace(/\r\n?/g, "\n")
      .replace(/[\u2028\u2029]/g, "\n")
      .replace(/\t/g, " ")
      // Removing control characters is the purpose of this pattern.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, "")
      .replace(/[ ]+\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim()
  );
}

/**
 * Internationalised domain names (e.g. société.fr) are converted to their ASCII "punycode" form
 * (xn--socit-esab.fr), which every mail system accepts and which addresses the same mailbox.
 * Anything that is not a plain domain is left unchanged so that validation rejects it.
 */
function asciiDomain(domain: string): string {
  const lower = domain.toLowerCase();
  // Printable ASCII only → already a plain domain. Characters that URL parsing would treat as
  // separators (including backslash) → leave unchanged so validation rejects the address.
  if (/^[!-~]*$/.test(lower) || /[/?#\\:@[\]%]/.test(lower)) return lower;
  try {
    return new URL(`http://${lower}`).hostname || lower;
  } catch {
    return lower;
  }
}

/** Lower-cases the domain part (converting an IDN domain to punycode); the local part is kept as typed. */
export function normaliseEmail(value: string): string {
  const cleaned = cleanSingleLine(value).replace(/\s/g, "");
  const at = cleaned.lastIndexOf("@");
  if (at < 1) return cleaned;
  return cleaned.slice(0, at) + "@" + asciiDomain(cleaned.slice(at + 1));
}

const asText = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : v);

// ---------------------------------------------------------------------------
// Field schemas
// ---------------------------------------------------------------------------

const single = (min: number, max: number, message: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? cleanSingleLine(v) : asText(v)),
    z
      .string({ invalid_type_error: message })
      .min(min, message)
      .max(max, `Please use at most ${max} characters.`),
  );

const optionalSingle = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? cleanSingleLine(v) : asText(v)),
    z.string().max(max, `Please use at most ${max} characters.`),
  );

const emailField = z.preprocess(
  (v) => (typeof v === "string" ? normaliseEmail(v) : asText(v)),
  z
    .string({ invalid_type_error: "Please enter a valid email address." })
    .min(1, "Please enter your business email address.")
    .max(LIMITS.email.max, "Please enter a valid email address.")
    // A single mailbox only: no lists, display names or angle brackets.
    .refine((v) => !/[,;<>()[\]\\"\s]/.test(v), "Please enter a single valid email address.")
    // Non-ASCII characters before the @ need SMTPUTF8 support end to end, which is not verified for
    // the mail chain used here, so such addresses are declined with a specific explanation.
    .refine(
      (v) => /^[!-~]*$/.test(v.slice(0, Math.max(0, v.lastIndexOf("@")))),
      "Please use an address with only Latin letters, digits and . _ - + before the @.",
    )
    .pipe(z.string().email("Please enter a valid email address.")),
);

const phoneField = z.preprocess(
  (v) => (typeof v === "string" ? cleanSingleLine(v) : asText(v)),
  z
    .string()
    .max(LIMITS.phone.max, "Please enter a valid phone number, including country code.")
    .refine(
      (v) =>
        v === "" ||
        (/^[0-9+\-() ]+$/.test(v) &&
          v.length >= LIMITS.phone.min &&
          (v.match(/[0-9]/g)?.length ?? 0) >= LIMITS.phone.minDigits),
      "Please enter a valid phone number, including country code.",
    ),
);

const multi = (min: number, max: number, message: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? cleanMultiLine(v) : asText(v)),
    z
      .string({ invalid_type_error: message })
      .min(min, message)
      .max(max, `Please use at most ${max} characters.`),
  );

// ---------------------------------------------------------------------------
// Form schemas
// ---------------------------------------------------------------------------

export const contactFieldsSchema = z.object({
  fullName: single(LIMITS.fullName.min, LIMITS.fullName.max, "Please enter your full name."),
  company: single(LIMITS.company.min, LIMITS.company.max, "Please enter your company name."),
  email: emailField,
  country: single(LIMITS.country.min, LIMITS.country.max, "Please enter your country."),
  phone: phoneField,
  product: optionalSingle(LIMITS.product.max),
  volume: optionalSingle(LIMITS.volume.max),
  message: multi(
    LIMITS.message.min,
    LIMITS.message.max,
    `Please tell us about your enquiry (at least ${LIMITS.message.min} characters).`,
  ),
});

export const sampleFieldsSchema = z.object({
  fullName: single(LIMITS.fullName.min, LIMITS.fullName.max, "Please enter your full name."),
  company: single(LIMITS.company.min, LIMITS.company.max, "Please enter your company name."),
  email: emailField,
  country: single(LIMITS.country.min, LIMITS.country.max, "Please enter your country."),
  note: z.preprocess(
    (v) => (typeof v === "string" ? cleanMultiLine(v) : asText(v)),
    z.string().max(LIMITS.note.max, `Please use at most ${LIMITS.note.max} characters.`),
  ),
});

export type ContactFields = z.infer<typeof contactFieldsSchema>;
export type SampleFields = z.infer<typeof sampleFieldsSchema>;

/** Field order, used to focus the first invalid field. */
export const CONTACT_FIELD_ORDER = [
  "fullName",
  "company",
  "email",
  "country",
  "phone",
  "product",
  "volume",
  "message",
] as const;
export const SAMPLE_FIELD_ORDER = ["fullName", "company", "email", "country", "note"] as const;

const MAX_CLOCK = 4102444800000; // 2100-01-01, a sanity bound for client timestamps

/** Fields every submission carries in addition to the form fields. */
const envelope = {
  submissionId: z.string().uuid(),
  /** When the form was first shown or touched (client clock, ms). */
  startedAt: z.number().int().min(0).max(MAX_CLOCK),
  /** When this submission was first attempted (client clock, ms); unchanged on retry. */
  submittedAt: z.number().int().min(0).max(MAX_CLOCK),
  turnstileToken: z.string().max(4096),
  [HONEYPOT_FIELD]: z.string().max(500),
};

export const enquiryPayloadSchema = z.discriminatedUnion("form", [
  z
    .object({
      form: z.literal("contact"),
      requestType: z.literal("contact"),
      fields: contactFieldsSchema.strict(),
      ...envelope,
    })
    .strict(),
  z
    .object({
      form: z.literal("sample"),
      requestType: z.enum(["sample", "partner", "gcms"]),
      fields: sampleFieldsSchema.strict(),
      ...envelope,
    })
    .strict(),
]);

export type EnquiryPayload = z.infer<typeof enquiryPayloadSchema>;

export type FieldErrors = Record<string, string>;

/** Returns the first message per field, keyed by field name. */
export function fieldErrorsFrom(error: z.ZodError, prefix?: string): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const path = prefix && issue.path[0] === prefix ? issue.path.slice(1) : issue.path;
    const key = path.length ? String(path[0]) : "_form";
    out[key] ??= issue.message;
  }
  return out;
}

export function validateContactFields(input: Record<string, unknown>) {
  const r = contactFieldsSchema.safeParse(input);
  return r.success
    ? ({ ok: true, data: r.data } as const)
    : ({ ok: false, fieldErrors: fieldErrorsFrom(r.error) } as const);
}

export function validateSampleFields(input: Record<string, unknown>) {
  const r = sampleFieldsSchema.safeParse(input);
  return r.success
    ? ({ ok: true, data: r.data } as const)
    : ({ ok: false, fieldErrors: fieldErrorsFrom(r.error) } as const);
}

// ---------------------------------------------------------------------------
// Response contract
// ---------------------------------------------------------------------------

export type EnquiryErrorCode =
  | "validation"
  | "bad_request"
  | "unsupported_media_type"
  | "payload_too_large"
  | "forbidden_origin"
  | "verification_failed"
  | "verification_unavailable"
  | "rate_limited"
  | "conflict"
  | "delivery_failed"
  | "delivery_unconfirmed"
  | "unavailable";

export type EnquirySuccess = {
  ok: true;
  /** True only when the email provider confirmed it accepted the message. */
  accepted: boolean;
  reference: string;
  /** Present only when the local mock transport handled the request. */
  mock?: true;
};

export type EnquiryFailure = {
  ok: false;
  code: EnquiryErrorCode;
  retryable: boolean;
  fieldErrors?: FieldErrors;
  retryAfterSeconds?: number;
};

export type EnquiryResponse = EnquirySuccess | EnquiryFailure;
