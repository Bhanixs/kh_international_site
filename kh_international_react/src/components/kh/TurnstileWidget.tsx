import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { RotateCcw } from "lucide-react";
import { turnstileSiteKey } from "@/lib/enquiry/turnstile-key";

/**
 * Cloudflare Turnstile widget, rendered explicitly and only when the form is mounted/visible.
 *
 * Site key comes from VITE_TURNSTILE_SITE_KEY (public by design):
 * - unset   → nothing rendered; the server reports "unavailable" if it is not configured either.
 * - "mock"  → local test mode: no script is loaded and the token "mock-pass" is issued.
 *             The server accepts mock tokens only in local mock mode on a loopback request.
 * - other   → the real widget (script from challenges.cloudflare.com).
 *
 * Status (reported through onStatusChange): loading → ready, or error when the script cannot load,
 * the widget cannot render, or Turnstile reports an error. In the error state the widget shows a
 * visible explanation and a "Reload security check" button instead of an invisible challenge.
 *
 * Tokens are single-use, so the parent calls reset() after every attempt to get a fresh one.
 */

export type TurnstileStatus = "loading" | "ready" | "error";

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_TIMEOUT_MS = 15_000;
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.khTurnstile = "";
    const fail = (message: string) => {
      clearTimeout(timer);
      script.remove(); // allow a clean retry
      scriptPromise = null;
      reject(new Error(message));
    };
    const timer = setTimeout(() => fail("turnstile script timed out"), SCRIPT_TIMEOUT_MS);
    script.onload = () => {
      clearTimeout(timer);
      if (window.turnstile) resolve(window.turnstile);
      else fail("turnstile script loaded without the API");
    };
    script.onerror = () => fail("turnstile script failed to load");
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function TurnstileWidget({
  action,
  onToken,
  onStatusChange,
  ref,
}: {
  action: "contact" | "sample";
  onToken: (token: string | null) => void;
  onStatusChange?: (status: TurnstileStatus) => void;
  ref?: Ref<TurnstileHandle>;
}) {
  const siteKey = turnstileSiteKey();
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onStatusRef = useRef(onStatusChange);
  onTokenRef.current = onToken;
  onStatusRef.current = onStatusChange;
  const [status, setStatus] = useState<TurnstileStatus>(siteKey === "mock" ? "ready" : "loading");
  /** Incremented by "Reload security check" to load and render again from scratch. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onStatusRef.current?.(status);
  }, [status]);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        onTokenRef.current(null);
        if (siteKey === "mock") {
          // Issue a fresh mock token on the next tick, like the real widget would.
          setTimeout(() => onTokenRef.current("mock-pass"), 0);
          return;
        }
        if (status === "error" || !widgetId.current || !window.turnstile) {
          setAttempt((n) => n + 1);
          return;
        }
        window.turnstile.reset(widgetId.current);
      },
    }),
    [siteKey, status],
  );

  useEffect(() => {
    if (!siteKey) return;
    if (siteKey === "mock") {
      onTokenRef.current("mock-pass");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    onTokenRef.current(null);
    const failed = () => {
      if (cancelled) return;
      onTokenRef.current(null);
      setStatus("error");
    };
    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return;
        try {
          widgetId.current = api.render(container.current, {
            sitekey: siteKey,
            action,
            appearance: "interaction-only",
            size: "flexible",
            callback: (token: string) => {
              if (cancelled) return;
              onTokenRef.current(token);
              setStatus("ready");
            },
            "expired-callback": () => onTokenRef.current(null),
            "timeout-callback": () => onTokenRef.current(null),
            "error-callback": () => {
              failed();
              return true; // handled here: the visitor sees an explanation and a reload button
            },
          });
          if (!cancelled) setStatus((s) => (s === "error" ? s : "ready"));
        } catch {
          failed();
        }
      })
      .catch(failed);
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* already removed */
        }
      }
      widgetId.current = null;
    };
  }, [siteKey, action, attempt]);

  if (!siteKey) return null;
  if (siteKey === "mock") {
    return (
      <p data-turnstile="mock" className="text-[11px] text-muted-foreground">
        Security check: local test mode.
      </p>
    );
  }
  return (
    <div data-turnstile="live" data-turnstile-status={status}>
      <div ref={container} className="min-h-0" />
      {status === "error" ? (
        <div className="rounded-lg border border-border bg-alabaster/60 p-3 text-xs text-foreground">
          <p>
            The security check could not load. Check your connection, or allow
            challenges.cloudflare.com if you use a content blocker, then reload it.
          </p>
          <button
            type="button"
            data-turnstile-reload
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reload security check
          </button>
        </div>
      ) : null}
    </div>
  );
}
