/**
 * Public Turnstile site key (VITE_ values are compiled into the browser bundle by design).
 * "mock" selects the local test mode; empty means the widget is not configured.
 */
export function turnstileSiteKey(): string {
  return (
    (import.meta.env as Record<string, string | undefined>).VITE_TURNSTILE_SITE_KEY ?? ""
  ).trim();
}
