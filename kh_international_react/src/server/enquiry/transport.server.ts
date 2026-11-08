/**
 * Email transport interface plus the two implementations:
 * - Resend (production), called with fetch: no SDK dependency.
 * - Mock (local testing only; refused outside a loopback request by config.server.ts).
 */
import type { EnquiryConfig } from "./config.server";
import type { EnquiryEmail } from "./email.server";

export type SendOutcome =
  | { status: "accepted"; id: string }
  | {
      status: "error";
      /** Short machine code for logs, e.g. http_500, timeout, network, idempotency_conflict. */
      code: string;
      /** Worth one more attempt with the same idempotency key. */
      retryable: boolean;
      /** The provider may have accepted the message even though we did not get a confirmation. */
      ambiguous: boolean;
      /** Configuration problem on our side (bad key, unverified domain): report as unavailable. */
      config?: boolean;
      /** Same key reused with a different payload. */
      conflict?: boolean;
    };

export interface EmailTransport {
  readonly kind: "resend" | "mock";
  send(
    email: EnquiryEmail,
    idempotencyKey: string,
    opts?: { mockFault?: string },
  ): Promise<SendOutcome>;
}

// ---------------------------------------------------------------------------
// Resend
// ---------------------------------------------------------------------------

export function createResendTransport(
  config: EnquiryConfig,
  fetchImpl: typeof fetch = fetch,
): EmailTransport {
  const { apiKey, apiBase, to, from, fromName } = config.resend;
  return {
    kind: "resend",
    async send(email, idempotencyKey) {
      const body = JSON.stringify({
        from: `${fromName} <${from}>`,
        to: [to],
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text,
        html: email.html,
        tags: email.tags,
      });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.providerTimeoutMs);
      let res: Response;
      try {
        res = await fetchImpl(`${apiBase}/emails`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body,
          signal: controller.signal,
        });
      } catch (error) {
        const timedOut = error instanceof Error && error.name === "AbortError";
        // The request may have reached Resend: ambiguous. Retrying with the same key is safe.
        return {
          status: "error",
          code: timedOut ? "timeout" : "network",
          retryable: true,
          ambiguous: true,
        };
      } finally {
        clearTimeout(timer);
      }

      let data: { id?: unknown; name?: unknown } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        /* non-JSON body */
      }

      if (res.ok && typeof data.id === "string" && data.id)
        return { status: "accepted", id: data.id };
      if (res.ok)
        return { status: "error", code: "malformed_response", retryable: true, ambiguous: true };

      const name = typeof data.name === "string" ? data.name : "";
      if (res.status === 409) {
        if (name === "concurrent_idempotent_requests") {
          return {
            status: "error",
            code: "idempotency_in_progress",
            retryable: true,
            ambiguous: true,
          };
        }
        return {
          status: "error",
          code: "idempotency_conflict",
          retryable: false,
          ambiguous: false,
          conflict: true,
        };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          status: "error",
          code: `http_${res.status}`,
          retryable: false,
          ambiguous: false,
          config: true,
        };
      }
      if (res.status === 429)
        return { status: "error", code: "http_429", retryable: true, ambiguous: false };
      if (res.status === 503)
        return { status: "error", code: "http_503", retryable: true, ambiguous: false };
      if (res.status >= 500)
        return { status: "error", code: `http_${res.status}`, retryable: true, ambiguous: true };
      // 400/422: the request was rejected as invalid (e.g. unverified sender domain). Not retryable.
      return {
        status: "error",
        code: `http_${res.status}${name ? "_" + name : ""}`,
        retryable: false,
        ambiguous: false,
        config: true,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Mock (local testing only)
// ---------------------------------------------------------------------------

interface MockRecord {
  id: string;
  payload: string;
  at: number;
  /** True until the outbox write finished, like a request Resend is still processing. */
  pending: boolean;
}

const IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000; // mirrors Resend's documented 24 h window
const mockKeys = new Map<string, MockRecord>();
const mockAttempts = new Map<string, number>();
let mockCounter = 0;

/**
 * Faults (header `x-kh-mock-fault`, honoured only by this mock):
 *   500 | 500-once | 503 | 429 | 401 | timeout | timeout-once | timeout-after-accept | conflict
 * "-once" faults apply to the first attempt for a key only. "timeout-after-accept" records the message
 * as accepted and then reports a timeout, reproducing the ambiguous case.
 * Idempotency is emulated atomically (check-and-set before any await), so parallel requests with the
 * same key behave like Resend: one send, the other gets "concurrent request in progress" and retries.
 */
export function createMockTransport(config: EnquiryConfig): EmailTransport {
  return {
    kind: "mock",
    async send(email, idempotencyKey, opts) {
      const fault = opts?.mockFault ?? "";
      const attempt = (mockAttempts.get(idempotencyKey) ?? 0) + 1;
      mockAttempts.set(idempotencyKey, attempt);
      const first = attempt === 1;

      const fail = (
        code: string,
        retryable: boolean,
        ambiguous: boolean,
        extra: Partial<SendOutcome> = {},
      ) => ({ status: "error", code, retryable, ambiguous, ...extra }) as SendOutcome;

      if (fault === "500" || (fault === "500-once" && first)) return fail("http_500", true, true);
      if (fault === "503") return fail("http_503", true, false);
      if (fault === "429") return fail("http_429", true, false);
      if (fault === "401") return fail("http_401", false, false, { config: true });
      if (fault === "timeout" || (fault === "timeout-once" && first))
        return fail("timeout", true, true);

      const now = Date.now();
      for (const [k, r] of mockKeys) if (now - r.at > IDEMPOTENCY_RETENTION_MS) mockKeys.delete(k);

      const payload = JSON.stringify(email);
      const existing = mockKeys.get(idempotencyKey);
      if (existing) {
        if (existing.payload !== payload || fault === "conflict") {
          return fail("idempotency_conflict", false, false, { conflict: true });
        }
        if (existing.pending) return fail("idempotency_in_progress", true, true);
        return { status: "accepted", id: existing.id }; // replay: no second "send"
      }

      mockCounter += 1;
      const id = `mock_${now.toString(36)}_${mockCounter}`;
      const record: MockRecord = { id, payload, at: now, pending: true };
      mockKeys.set(idempotencyKey, record); // set before any await: atomic check-and-set
      await writeOutbox(config.outboxDir, {
        id,
        idempotencyKey,
        receivedAt: new Date(now).toISOString(),
        email,
      });
      record.pending = false;

      if (fault === "timeout-after-accept" && first) return fail("timeout", true, true);
      return { status: "accepted", id };
    },
  };
}

async function writeOutbox(dir: string, record: Record<string, unknown>) {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${String(record.id)}.json`),
      JSON.stringify(record, null, 2),
      "utf8",
    );
  } catch (error) {
    // The outbox is a testing convenience; failing to write it must not change the outcome.
    console.warn(
      JSON.stringify({
        evt: "enquiry_mock_outbox_write_failed",
        error: String(error).slice(0, 200),
      }),
    );
  }
}

export function createTransport(config: EnquiryConfig): EmailTransport {
  return config.transport === "mock" ? createMockTransport(config) : createResendTransport(config);
}
