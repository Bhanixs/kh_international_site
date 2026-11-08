/**
 * Cloudflare Turnstile server-side verification.
 * The same response checks run for the live siteverify call and for the local mock.
 */
import type { EnquiryConfig } from "./config.server";

interface SiteverifyResponse {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; kind: "failed"; reason: string }
  | { ok: false; kind: "unavailable"; reason: string };

/** Local-only mock. Tokens: mock-pass, mock-fail, mock-unavailable, mock-wrong-host, mock-wrong-action. */
function mockSiteverify(
  token: string,
  expectedHost: string,
  expectedAction: string,
): SiteverifyResponse | "unavailable" {
  switch (token) {
    case "mock-pass":
      return { success: true, hostname: expectedHost, action: expectedAction };
    case "mock-unavailable":
      return "unavailable";
    case "mock-wrong-host":
      return { success: true, hostname: "attacker.example", action: expectedAction };
    case "mock-wrong-action":
      return { success: true, hostname: expectedHost, action: "other" };
    default:
      return { success: false, "error-codes": ["invalid-input-response"] };
  }
}

export async function verifyTurnstile(
  config: EnquiryConfig,
  token: string,
  opts: {
    expectedHosts: string[];
    expectedAction: string;
    remoteIp?: string;
    fetchImpl?: typeof fetch;
  },
): Promise<VerifyResult> {
  if (!token) return { ok: false, kind: "failed", reason: "missing token" };

  let body: SiteverifyResponse;
  if (config.turnstileMode === "mock") {
    const r = mockSiteverify(token, opts.expectedHosts[0] ?? "localhost", opts.expectedAction);
    if (r === "unavailable") return { ok: false, kind: "unavailable", reason: "mock outage" };
    body = r;
  } else {
    const form = new URLSearchParams({ secret: config.turnstileSecret, response: token });
    if (opts.remoteIp && opts.remoteIp !== "unknown") form.set("remoteip", opts.remoteIp);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.verifyTimeoutMs);
    try {
      // The URL is Cloudflare's siteverify endpoint; config only allows a loopback override for tests.
      const res = await (opts.fetchImpl ?? fetch)(config.turnstileVerifyUrl, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      if (!res.ok)
        return { ok: false, kind: "unavailable", reason: `siteverify HTTP ${res.status}` };
      const parsed: unknown = await res.json();
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof (parsed as SiteverifyResponse).success !== "boolean"
      ) {
        return { ok: false, kind: "unavailable", reason: "malformed siteverify response" };
      }
      body = parsed as SiteverifyResponse;
    } catch (error) {
      return {
        ok: false,
        kind: "unavailable",
        reason: error instanceof Error ? error.name : "network",
      };
    } finally {
      clearTimeout(timer);
    }
  }

  if (!body.success)
    return {
      ok: false,
      kind: "failed",
      reason: (body["error-codes"] ?? []).join(",") || "rejected",
    };
  if (
    typeof body.hostname !== "string" ||
    !opts.expectedHosts.includes(body.hostname.toLowerCase())
  ) {
    return { ok: false, kind: "failed", reason: "hostname mismatch" };
  }
  if (body.action !== opts.expectedAction)
    return { ok: false, kind: "failed", reason: "action mismatch" };
  return { ok: true };
}
