// Test helpers for POST /api/enquiry. Uses only Node built-ins (node:test, http, child_process).
// Every server started here talks only to 127.0.0.1: the mock transport, the mock Turnstile verifier,
// or a local fake Resend server. Nothing leaves the machine.
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = path.resolve(here, "..", "..");
const SERVER_ENTRY = path.join(APP_ROOT, ".output", "server", "index.mjs");

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

const BASE_ENV_KEYS_TO_DROP = [
  "VERCEL",
  "VERCEL_ENV",
  "ENQUIRY_TRANSPORT",
  "ENQUIRY_MOCK_ACKNOWLEDGE",
  "RESEND_API_KEY",
  "RESEND_API_BASE",
  "ENQUIRY_TO",
  "ENQUIRY_FROM",
  "TURNSTILE_MODE",
  "TURNSTILE_SECRET_KEY",
  "ENQUIRY_ALLOWED_ORIGINS",
];

/** Starts the built node-server output with the given environment. */
export async function startServer(extraEnv = {}) {
  if (!fs.existsSync(SERVER_ENTRY)) {
    throw new Error(
      `Missing ${SERVER_ENTRY}. Build first: NITRO_PRESET=node-server VITE_TURNSTILE_SITE_KEY=mock npm run build`,
    );
  }
  const port = await freePort();
  const outboxDir = fs.mkdtempSync(path.join(os.tmpdir(), "kh-outbox-"));
  const env = { ...process.env };
  for (const k of BASE_ENV_KEYS_TO_DROP) delete env[k];
  Object.assign(
    env,
    {
      PORT: String(port),
      HOST: "127.0.0.1",
      NITRO_HOST: "127.0.0.1",
      ENQUIRY_OUTBOX_DIR: outboxDir,
    },
    extraEnv,
  );
  const child = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: APP_ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (d) => (logs += d));
  child.stderr.on("data", (d) => (logs += d));
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(base + "/api/enquiry"); // GET → 405 once the server is up
      if (r.status) break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return {
    base,
    outboxDir,
    logs: () => logs,
    outbox: () =>
      fs
        .readdirSync(outboxDir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => JSON.parse(fs.readFileSync(path.join(outboxDir, f), "utf8"))),
    async stop() {
      child.kill();
      await new Promise((r) => child.once("exit", r));
      fs.rmSync(outboxDir, { recursive: true, force: true });
    },
  };
}

let ipCounter = 1;
/** A fresh fake client IP, so unrelated tests do not share a rate-limit bucket. */
export function nextIp() {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

export function contactPayload(overrides = {}, fieldOverrides = {}) {
  const now = Date.now();
  return {
    form: "contact",
    requestType: "contact",
    fields: {
      fullName: "Marie Laurent",
      company: "Parfums Test SA",
      email: "marie@parfums-test.example",
      country: "France",
      phone: "+33 1 23 45 67 89",
      product: "Bulk Vetriver Oil",
      volume: "25 kg drum",
      message: "We would like a quotation for 25 kg, CIF Le Havre, with the latest CoA.",
      ...fieldOverrides,
    },
    submissionId: randomUUID(),
    startedAt: now - 60_000,
    submittedAt: now,
    turnstileToken: "mock-pass",
    kh_ref_code: "",
    ...overrides,
  };
}

export function samplePayload(overrides = {}, fieldOverrides = {}) {
  const now = Date.now();
  return {
    form: "sample",
    requestType: "gcms",
    fields: {
      fullName: "Arjun Raman",
      company: "Aroma Labs Test Pvt Ltd",
      email: "arjun@aromalabs-test.example",
      country: "India",
      note: "GC-MS report for formulation review.",
      ...fieldOverrides,
    },
    submissionId: randomUUID(),
    startedAt: now - 30_000,
    submittedAt: now,
    turnstileToken: "mock-pass",
    kh_ref_code: "",
    ...overrides,
  };
}

/** POSTs JSON with a same-origin Origin header unless overridden. */
export async function post(server, body, { headers = {}, ip = nextIp(), raw } = {}) {
  const res = await fetch(server.base + "/api/enquiry", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: server.base,
      "sec-fetch-site": "same-origin",
      "x-forwarded-for": ip,
      ...headers,
    },
    body: raw ?? JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json, headers: res.headers };
}

export const MOCK_ENV = {
  ENQUIRY_TRANSPORT: "mock",
  TURNSTILE_MODE: "mock",
  ENQUIRY_MOCK_ACKNOWLEDGE: "local-testing-only",
};

/**
 * Local fake of the Resend API.
 * Default behaviour emulates Resend's documented idempotency: same key + same body → the original id
 * (no new send); same key + different body → 409 invalid_idempotent_request; same key while the first
 * request is still processing → 409 concurrent_idempotent_requests. `sends` counts real "sends".
 * `setScript([...])` replaces this with a queue of responders (the last one repeats);
 * `setScript(null)` restores the default.
 */
export async function startFakeResend({ processingMs = 150 } = {}) {
  const requests = [];
  const keys = new Map();
  const state = { sends: 0 };
  const idempotent = async (entry) => {
    const key = entry.headers["idempotency-key"];
    const existing = key ? keys.get(key) : undefined;
    if (existing) {
      if (existing.body !== entry.body)
        return { status: 409, body: { name: "invalid_idempotent_request" } };
      if (!existing.done) return { status: 409, body: { name: "concurrent_idempotent_requests" } };
      return { status: 200, body: { id: existing.id } };
    }
    const record = { body: entry.body, id: "fake_" + randomUUID(), done: false };
    if (key) keys.set(key, record);
    await new Promise((r) => setTimeout(r, processingMs));
    record.done = true;
    state.sends += 1;
    return { status: 200, body: { id: record.id } };
  };
  let script = null;
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const entry = { method: req.method, url: req.url, headers: req.headers, body };
    requests.push(entry);
    const responder = !script ? idempotent : script.length > 1 ? script.shift() : script[0];
    const r = await responder(entry, requests.length);
    if (r.delayMs) await new Promise((x) => setTimeout(x, r.delayMs));
    if (res.destroyed) return;
    res.writeHead(r.status, { "content-type": "application/json" });
    res.end(JSON.stringify(r.body ?? {}));
  });
  const port = await freePort();
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${port}`,
    requests,
    get sends() {
      return state.sends;
    },
    setScript(s) {
      script = s;
      requests.length = 0;
      keys.clear();
      state.sends = 0;
    },
    stop: () => new Promise((r) => server.close(r)),
  };
}

/**
 * Local fake of Cloudflare's siteverify endpoint (form-encoded POST → JSON).
 * `respond(form)` returns { status, json } or { status, raw } and may set delayMs.
 */
export async function startFakeSiteverify() {
  const requests = [];
  let respond = (form) => ({
    status: 200,
    json: {
      success: true,
      hostname: "127.0.0.1",
      action: form.get("response")?.split(":")[1] ?? "contact",
    },
  });
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const form = new URLSearchParams(body);
    requests.push({ method: req.method, url: req.url, headers: req.headers, form });
    const r = await respond(form);
    if (r.delayMs) await new Promise((x) => setTimeout(x, r.delayMs));
    if (res.destroyed) return;
    res.writeHead(r.status, { "content-type": r.contentType ?? "application/json" });
    res.end(r.raw ?? JSON.stringify(r.json ?? {}));
  });
  const port = await freePort();
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${port}/siteverify`,
    requests,
    setResponder(fn) {
      respond = fn;
      requests.length = 0;
    },
    stop: () => new Promise((r) => server.close(r)),
  };
}

/**
 * Raw HTTP request with full control over Host and other headers (fetch does not allow setting Host).
 * Used to simulate requests arriving at a deployed public hostname.
 */
export function rawRequest(server, { method = "POST", body, headers = {} } = {}) {
  const u = new URL(server.base + "/api/enquiry");
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: u.hostname, port: u.port, path: u.pathname, method, headers },
      (res) => {
        let b = "";
        res.on("data", (d) => (b += d));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(b);
          } catch {
            /* non-JSON */
          }
          resolve({ status: res.statusCode, headers: res.headers, json, text: b });
        });
      },
    );
    req.on("error", reject);
    if (body !== undefined) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}
