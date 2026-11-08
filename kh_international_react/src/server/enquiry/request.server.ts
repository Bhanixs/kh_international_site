/**
 * Transport-level request checks: origin, content type, body size, client IP.
 */
import { LIMITS } from "@/lib/enquiry/schema";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** The host the browser addressed, as seen behind the platform proxy. */
function requestHost(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwarded || request.headers.get("host") || new URL(request.url).host;
  return host.toLowerCase();
}

/**
 * Same-origin check for a JSON POST from our own pages.
 * - `Origin` must be present (browsers always send it on a cross-origin-capable POST).
 * - It must match an explicitly allowed origin, or have the same host as the request
 *   over https (http only for localhost).
 * - If the browser sends `Sec-Fetch-Site`, it must be `same-origin`.
 */
export function checkOrigin(
  request: Request,
  allowedOrigins: string[],
): { ok: true; host: string } | { ok: false; reason: string } {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return { ok: false, reason: "missing origin" };

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return { ok: false, reason: "malformed origin" };
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin")
    return { ok: false, reason: `sec-fetch-site ${fetchSite}` };

  const normalised = `${parsed.protocol}//${parsed.host}`.toLowerCase();
  if (allowedOrigins.map((o) => o.toLowerCase()).includes(normalised)) {
    return { ok: true, host: parsed.hostname.toLowerCase() };
  }

  const host = requestHost(request);
  if (parsed.host.toLowerCase() !== host) return { ok: false, reason: "origin host mismatch" };
  const isLocal = LOCAL_HOSTS.has(parsed.hostname.toLowerCase());
  if (parsed.protocol !== "https:" && !(isLocal && parsed.protocol === "http:")) {
    return { ok: false, reason: "insecure origin" };
  }
  return { ok: true, host: parsed.hostname.toLowerCase() };
}

function hostnameOf(hostWithPort: string): string | null {
  try {
    return new URL(`http://${hostWithPort.trim()}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * True only if EVERY host signal of the request is a loopback host: the Host header (required),
 * each X-Forwarded-Host value, the request URL and the Origin (when sent). A deployed site is reached
 * through its public hostname, so a request routed to a deployment can never satisfy this.
 * Used to decide whether local-only testing features (mock modes, test keys) may be enabled.
 */
export function isLoopbackRequest(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return false;
  const candidates = [host, ...(request.headers.get("x-forwarded-host")?.split(",") ?? [])];
  try {
    candidates.push(new URL(request.url).host);
  } catch {
    return false;
  }
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      candidates.push(new URL(origin).host);
    } catch {
      return false;
    }
  }
  return candidates.every((h) => {
    const name = hostnameOf(h);
    return name !== null && LOCAL_HOSTS.has(name);
  });
}

export function isJsonRequest(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  return /^application\/json(\s*;|$)/i.test(type.trim());
}

/** Reads the body as text, stopping as soon as it exceeds the limit. Returns null if too large. */
export async function readBodyLimited(
  request: Request,
  maxBytes = LIMITS.bodyBytes,
): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(all);
}

/**
 * Client IP for rate limiting. On Vercel, `x-real-ip` / `x-forwarded-for` are set by the platform.
 * Elsewhere (local testing) these headers are client-controlled, so the limiter is best effort only.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
