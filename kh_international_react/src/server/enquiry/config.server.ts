/**
 * Reads and checks the enquiry configuration on every request.
 *
 * Production safety (Stage 1A.1, C1): mock email mode, mock Turnstile, Cloudflare's Turnstile test
 * secrets and provider URL overrides are allowed ONLY in a "local testing context":
 *
 *   - the request itself was addressed to a loopback host (Host, X-Forwarded-Host, the request URL
 *     and Origin are all localhost / 127.0.0.1 / [::1]), and
 *   - no platform marker such as VERCEL is present (an extra deny, not the primary signal).
 *
 * A deployed site is reached through its public hostname, and hosting platforms route requests by
 * that hostname, so a deployed request is never a loopback request. This distinction does not depend
 * on any platform environment variable being exposed at runtime. Anything missing, malformed or
 * conflicting fails closed: `ok: false`, which the handler turns into 503 "unavailable".
 */

export type TransportMode = "resend" | "mock";
export type TurnstileMode = "live" | "mock";

export interface RequestContext {
  /** True only when every host signal of the request is a loopback host (see isLoopbackRequest). */
  loopback: boolean;
}

export interface EnquiryConfig {
  transport: TransportMode;
  turnstileMode: TurnstileMode;
  /** Local testing context: loopback request and no platform marker. */
  local: boolean;
  resend: { apiKey: string; apiBase: string; to: string; from: string; fromName: string };
  turnstileSecret: string;
  turnstileVerifyUrl: string;
  allowedOrigins: string[];
  providerTimeoutMs: number;
  verifyTimeoutMs: number;
  outboxDir: string;
}

export type ConfigResult = { ok: true; config: EnquiryConfig } | { ok: false; reason: string };

export const RESEND_DEFAULT_BASE = "https://api.resend.com";
export const TURNSTILE_DEFAULT_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MOCK_ACK = "local-testing-only";
// Cloudflare's published always-pass / always-fail / already-spent test secrets.
const TEST_SECRET = /^[123]x0{20,}A{2}$/i;
const SIMPLE_EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
/** Platform markers: if any is present the context is never local, whatever the request says. */
const PLATFORM_MARKERS = ["VERCEL", "VERCEL_ENV", "NOW_REGION", "CF_PAGES", "NETLIFY"];

type Env = Record<string, string | undefined>;

export function readEnv(): Env {
  // Read per request, never at module scope (edge runtimes inject env per request).
  return (globalThis as { process?: { env?: Env } }).process?.env ?? {};
}

export function isLoopbackHostname(hostname: string): boolean {
  return LOOPBACK_HOSTNAMES.has(hostname.toLowerCase());
}

/** Optional integer setting: unset → fallback; set but invalid → error (fail closed). */
function intSetting(env: Env, key: string, fallback: number, min: number, max: number) {
  const raw = env[key];
  if (raw === undefined || raw.trim() === "") return { ok: true as const, value: fallback };
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < min || n > max) {
    return { ok: false as const, reason: `${key} must be an integer between ${min} and ${max}` };
  }
  return { ok: true as const, value: n };
}

/** URL override that is only acceptable in a local context and only towards a loopback server. */
function overrideUrl(env: Env, key: string, fallback: string, local: boolean) {
  const raw = (env[key] ?? "").trim();
  if (raw === "" || raw === fallback) return { ok: true as const, value: fallback };
  if (!local)
    return { ok: false as const, reason: `${key} override is refused outside local testing` };
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false as const, reason: `${key} is not a valid URL` };
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    !isLoopbackHostname(url.hostname)
  ) {
    return { ok: false as const, reason: `${key} must point to a loopback http(s) server` };
  }
  return { ok: true as const, value: raw.replace(/\/+$/, "") };
}

export function parseAllowedOrigins(raw: string | undefined) {
  const out: string[] = [];
  for (const item of (raw ?? "").split(",")) {
    const value = item.trim();
    if (!value) continue;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return {
        ok: false as const,
        reason: `ENQUIRY_ALLOWED_ORIGINS entry is not a URL: ${value.slice(0, 60)}`,
      };
    }
    const origin = `${url.protocol}//${url.host}`.toLowerCase();
    const isHttpLocal = url.protocol === "http:" && isLoopbackHostname(url.hostname);
    if (
      (url.protocol !== "https:" && !isHttpLocal) ||
      value.replace(/\/+$/, "").toLowerCase() !== origin
    ) {
      return {
        ok: false as const,
        reason: `ENQUIRY_ALLOWED_ORIGINS entry must be a bare https origin: ${value.slice(0, 60)}`,
      };
    }
    out.push(origin);
  }
  return { ok: true as const, value: out };
}

export function loadConfig(env: Env, ctx: RequestContext): ConfigResult {
  const platformMarker = PLATFORM_MARKERS.find((k) => (env[k] ?? "").trim() !== "");
  const local = ctx.loopback && !platformMarker;

  // Strict parsing: unset means the production default; anything else must match exactly.
  const transportRaw = env.ENQUIRY_TRANSPORT;
  const turnstileRaw = env.TURNSTILE_MODE;
  const transport = transportRaw === undefined || transportRaw === "" ? "resend" : transportRaw;
  const turnstileMode = turnstileRaw === undefined || turnstileRaw === "" ? "live" : turnstileRaw;
  if (transport !== "resend" && transport !== "mock") {
    return { ok: false, reason: "ENQUIRY_TRANSPORT must be exactly 'resend' or 'mock'" };
  }
  if (turnstileMode !== "live" && turnstileMode !== "mock") {
    return { ok: false, reason: "TURNSTILE_MODE must be exactly 'live' or 'mock'" };
  }

  const ack = env.ENQUIRY_MOCK_ACKNOWLEDGE;
  if (ack !== undefined && ack !== "" && ack !== MOCK_ACK) {
    return { ok: false, reason: "ENQUIRY_MOCK_ACKNOWLEDGE has an unexpected value" };
  }
  if (transport === "mock" || turnstileMode === "mock") {
    if (!local) {
      return {
        ok: false,
        reason: platformMarker
          ? `mock mode is refused on a hosting platform (${platformMarker})`
          : "mock mode is refused outside a loopback request",
      };
    }
    if (ack !== MOCK_ACK) return { ok: false, reason: "mock mode needs ENQUIRY_MOCK_ACKNOWLEDGE" };
  }

  const apiBase = overrideUrl(env, "RESEND_API_BASE", RESEND_DEFAULT_BASE, local);
  if (!apiBase.ok) return { ok: false, reason: apiBase.reason };
  const verifyUrl = overrideUrl(env, "TURNSTILE_VERIFY_URL", TURNSTILE_DEFAULT_VERIFY_URL, local);
  if (!verifyUrl.ok) return { ok: false, reason: verifyUrl.reason };

  const resend = {
    apiKey: (env.RESEND_API_KEY ?? "").trim(),
    apiBase: apiBase.value,
    to: (env.ENQUIRY_TO ?? "").trim(),
    from: (env.ENQUIRY_FROM ?? "").trim(),
    fromName: (env.ENQUIRY_FROM_NAME ?? "KH International Website")
      .replace(/[\r\n"<>]/g, "")
      .trim(),
  };
  if (transport === "resend") {
    if (!resend.apiKey) return { ok: false, reason: "RESEND_API_KEY is not set" };
    if (!SIMPLE_EMAIL.test(resend.to))
      return { ok: false, reason: "ENQUIRY_TO is missing or invalid" };
    if (!SIMPLE_EMAIL.test(resend.from))
      return { ok: false, reason: "ENQUIRY_FROM is missing or invalid" };
  }

  const turnstileSecret = (env.TURNSTILE_SECRET_KEY ?? "").trim();
  if (turnstileMode === "live") {
    if (!turnstileSecret) return { ok: false, reason: "TURNSTILE_SECRET_KEY is not set" };
    if (TEST_SECRET.test(turnstileSecret) && !local) {
      return { ok: false, reason: "Turnstile test secret is refused outside local testing" };
    }
  }

  const origins = parseAllowedOrigins(env.ENQUIRY_ALLOWED_ORIGINS);
  if (!origins.ok) return { ok: false, reason: origins.reason };
  const providerTimeout = intSetting(env, "ENQUIRY_PROVIDER_TIMEOUT_MS", 6000, 100, 15000);
  if (!providerTimeout.ok) return { ok: false, reason: providerTimeout.reason };
  const verifyTimeout = intSetting(env, "TURNSTILE_TIMEOUT_MS", 4000, 100, 10000);
  if (!verifyTimeout.ok) return { ok: false, reason: verifyTimeout.reason };

  return {
    ok: true,
    config: {
      transport,
      turnstileMode,
      local,
      resend,
      turnstileSecret,
      turnstileVerifyUrl: verifyUrl.value,
      allowedOrigins: origins.value,
      providerTimeoutMs: providerTimeout.value,
      verifyTimeoutMs: verifyTimeout.value,
      outboxDir: (env.ENQUIRY_OUTBOX_DIR ?? "").trim() || ".enquiry-outbox",
    },
  };
}
