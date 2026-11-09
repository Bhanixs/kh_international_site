/**
 * POST /api/enquiry: one endpoint for the contact form and the sample/report request form.
 *
 * Order of checks:
 *   loopback context → configuration → origin → content type → body size → JSON
 *   → configuration failure (503) → rate limit → validation → Turnstile
 *   → honeypot (decoy, nothing sent) → send with one retry → response
 *
 * Success (200, accepted: true) for a real submission is returned ONLY after the email provider
 * confirmed acceptance. Acceptance is not inbox delivery; the client copy never claims delivery.
 *
 * The honeypot decoy is deliberately indistinguishable from a real success in its response body,
 * and it is reached only after the same rate limit, validation and Turnstile checks as everyone else.
 * The browser client knows when its own honeypot field was filled and never unlocks anything then.
 */
import {
  enquiryPayloadSchema,
  fieldErrorsFrom,
  HONEYPOT_FIELD,
  type EnquiryResponse,
} from "@/lib/enquiry/schema";
import { loadConfig, parseAllowedOrigins, readEnv, type EnquiryConfig } from "./config.server";
import { buildEnquiryEmail, referenceFor } from "./email.server";
import { checkRateLimit } from "./ratelimit.server";
import {
  checkOrigin,
  clientIp,
  isJsonRequest,
  isLoopbackRequest,
  readBodyLimited,
} from "./request.server";
import { createTransport, type EmailTransport, type SendOutcome } from "./transport.server";
import { verifyTurnstile } from "./turnstile.server";

const RETRY_DELAY_MS = 600;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface HandlerDeps {
  env?: Record<string, string | undefined>;
  transport?: EmailTransport;
  fetchImpl?: typeof fetch;
}

function json(body: EnquiryResponse, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

/** Structured log line without personal data (no names, emails, phone numbers or messages). */
function log(entry: Record<string, unknown>) {
  console.info(JSON.stringify({ evt: "enquiry", ...entry }));
}

/** Response for every method other than POST. */
export function methodNotAllowed() {
  return new Response(JSON.stringify({ ok: false, code: "bad_request", retryable: false }), {
    status: 405,
    headers: {
      allow: "POST",
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

/**
 * Sends with at most one retry, always with the same idempotency key and the same payload.
 * Returns the final outcome plus whether any attempt was ambiguous (may have been accepted).
 */
async function sendWithRetry(
  transport: EmailTransport,
  email: ReturnType<typeof buildEnquiryEmail>,
  key: string,
  mockFault?: string,
): Promise<{ outcome: SendOutcome; attempts: number; sawAmbiguous: boolean }> {
  let outcome = await transport.send(email, key, { mockFault });
  let attempts = 1;
  let sawAmbiguous = outcome.status === "error" && outcome.ambiguous;
  if (outcome.status === "error" && outcome.retryable) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    outcome = await transport.send(email, key, { mockFault });
    attempts = 2;
    if (outcome.status === "error" && outcome.ambiguous) sawAmbiguous = true;
  }
  return { outcome, attempts, sawAmbiguous };
}

export async function handleEnquiryRequest(
  request: Request,
  deps: HandlerDeps = {},
): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed();

  const env = deps.env ?? readEnv();
  const configResult = loadConfig(env, { loopback: isLoopbackRequest(request) });
  // The origin decision does not depend on the rest of the configuration being valid.
  const parsedOrigins = parseAllowedOrigins(env.ENQUIRY_ALLOWED_ORIGINS);
  const allowedOrigins = parsedOrigins.ok ? parsedOrigins.value : [];

  const origin = checkOrigin(request, allowedOrigins);
  if (!origin.ok) {
    log({ outcome: "forbidden_origin", reason: origin.reason });
    return json({ ok: false, code: "forbidden_origin", retryable: false }, 403);
  }
  if (!isJsonRequest(request))
    return json({ ok: false, code: "unsupported_media_type", retryable: false }, 415);

  const raw = await readBodyLimited(request);
  if (raw === null) return json({ ok: false, code: "payload_too_large", retryable: false }, 413);

  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ ok: false, code: "bad_request", retryable: false }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return json({ ok: false, code: "bad_request", retryable: false }, 400);
  }

  // Never accept work we cannot deliver: misconfiguration is reported, not hidden behind a fake success.
  if (!configResult.ok) {
    log({ outcome: "unavailable", reason: `config: ${configResult.reason}` });
    return json({ ok: false, code: "unavailable", retryable: false }, 503);
  }
  const config: EnquiryConfig = configResult.config;

  // Rate limit before anything else that does work, including the honeypot decoy.
  const ip = clientIp(request);
  const rawId = (input as Record<string, unknown>).submissionId;
  const limit = checkRateLimit(ip, typeof rawId === "string" && UUID.test(rawId) ? rawId : null);
  if (!limit.ok) {
    log({ outcome: "rate_limited" });
    return json(
      {
        ok: false,
        code: "rate_limited",
        retryable: true,
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      429,
      { "retry-after": String(limit.retryAfterSeconds) },
    );
  }

  const parsed = enquiryPayloadSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFrom(parsed.error, "fields");
    log({ outcome: "validation", fields: Object.keys(fieldErrors) });
    return json({ ok: false, code: "validation", retryable: false, fieldErrors }, 400);
  }
  const payload = parsed.data;
  const reference = await referenceFor(payload.submissionId);

  const verified = await verifyTurnstile(config, payload.turnstileToken, {
    expectedHosts: [origin.host],
    expectedAction: payload.form,
    remoteIp: ip,
    fetchImpl: deps.fetchImpl,
  });
  if (!verified.ok) {
    log({ reference, outcome: `verification_${verified.kind}`, reason: verified.reason });
    return verified.kind === "unavailable"
      ? json({ ok: false, code: "verification_unavailable", retryable: true }, 503)
      : json({ ok: false, code: "verification_failed", retryable: true }, 403);
  }

  // Honeypot: same response shape as a real success, but nothing is sent.
  if (payload[HONEYPOT_FIELD].trim() !== "") {
    log({ reference, outcome: "honeypot" });
    return json(
      {
        ok: true,
        accepted: true,
        reference,
        ...(config.transport === "mock" ? { mock: true as const } : {}),
      },
      200,
    );
  }

  const email = buildEnquiryEmail(payload, reference);
  const transport = deps.transport ?? createTransport(config);
  const idempotencyKey = `kh-enquiry/${payload.submissionId}`;
  const mockFault =
    transport.kind === "mock" ? (request.headers.get("x-kh-mock-fault") ?? undefined) : undefined;

  const { outcome, attempts, sawAmbiguous } = await sendWithRetry(
    transport,
    email,
    idempotencyKey,
    mockFault,
  );

  if (outcome.status === "accepted") {
    log({
      reference,
      form: payload.form,
      requestType: payload.requestType,
      outcome: "accepted",
      attempts,
      transport: transport.kind,
    });
    return json(
      {
        ok: true,
        accepted: true,
        reference,
        ...(transport.kind === "mock" ? { mock: true as const } : {}),
      },
      200,
    );
  }

  log({
    reference,
    outcome: "send_error",
    code: outcome.code,
    attempts,
    ambiguous: sawAmbiguous,
    transport: transport.kind,
  });
  if (outcome.config) return json({ ok: false, code: "unavailable", retryable: false }, 503);
  if (outcome.conflict) return json({ ok: false, code: "conflict", retryable: false }, 409);
  if (sawAmbiguous) return json({ ok: false, code: "delivery_unconfirmed", retryable: true }, 502);
  return json({ ok: false, code: "delivery_failed", retryable: true }, 502);
}
