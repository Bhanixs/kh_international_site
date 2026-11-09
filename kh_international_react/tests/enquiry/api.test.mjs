// Black-box tests for POST /api/enquiry against the built node-server output.
// Run: NITRO_PRESET=node-server VITE_TURNSTILE_SITE_KEY=mock npm run build
//      node --test tests/enquiry/
// No real emails, no external network: mock transport, mock Turnstile and a local fake Resend server.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import {
  contactPayload,
  MOCK_ENV,
  nextIp,
  post,
  rawRequest,
  samplePayload,
  startFakeResend,
  startFakeSiteverify,
  startServer,
} from "./helpers.mjs";

// ---------------------------------------------------------------------------
describe("mock transport server", () => {
  let s;
  before(async () => {
    s = await startServer(MOCK_ENV);
  });
  after(async () => s?.stop());

  describe("transport checks", () => {
    test("GET → 405 with Allow: POST", async () => {
      const r = await fetch(s.base + "/api/enquiry");
      assert.equal(r.status, 405);
      assert.equal(r.headers.get("allow"), "POST");
    });
    test("wrong content type → 415", async () => {
      const r = await post(s, null, {
        headers: { "content-type": "text/plain" },
        raw: JSON.stringify(contactPayload()),
      });
      assert.equal(r.status, 415);
    });
    test("body over 10 KB → 413", async () => {
      const r = await post(s, null, { raw: JSON.stringify({ pad: "x".repeat(11 * 1024) }) });
      assert.equal(r.status, 413);
      assert.equal(r.json.code, "payload_too_large");
    });
    test("missing Origin → 403", async () => {
      const r = await fetch(s.base + "/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(contactPayload()),
      });
      assert.equal(r.status, 403);
    });
    test("cross-site Origin → 403", async () => {
      const r = await post(s, contactPayload(), {
        headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
      });
      assert.equal(r.status, 403);
      assert.equal(r.json.code, "forbidden_origin");
    });
    test("same host but Sec-Fetch-Site cross-site → 403", async () => {
      const r = await post(s, contactPayload(), { headers: { "sec-fetch-site": "cross-site" } });
      assert.equal(r.status, 403);
    });
    test("malformed JSON → 400 bad_request", async () => {
      const r = await post(s, null, { raw: "{not json" });
      assert.equal(r.status, 400);
      assert.equal(r.json.code, "bad_request");
    });
    test("unknown top-level key → 400 validation", async () => {
      const r = await post(s, { ...contactPayload(), extra: "x" });
      assert.equal(r.status, 400);
      assert.equal(r.json.code, "validation");
    });
    test("unknown field key → 400 validation", async () => {
      const r = await post(s, contactPayload({}, { website: "http://spam.example" }));
      assert.equal(r.status, 400);
    });
    test("responses are not cacheable", async () => {
      const r = await post(s, contactPayload());
      assert.equal(r.headers.get("cache-control"), "no-store");
    });
  });

  describe("contact form validation", () => {
    for (const field of ["fullName", "company", "email", "country", "message"]) {
      test(`missing required ${field} → 400 with field error`, async () => {
        const r = await post(s, contactPayload({}, { [field]: "" }));
        assert.equal(r.status, 400);
        assert.ok(r.json.fieldErrors?.[field], JSON.stringify(r.json));
      });
    }
    test("optional phone, product, volume may be empty", async () => {
      const r = await post(s, contactPayload({}, { phone: "", product: "", volume: "" }));
      assert.equal(r.status, 200, JSON.stringify(r.json));
    });
    for (const email of [
      "not-an-email",
      "a@b",
      "a@b.com, c@d.com",
      "Name <a@b.com>",
      "a@b.com\r\nbcc:c@d.com",
      "x".repeat(250) + "@b.com",
    ]) {
      test(`invalid email ${JSON.stringify(email.slice(0, 30))} → 400`, async () => {
        const r = await post(s, contactPayload({}, { email }));
        assert.equal(r.status, 400);
        assert.ok(r.json.fieldErrors?.email);
      });
    }
    for (const phone of ["abc", "12345", "+33 (0) 1 23 45 67 89 00 11 22", "+33 1 23<script>"]) {
      test(`invalid phone ${JSON.stringify(phone)} → 400`, async () => {
        const r = await post(s, contactPayload({}, { phone }));
        assert.equal(r.status, 400);
        assert.ok(r.json.fieldErrors?.phone);
      });
    }
    test("message shorter than 10 chars → 400", async () => {
      const r = await post(s, contactPayload({}, { message: "hi there" }));
      assert.ok(r.json.fieldErrors?.message);
    });
    test("message longer than 2000 chars → 400", async () => {
      const r = await post(s, contactPayload({}, { message: "a".repeat(2001) }));
      assert.ok(r.json.fieldErrors?.message);
    });
    test("name longer than 100 chars → 400", async () => {
      const r = await post(s, contactPayload({}, { fullName: "a".repeat(101) }));
      assert.ok(r.json.fieldErrors?.fullName);
    });
    test("non-string field value → 400", async () => {
      const r = await post(s, contactPayload({}, { fullName: { $gt: "" } }));
      assert.equal(r.status, 400);
    });
    test("invalid submissionId → 400", async () => {
      const r = await post(s, contactPayload({ submissionId: "not-a-uuid" }));
      assert.equal(r.status, 400);
    });
  });

  describe("sample form validation", () => {
    for (const field of ["fullName", "company", "email", "country"]) {
      test(`missing required ${field} → 400`, async () => {
        const r = await post(s, samplePayload({}, { [field]: "" }));
        assert.equal(r.status, 400);
        assert.ok(r.json.fieldErrors?.[field]);
      });
    }
    test("note is optional", async () => {
      const r = await post(s, samplePayload({}, { note: "" }));
      assert.equal(r.status, 200);
    });
    test("note over 500 chars → 400", async () => {
      const r = await post(s, samplePayload({}, { note: "n".repeat(501) }));
      assert.ok(r.json.fieldErrors?.note);
    });
    test("contact-only fields are rejected on the sample form", async () => {
      const r = await post(s, samplePayload({}, { phone: "+91 98765 43210" }));
      assert.equal(r.status, 400);
    });
    test("requestType must match the form", async () => {
      assert.equal((await post(s, samplePayload({ requestType: "contact" }))).status, 400);
      assert.equal((await post(s, contactPayload({ requestType: "sample" }))).status, 400);
    });
    for (const requestType of ["sample", "partner", "gcms"]) {
      test(`valid ${requestType} request → 200 accepted`, async () => {
        const r = await post(s, samplePayload({ requestType }));
        assert.equal(r.status, 200);
        assert.equal(r.json.accepted, true);
      });
    }
  });

  describe("valid submissions and email content", () => {
    test("valid contact → 200 accepted with KH reference and mock flag; one outbox email", async () => {
      const before = s.outbox().length;
      const p = contactPayload();
      const r = await post(s, p);
      assert.equal(r.status, 200);
      assert.equal(r.json.ok, true);
      assert.equal(r.json.accepted, true);
      assert.equal(r.json.mock, true);
      assert.match(r.json.reference, /^KH-[A-HJ-NP-Z2-9]{8}$/);
      const box = s.outbox();
      assert.equal(box.length, before + 1);
      const mail = box.find((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).email;
      assert.equal(mail.replyTo, "marie@parfums-test.example");
      assert.match(mail.subject, new RegExp(r.json.reference));
      assert.match(mail.text, /Parfums Test SA/);
      assert.match(mail.text, /CIF Le Havre/);
    });
    test("Tamil, French and CJK text is preserved", async () => {
      const p = contactPayload({}, { fullName: "முருகன் Hélène 李小龙", company: "Société Été" });
      const r = await post(s, p);
      assert.equal(r.status, 200);
      const mail = s
        .outbox()
        .find((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).email;
      assert.match(mail.text, /முருகன் Hélène 李小龙/);
      assert.match(mail.text, /Société Été/);
    });
    test("bidi overrides and zero-width characters are stripped", async () => {
      const p = contactPayload({}, { company: "Acme‮​ Corp" });
      await post(s, p);
      const mail = s
        .outbox()
        .find((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).email;
      assert.match(mail.text, /Company: Acme Corp/);
      assert.doesNotMatch(mail.text, /[‮​]/);
    });
    test("header injection: CR/LF in single-line fields never reaches the subject", async () => {
      const p = contactPayload(
        {},
        { company: "Acme\r\nBcc: victim@example.com", country: "France\r\nX-Injected: 1" },
      );
      const r = await post(s, p);
      assert.equal(r.status, 200);
      const mail = s
        .outbox()
        .find((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).email;
      assert.doesNotMatch(mail.subject, /[\r\n]/);
      assert.doesNotMatch(mail.text, /\nBcc:/);
      assert.match(mail.text, /Company: Acme Bcc: victim@example.com/); // flattened to one line, visible as data
    });
    test("HTML injection is escaped in the HTML part", async () => {
      const p = contactPayload(
        {},
        { message: `<script>alert(1)</script> "><img src=x onerror=alert(2)>` },
      );
      await post(s, p);
      const mail = s
        .outbox()
        .find((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).email;
      assert.doesNotMatch(mail.html, /<script>|<img/);
      assert.match(mail.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
      assert.match(mail.html, /&quot;&gt;&lt;img src=x onerror=alert\(2\)&gt;/);
    });
    test("free-mail and fast-fill submissions are delivered with tags, not rejected", async () => {
      const now = Date.now();
      const p = contactPayload(
        { startedAt: now - 500, submittedAt: now },
        { email: "buyer@gmail.com" },
      );
      const r = await post(s, p);
      assert.equal(r.status, 200);
      const mail = s
        .outbox()
        .find((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).email;
      assert.match(mail.subject, /\[free-mail\]/);
      assert.match(mail.subject, /\[fast\]/);
    });
  });

  describe("honeypot", () => {
    test("filled honeypot → response indistinguishable from a real success, nothing sent", async () => {
      const before = s.outbox().length;
      const real = await post(s, contactPayload());
      const afterReal = s.outbox().length;
      const r = await post(s, contactPayload({ kh_ref_code: "http://spam.example" }));
      assert.equal(r.status, 200);
      assert.deepEqual(Object.keys(r.json).sort(), Object.keys(real.json).sort());
      assert.equal(r.json.ok, true);
      assert.equal(r.json.accepted, true);
      assert.match(r.json.reference, /^KH-[A-HJ-NP-Z2-9]{8}$/);
      assert.equal(afterReal, before + 1);
      assert.equal(s.outbox().length, afterReal, "the decoy sends nothing");
      assert.match(s.logs(), /"outcome":"honeypot"/);
    });
    test("honeypot does not bypass validation", async () => {
      const r = await post(s, contactPayload({ kh_ref_code: "x" }, { email: "bad" }));
      assert.equal(r.status, 400);
      assert.equal(r.json.code, "validation");
    });
    test("honeypot does not bypass Turnstile", async () => {
      const r = await post(s, contactPayload({ kh_ref_code: "x", turnstileToken: "mock-fail" }));
      assert.equal(r.status, 403);
    });
    test("honeypot requests are rate limited like everyone else", async () => {
      const ip = nextIp();
      const statuses = [];
      for (let i = 0; i < 7; i++)
        statuses.push((await post(s, contactPayload({ kh_ref_code: "x" }), { ip })).status);
      assert.deepEqual(statuses, [200, 200, 200, 200, 200, 200, 429]);
    });
  });

  describe("Turnstile verification", () => {
    for (const [token, status, code] of [
      ["", 403, "verification_failed"],
      ["mock-fail", 403, "verification_failed"],
      ["mock-wrong-host", 403, "verification_failed"],
      ["mock-wrong-action", 403, "verification_failed"],
      ["mock-unavailable", 503, "verification_unavailable"],
    ]) {
      test(`token ${JSON.stringify(token)} → ${status} ${code}, nothing sent`, async () => {
        const before = s.outbox().length;
        const r = await post(s, contactPayload({ turnstileToken: token }));
        assert.equal(r.status, status);
        assert.equal(r.json.code, code);
        assert.equal(s.outbox().length, before);
      });
    }
  });

  describe("rate limiting (best effort, per IP)", () => {
    test("7th new submission from one IP within 10 min → 429 with Retry-After; retry of a counted id still allowed", async () => {
      const ip = nextIp();
      const sent = [];
      for (let i = 0; i < 6; i++) {
        const p = contactPayload();
        sent.push(p);
        const r = await post(s, p, { ip });
        assert.equal(r.status, 200, `request ${i + 1}`);
      }
      const r7 = await post(s, contactPayload(), { ip });
      assert.equal(r7.status, 429);
      assert.equal(r7.json.code, "rate_limited");
      assert.ok(Number(r7.headers.get("retry-after")) > 0);
      // A retry of an already-counted submission is not blocked and is deduplicated.
      const again = await post(s, sent[0], { ip });
      assert.equal(again.status, 200);
      const other = await post(s, contactPayload(), { ip: nextIp() });
      assert.equal(other.status, 200, "other IPs are unaffected");
    });
  });

  describe("duplicates and idempotency", () => {
    test("same submissionId twice → same reference, one email", async () => {
      const p = contactPayload();
      const a = await post(s, p);
      const b = await post(s, p);
      assert.equal(a.status, 200);
      assert.equal(b.status, 200);
      assert.equal(a.json.reference, b.json.reference);
      assert.equal(
        s.outbox().filter((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).length,
        1,
      );
    });
    test("same submissionId with changed content → 409 conflict, nothing extra sent", async () => {
      const p = contactPayload();
      await post(s, p);
      const changed = { ...p, fields: { ...p.fields, message: p.fields.message + " Changed." } };
      const r = await post(s, changed);
      assert.equal(r.status, 409);
      assert.equal(r.json.code, "conflict");
      assert.equal(
        s.outbox().filter((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).length,
        1,
      );
    });
    test("client retry after a lost response (network timeout) → same reference, no duplicate", async () => {
      const p = contactPayload();
      await post(s, p); // response "lost" by the client
      const retry = await post(s, { ...p, turnstileToken: "mock-pass" }); // fresh token, same id and fields
      assert.equal(retry.status, 200);
      assert.equal(
        s.outbox().filter((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).length,
        1,
      );
    });
  });

  describe("email provider failures (mock faults)", () => {
    const cases = [
      ["500-once", 200, null, 1],
      ["timeout-once", 200, null, 1],
      ["timeout-after-accept", 200, null, 1],
      ["500", 502, "delivery_unconfirmed", 0],
      ["timeout", 502, "delivery_unconfirmed", 0],
      ["503", 502, "delivery_failed", 0],
      ["429", 502, "delivery_failed", 0],
      ["401", 503, "unavailable", 0],
    ];
    for (const [fault, status, code, emails] of cases) {
      test(`fault ${fault} → ${status}${code ? " " + code : ""}, ${emails} email(s)`, async () => {
        const p = contactPayload();
        const r = await post(s, p, { headers: { "x-kh-mock-fault": fault } });
        assert.equal(r.status, status, JSON.stringify(r.json));
        if (code) {
          assert.equal(r.json.code, code);
          assert.equal(r.json.ok, false);
        } else assert.equal(r.json.accepted, true);
        assert.equal(
          s.outbox().filter((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).length,
          emails,
        );
      });
    }
    test("after delivery_unconfirmed, a retry with the same id succeeds once", async () => {
      const p = contactPayload();
      const first = await post(s, p, { headers: { "x-kh-mock-fault": "timeout" } });
      assert.equal(first.json.code, "delivery_unconfirmed");
      assert.equal(first.json.retryable, true);
      const second = await post(s, p);
      assert.equal(second.status, 200);
      assert.equal(
        s.outbox().filter((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).length,
        1,
      );
    });
  });

  describe("logging", () => {
    test("logs contain no personal data", async () => {
      const marker = `Zzlogcheck${randomUUID().slice(0, 8)}`;
      await post(
        s,
        contactPayload(
          {},
          {
            fullName: marker,
            email: `${marker.toLowerCase()}@example.com`,
            phone: "+44 7700 900123",
          },
        ),
      );
      await new Promise((r) => setTimeout(r, 100));
      const logs = s.logs();
      assert.match(logs, /"evt":"enquiry"/);
      assert.doesNotMatch(logs, new RegExp(marker, "i"));
      assert.doesNotMatch(logs, /7700 900123/);
    });
  });
});

// ---------------------------------------------------------------------------
describe("configuration safety (production can never fake success)", () => {
  const cases = [
    ["no configuration at all (local)", {}],
    [
      "mock transport without acknowledgement (local)",
      { ENQUIRY_TRANSPORT: "mock", TURNSTILE_MODE: "mock" },
    ],
    ["mock transport on Vercel production", { ...MOCK_ENV, VERCEL: "1", VERCEL_ENV: "production" }],
    ["mock transport on a Vercel preview", { ...MOCK_ENV, VERCEL: "1", VERCEL_ENV: "preview" }],
    [
      "mock Turnstile on Vercel with real-looking Resend config",
      {
        VERCEL: "1",
        VERCEL_ENV: "production",
        TURNSTILE_MODE: "mock",
        ENQUIRY_MOCK_ACKNOWLEDGE: "local-testing-only",
        RESEND_API_KEY: "re_dummy_not_real",
        ENQUIRY_TO: "inbox@example.invalid",
        ENQUIRY_FROM: "from@example.invalid",
      },
    ],
    [
      "Resend without ENQUIRY_TO on Vercel production",
      {
        VERCEL: "1",
        VERCEL_ENV: "production",
        RESEND_API_KEY: "re_dummy_not_real",
        ENQUIRY_FROM: "from@example.invalid",
        TURNSTILE_SECRET_KEY: "0x4AAAAAAAdummyNotReal",
      },
    ],
    [
      "Resend without API key",
      {
        ENQUIRY_TO: "inbox@example.invalid",
        ENQUIRY_FROM: "from@example.invalid",
        TURNSTILE_SECRET_KEY: "0x4AAAAAAAdummyNotReal",
      },
    ],
    [
      "Turnstile test secret in Vercel production",
      {
        VERCEL: "1",
        VERCEL_ENV: "production",
        RESEND_API_KEY: "re_dummy_not_real",
        ENQUIRY_TO: "inbox@example.invalid",
        ENQUIRY_FROM: "from@example.invalid",
        TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      },
    ],
    [
      "Resend base-URL override on Vercel",
      {
        VERCEL: "1",
        VERCEL_ENV: "production",
        RESEND_API_KEY: "re_dummy_not_real",
        RESEND_API_BASE: "http://127.0.0.1:9",
        ENQUIRY_TO: "inbox@example.invalid",
        ENQUIRY_FROM: "from@example.invalid",
        TURNSTILE_SECRET_KEY: "0x4AAAAAAAdummyNotReal",
      },
    ],
  ];
  for (const [name, env] of cases) {
    test(`${name} → 503 unavailable, never 200`, async () => {
      const s = await startServer(env);
      try {
        const r = await post(s, contactPayload());
        assert.equal(r.status, 503, JSON.stringify(r.json));
        assert.equal(r.json.code, "unavailable");
        assert.equal(r.json.ok, false);
        assert.equal(s.outbox().length, 0);
        // Even a honeypot request gets no decoy success when the service is not configured.
        const hp = await post(s, contactPayload({ kh_ref_code: "x" }));
        assert.equal(hp.status, 503);
      } finally {
        await s.stop();
      }
    });
  }
});

// ---------------------------------------------------------------------------
describe("Resend transport against a local fake Resend server", () => {
  let fake;
  let s;
  before(async () => {
    fake = await startFakeResend();
    s = await startServer({
      ENQUIRY_TRANSPORT: "resend",
      RESEND_API_BASE: fake.base,
      RESEND_API_KEY: "re_local_fake_key",
      ENQUIRY_TO: "test-inbox@example.invalid",
      ENQUIRY_FROM: "enquiries@example.invalid",
      TURNSTILE_MODE: "mock",
      ENQUIRY_MOCK_ACKNOWLEDGE: "local-testing-only",
      ENQUIRY_PROVIDER_TIMEOUT_MS: "400",
    });
  });
  after(async () => {
    await s?.stop();
    await fake?.stop();
  });

  test("request shape: endpoint, auth, idempotency key, sender, recipient, reply-to", async () => {
    fake.setScript([() => ({ status: 200, body: { id: "fake_1" } })]);
    const p = contactPayload();
    const r = await post(s, p);
    assert.equal(r.status, 200);
    assert.equal(r.json.accepted, true);
    assert.equal(r.json.mock, undefined);
    assert.equal(fake.requests.length, 1);
    const req = fake.requests[0];
    assert.equal(req.method, "POST");
    assert.equal(req.url, "/emails");
    assert.equal(req.headers.authorization, "Bearer re_local_fake_key");
    assert.equal(req.headers["idempotency-key"], `kh-enquiry/${p.submissionId}`);
    const body = JSON.parse(req.body);
    assert.equal(body.from, "KH International Website <enquiries@example.invalid>");
    assert.deepEqual(body.to, ["test-inbox@example.invalid"]);
    assert.equal(body.reply_to, "marie@parfums-test.example");
    assert.doesNotMatch(body.from, /marie|Parfums/i, "visitor data never in From");
    assert.ok(body.text && body.html && body.subject);
  });

  test("500 then 200 → accepted after one retry with identical key and body", async () => {
    fake.setScript([
      () => ({ status: 500, body: { name: "internal_server_error" } }),
      () => ({ status: 200, body: { id: "fake_2" } }),
    ]);
    const r = await post(s, contactPayload());
    assert.equal(r.status, 200);
    assert.equal(fake.requests.length, 2);
    assert.equal(
      fake.requests[0].headers["idempotency-key"],
      fake.requests[1].headers["idempotency-key"],
    );
    assert.equal(fake.requests[0].body, fake.requests[1].body);
  });

  test("timeout then 200 (ambiguous first attempt) → accepted, identical retry", async () => {
    fake.setScript([
      () => ({ status: 200, body: { id: "late" }, delayMs: 1000 }),
      () => ({ status: 200, body: { id: "fake_3" } }),
    ]);
    const r = await post(s, contactPayload());
    assert.equal(r.status, 200);
    assert.equal(fake.requests.length, 2);
    assert.equal(fake.requests[0].body, fake.requests[1].body);
  });

  test("409 concurrent_idempotent_requests then 200 → accepted", async () => {
    fake.setScript([
      () => ({ status: 409, body: { name: "concurrent_idempotent_requests" } }),
      () => ({ status: 200, body: { id: "fake_4" } }),
    ]);
    assert.equal((await post(s, contactPayload())).status, 200);
  });

  for (const [label, script, status, code, calls] of [
    ["500 twice", [() => ({ status: 500 })], 502, "delivery_unconfirmed", 2],
    [
      "timeout twice",
      [() => ({ status: 200, body: { id: "x" }, delayMs: 1000 })],
      502,
      "delivery_unconfirmed",
      2,
    ],
    [
      "429 twice",
      [() => ({ status: 429, body: { name: "rate_limit_exceeded" } })],
      502,
      "delivery_failed",
      2,
    ],
    [
      "401 invalid key",
      [() => ({ status: 401, body: { name: "missing_api_key" } })],
      503,
      "unavailable",
      1,
    ],
    [
      "422 validation (e.g. unverified domain)",
      [() => ({ status: 422, body: { name: "validation_error" } })],
      503,
      "unavailable",
      1,
    ],
    [
      "409 invalid_idempotent_request",
      [() => ({ status: 409, body: { name: "invalid_idempotent_request" } })],
      409,
      "conflict",
      1,
    ],
    ["200 without id", [() => ({ status: 200, body: {} })], 502, "delivery_unconfirmed", 2],
  ]) {
    test(`${label} → ${status} ${code} after ${calls} call(s); never a success`, async () => {
      fake.setScript(script);
      const r = await post(s, contactPayload());
      assert.equal(r.status, status, JSON.stringify(r.json));
      assert.equal(r.json.ok, false);
      assert.equal(r.json.code, code);
      assert.equal(fake.requests.length, calls);
    });
  }

  test("honeypot and failed verification never call the provider", async () => {
    fake.setScript([() => ({ status: 200, body: { id: "should_not_happen" } })]);
    await post(s, contactPayload({ kh_ref_code: "bot" }));
    await post(s, contactPayload({ turnstileToken: "mock-fail" }));
    assert.equal(fake.requests.length, 0);
  });
});

// ===========================================================================
// Stage 1A.1 additions
// ===========================================================================

const PUBLIC_HOST = "www.khinternational.org.in";

/** A request that looks exactly like one routed to the deployed site (public Host and Origin). */
function asDeployed(server, body, extraHeaders = {}) {
  const raw = JSON.stringify(body);
  const headers = {
    host: PUBLIC_HOST,
    origin: `https://${PUBLIC_HOST}`,
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
    "content-length": Buffer.byteLength(raw),
    "x-forwarded-for": nextIp(),
    ...extraHeaders,
  };
  for (const k of Object.keys(headers)) if (headers[k] === undefined) delete headers[k];
  return rawRequest(server, { body: raw, headers });
}

/** A request addressed to the local server (loopback Host and Origin). */
function asLocal(server, body, extraHeaders = {}) {
  const raw = JSON.stringify(body);
  const host = new URL(server.base).host;
  return rawRequest(server, {
    body: raw,
    headers: {
      host,
      origin: server.base,
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
      "content-length": Buffer.byteLength(raw),
      "x-forwarded-for": nextIp(),
      ...extraHeaders,
    },
  });
}

const FAKE_RESEND_ENV = (base) => ({
  ENQUIRY_TRANSPORT: "resend",
  RESEND_API_BASE: base,
  RESEND_API_KEY: "re_local_fake_key",
  ENQUIRY_TO: "test-inbox@example.invalid",
  ENQUIRY_FROM: "enquiries@example.invalid",
  TURNSTILE_MODE: "mock",
  ENQUIRY_MOCK_ACKNOWLEDGE: "local-testing-only",
});

describe("C1: local-only features fail closed for deployed requests (no platform variables involved)", () => {
  const TEST_SECRET = "1x0000000000000000000000000000000AA"; // Cloudflare's always-pass test secret
  const RESEND_OK = {
    RESEND_API_KEY: "re_dummy_not_real",
    ENQUIRY_TO: "inbox@example.invalid",
    ENQUIRY_FROM: "from@example.invalid",
  };
  const cases = [
    ["mock transport + mock Turnstile", { ...MOCK_ENV }],
    [
      "mock transport only (live Turnstile)",
      {
        ENQUIRY_TRANSPORT: "mock",
        ENQUIRY_MOCK_ACKNOWLEDGE: "local-testing-only",
        TURNSTILE_SECRET_KEY: "0x4AAAAAAAdummyNotReal",
      },
    ],
    [
      "mock Turnstile only (Resend configured)",
      { ...RESEND_OK, TURNSTILE_MODE: "mock", ENQUIRY_MOCK_ACKNOWLEDGE: "local-testing-only" },
    ],
    ["Turnstile test secret", { ...RESEND_OK, TURNSTILE_SECRET_KEY: TEST_SECRET }],
    [
      "Resend base-URL override",
      {
        ...RESEND_OK,
        RESEND_API_BASE: "http://127.0.0.1:9",
        TURNSTILE_SECRET_KEY: "0x4AAAAAAAdummyNotReal",
      },
    ],
    [
      "Turnstile verify-URL override",
      {
        ...RESEND_OK,
        TURNSTILE_SECRET_KEY: "0x4AAAAAAAdummyNotReal",
        TURNSTILE_VERIFY_URL: "http://127.0.0.1:9/siteverify",
      },
    ],
  ];
  for (const [name, env] of cases) {
    test(`${name}: deployed-host request → 503, never 200`, async () => {
      const s = await startServer(env);
      try {
        const r = await asDeployed(s, contactPayload());
        assert.equal(r.status, 503, r.text.slice(0, 200));
        assert.equal(r.json.code, "unavailable");
        const hp = await asDeployed(s, contactPayload({ kh_ref_code: "x" }));
        assert.equal(hp.status, 503, "no decoy success either");
        assert.equal(s.outbox().length, 0);
      } finally {
        await s.stop();
      }
    });
  }

  test("loopback Host with a public X-Forwarded-Host or Origin is not local → mock refused", async () => {
    const s = await startServer(MOCK_ENV);
    try {
      const control = await asLocal(s, contactPayload());
      assert.equal(control.status, 200, "control: a genuinely local request is accepted");
      const host = new URL(s.base).host;
      const r1 = await asLocal(s, contactPayload(), {
        "x-forwarded-host": PUBLIC_HOST,
        origin: `https://${PUBLIC_HOST}`,
      });
      assert.equal(r1.status, 503);
      const r2 = await asLocal(s, contactPayload(), {
        "x-forwarded-host": `${host}, ${PUBLIC_HOST}`,
      });
      assert.notEqual(r2.status, 200, "every forwarded host must be loopback");
    } finally {
      await s.stop();
    }
  });

  test("a platform marker refuses mock even for loopback requests", async () => {
    for (const marker of ["VERCEL", "VERCEL_ENV", "NETLIFY", "CF_PAGES"]) {
      const s = await startServer({ ...MOCK_ENV, [marker]: "1" });
      try {
        assert.equal((await asLocal(s, contactPayload())).status, 503, marker);
      } finally {
        await s.stop();
      }
    }
  });
});

describe("C1: missing, malformed and conflicting configuration fails closed", () => {
  const cases = [
    ["missing: nothing configured", {}],
    [
      "missing: mock without acknowledgement",
      { ENQUIRY_TRANSPORT: "mock", TURNSTILE_MODE: "mock" },
    ],
    ["malformed: ENQUIRY_TRANSPORT=Mock", { ...MOCK_ENV, ENQUIRY_TRANSPORT: "Mock" }],
    ["malformed: ENQUIRY_TRANSPORT=' mock'", { ...MOCK_ENV, ENQUIRY_TRANSPORT: " mock" }],
    ["malformed: ENQUIRY_TRANSPORT=resend,mock", { ...MOCK_ENV, ENQUIRY_TRANSPORT: "resend,mock" }],
    ["malformed: TURNSTILE_MODE=off", { ...MOCK_ENV, TURNSTILE_MODE: "off" }],
    ["malformed: acknowledgement value", { ...MOCK_ENV, ENQUIRY_MOCK_ACKNOWLEDGE: "yes" }],
    ["malformed: provider timeout", { ...MOCK_ENV, ENQUIRY_PROVIDER_TIMEOUT_MS: "abc" }],
    ["malformed: verify timeout out of range", { ...MOCK_ENV, TURNSTILE_TIMEOUT_MS: "999999" }],
    ["malformed: allowed origin not a URL", { ...MOCK_ENV, ENQUIRY_ALLOWED_ORIGINS: "not a url" }],
    [
      "malformed: allowed origin with a path",
      { ...MOCK_ENV, ENQUIRY_ALLOWED_ORIGINS: "https://example.com/path" },
    ],
    [
      "malformed: allowed origin over http",
      { ...MOCK_ENV, ENQUIRY_ALLOWED_ORIGINS: "http://example.com" },
    ],
    ["malformed: RESEND_API_BASE not a URL", { ...MOCK_ENV, RESEND_API_BASE: "::::" }],
    [
      "conflicting: RESEND_API_BASE to a non-loopback host",
      { ...MOCK_ENV, RESEND_API_BASE: "https://evil.example" },
    ],
    [
      "conflicting: TURNSTILE_VERIFY_URL with ftp scheme",
      { ...MOCK_ENV, TURNSTILE_VERIFY_URL: "ftp://127.0.0.1/x" },
    ],
    [
      "conflicting: resend selected but ENQUIRY_FROM invalid",
      {
        RESEND_API_KEY: "re_x",
        ENQUIRY_TO: "a@b.example",
        ENQUIRY_FROM: "not-an-address",
        TURNSTILE_MODE: "mock",
        ENQUIRY_MOCK_ACKNOWLEDGE: "local-testing-only",
      },
    ],
  ];
  for (const [name, env] of cases) {
    test(`${name} → 503 unavailable (local request)`, async () => {
      const s = await startServer(env);
      try {
        const r = await post(s, contactPayload());
        assert.equal(r.status, 503, JSON.stringify(r.json));
        assert.equal(r.json.code, "unavailable");
        assert.equal(s.outbox().length, 0);
      } finally {
        await s.stop();
      }
    });
  }
});

describe("origin validation (raw requests with explicit Host)", () => {
  let s;
  let allow;
  before(async () => {
    s = await startServer(MOCK_ENV);
    allow = await startServer({
      ...MOCK_ENV,
      ENQUIRY_ALLOWED_ORIGINS: "https://khinternational.org.in",
    });
  });
  after(async () => {
    await s?.stop();
    await allow?.stop();
  });
  // 403 = rejected by the origin check. 503 = origin accepted, then the local-only mock refused for a
  // deployed host (proves the origin check passed, without ever returning a success).
  const cases = [
    ["deployed www origin and host", {}, 503],
    ["apex origin to the www host", { origin: "https://khinternational.org.in" }, 403],
    ["http origin for a public host", { origin: `http://${PUBLIC_HOST}` }, 403],
    ["origin 'null'", { origin: "null" }, 403],
    ["malformed origin", { origin: "http://" }, 403],
    ["no origin", { origin: undefined }, 403],
    ["Sec-Fetch-Site same-site", { "sec-fetch-site": "same-site" }, 403],
    ["Sec-Fetch-Site none", { "sec-fetch-site": "none" }, 403],
    [
      "X-Forwarded-Host matching the origin",
      { host: "internal.local", "x-forwarded-host": PUBLIC_HOST },
      503,
    ],
    ["X-Forwarded-Host not matching the origin", { "x-forwarded-host": "other.example" }, 403],
  ];
  for (const [name, headers, expected] of cases) {
    test(`${name} → ${expected}`, async () => {
      const r = await asDeployed(s, contactPayload(), headers);
      assert.equal(r.status, expected, r.text.slice(0, 160));
    });
  }
  test("ENQUIRY_ALLOWED_ORIGINS admits a listed origin (then mock refused → 503, not 403)", async () => {
    const listed = await asDeployed(allow, contactPayload(), {
      origin: "https://khinternational.org.in",
    });
    assert.equal(listed.status, 503);
    const unlisted = await asDeployed(allow, contactPayload(), { origin: "https://other.example" });
    assert.equal(unlisted.status, 403);
  });
});

describe("unsupported methods", () => {
  let s;
  before(async () => {
    s = await startServer(MOCK_ENV);
  });
  after(async () => s?.stop());
  for (const method of ["GET", "HEAD", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    test(`${method} → 405 with Allow: POST`, async () => {
      const r = await fetch(s.base + "/api/enquiry", {
        method,
        headers: { origin: "https://evil.example", "access-control-request-method": "POST" },
      });
      assert.equal(r.status, 405);
      assert.equal(r.headers.get("allow"), "POST");
      assert.equal(r.headers.get("access-control-allow-origin"), null);
    });
  }
});

describe("parallel submissions", () => {
  test("mock transport: two identical submissions in parallel → same reference, one email", async () => {
    const s = await startServer(MOCK_ENV);
    try {
      const p = contactPayload();
      const [a, b] = await Promise.all([post(s, p), post(s, p)]);
      assert.equal(a.status, 200, JSON.stringify(a.json));
      assert.equal(b.status, 200, JSON.stringify(b.json));
      assert.equal(a.json.reference, b.json.reference);
      assert.equal(
        s.outbox().filter((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).length,
        1,
      );
    } finally {
      await s.stop();
    }
  });
  test("fake Resend with idempotency: three parallel identical submissions → one send", async () => {
    const fake = await startFakeResend({ processingMs: 300 });
    const s = await startServer(FAKE_RESEND_ENV(fake.base));
    try {
      const p = contactPayload();
      const results = await Promise.all([post(s, p), post(s, p), post(s, p)]);
      assert.deepEqual(
        results.map((r) => r.status),
        [200, 200, 200],
        JSON.stringify(results.map((r) => r.json)),
      );
      assert.equal(new Set(results.map((r) => r.json.reference)).size, 1);
      assert.equal(fake.sends, 1, "exactly one email sent");
    } finally {
      await s.stop();
      await fake.stop();
    }
  });
  test("fake Resend: two different submissions in parallel are both sent", async () => {
    const fake = await startFakeResend({ processingMs: 100 });
    const s = await startServer(FAKE_RESEND_ENV(fake.base));
    try {
      const [a, b] = await Promise.all([post(s, contactPayload()), post(s, contactPayload())]);
      assert.equal(a.status, 200);
      assert.equal(b.status, 200);
      assert.equal(fake.sends, 2);
    } finally {
      await s.stop();
      await fake.stop();
    }
  });
});

describe("C4: real Turnstile verification code against a local fake siteverify endpoint", () => {
  let fake;
  let s;
  const SECRET = "local-fake-secret-value";
  before(async () => {
    fake = await startFakeSiteverify();
    s = await startServer({
      ENQUIRY_TRANSPORT: "mock",
      ENQUIRY_MOCK_ACKNOWLEDGE: "local-testing-only",
      TURNSTILE_MODE: "live",
      TURNSTILE_SECRET_KEY: SECRET,
      TURNSTILE_VERIFY_URL: fake.base,
      TURNSTILE_TIMEOUT_MS: "400",
    });
  });
  after(async () => {
    await s?.stop();
    await fake?.stop();
  });
  const ok = (extra = {}) => ({
    status: 200,
    json: { success: true, hostname: "127.0.0.1", action: "contact", ...extra },
  });

  test("success → 200; siteverify receives secret, token and remote IP, form-encoded", async () => {
    fake.setResponder(() => ok());
    const before = s.outbox().length;
    const r = await post(s, contactPayload({ turnstileToken: "real-looking-token" }), {
      ip: "10.123.0.7",
    });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.accepted, true);
    assert.equal(s.outbox().length, before + 1);
    assert.equal(fake.requests.length, 1);
    const req = fake.requests[0];
    assert.equal(req.method, "POST");
    assert.match(req.headers["content-type"], /application\/x-www-form-urlencoded/);
    assert.equal(req.form.get("secret"), SECRET);
    assert.equal(req.form.get("response"), "real-looking-token");
    assert.equal(req.form.get("remoteip"), "10.123.0.7");
  });
  test("sample form verifies with action 'sample'", async () => {
    fake.setResponder(() => ok({ action: "sample" }));
    assert.equal((await post(s, samplePayload({ turnstileToken: "t" }))).status, 200);
  });
  const failures = [
    [
      "rejected token (success:false)",
      () => ({ status: 200, json: { success: false, "error-codes": ["invalid-input-response"] } }),
      403,
      "verification_failed",
    ],
    [
      "spent token (timeout-or-duplicate)",
      () => ({ status: 200, json: { success: false, "error-codes": ["timeout-or-duplicate"] } }),
      403,
      "verification_failed",
    ],
    ["hostname mismatch", () => ok({ hostname: "attacker.example" }), 403, "verification_failed"],
    [
      "hostname missing",
      () => ({ status: 200, json: { success: true, action: "contact" } }),
      403,
      "verification_failed",
    ],
    ["hostname not a string", () => ok({ hostname: 12345 }), 403, "verification_failed"],
    ["action mismatch", () => ok({ action: "sample" }), 403, "verification_failed"],
    [
      "action missing",
      () => ({ status: 200, json: { success: true, hostname: "127.0.0.1" } }),
      403,
      "verification_failed",
    ],
    [
      "provider HTTP 500",
      () => ({ status: 500, json: { error: "x" } }),
      503,
      "verification_unavailable",
    ],
    ["provider HTTP 429", () => ({ status: 429, json: {} }), 503, "verification_unavailable"],
    [
      "malformed JSON body",
      () => ({ status: 200, raw: "<html>not json</html>", contentType: "text/html" }),
      503,
      "verification_unavailable",
    ],
    [
      "JSON without 'success'",
      () => ({ status: 200, json: { hostname: "127.0.0.1", action: "contact" } }),
      503,
      "verification_unavailable",
    ],
    ["JSON array", () => ({ status: 200, raw: "[true]" }), 503, "verification_unavailable"],
    [
      "'success' as a string",
      () => ({ status: 200, json: { success: "true", hostname: "127.0.0.1", action: "contact" } }),
      503,
      "verification_unavailable",
    ],
    ["provider timeout", () => ({ ...ok(), delayMs: 1200 }), 503, "verification_unavailable"],
  ];
  for (const [name, responder, status, code] of failures) {
    test(`${name} → ${status} ${code}, nothing sent`, async () => {
      fake.setResponder(responder);
      const before = s.outbox().length;
      const r = await post(s, contactPayload({ turnstileToken: "token-under-test" }));
      assert.equal(r.status, status, JSON.stringify(r.json));
      assert.equal(r.json.code, code);
      assert.equal(s.outbox().length, before);
    });
  }
  test("empty token → 403 without calling siteverify", async () => {
    fake.setResponder(() => ok());
    const r = await post(s, contactPayload({ turnstileToken: "" }));
    assert.equal(r.status, 403);
    assert.equal(fake.requests.length, 0);
  });
  test("honeypot request is verified too, then gets the decoy (nothing sent)", async () => {
    fake.setResponder(() => ok());
    const before = s.outbox().length;
    const r = await post(s, contactPayload({ kh_ref_code: "bot", turnstileToken: "t" }));
    assert.equal(r.status, 200);
    assert.equal(r.json.accepted, true);
    assert.equal(fake.requests.length, 1);
    assert.equal(s.outbox().length, before);
  });
  test("Cloudflare's test secret works for a local request (refused for deployed hosts, see C1)", async () => {
    const s2 = await startServer({
      ENQUIRY_TRANSPORT: "mock",
      ENQUIRY_MOCK_ACKNOWLEDGE: "local-testing-only",
      TURNSTILE_MODE: "live",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      TURNSTILE_VERIFY_URL: fake.base,
    });
    try {
      fake.setResponder(() => ok());
      assert.equal((await post(s2, contactPayload({ turnstileToken: "t" }))).status, 200);
    } finally {
      await s2.stop();
    }
  });
});

describe("internationalised email addresses", () => {
  let s;
  before(async () => {
    s = await startServer(MOCK_ENV);
  });
  after(async () => s?.stop());
  test("IDN domain is accepted and converted to punycode (same mailbox)", async () => {
    const p = contactPayload({}, { email: "Ventes@SOCIÉTÉ.fr" });
    const r = await post(s, p);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const mail = s.outbox().find((m) => m.idempotencyKey === `kh-enquiry/${p.submissionId}`).email;
    assert.equal(mail.replyTo, "Ventes@xn--socit-esab.fr");
  });
  test("punycode domain is accepted unchanged", async () => {
    assert.equal(
      (await post(s, contactPayload({}, { email: "info@xn--mller-kva.de" }))).status,
      200,
    );
  });
  test("non-ASCII local part is declined with a specific message", async () => {
    const r = await post(s, contactPayload({}, { email: "müller@firma.de" }));
    assert.equal(r.status, 400);
    assert.match(r.json.fieldErrors.email, /Latin letters/);
  });
  for (const email of [
    "a@société.fr/evil",
    "a@société.fr" + String.fromCharCode(92) + "evil",
    "a@société.fr?x",
    "a@[127.0.0.1]",
  ]) {
    test(`separator tricks are rejected: ${JSON.stringify(email)}`, async () => {
      assert.equal((await post(s, contactPayload({}, { email }))).status, 400);
    });
  }
});

describe("rate limiting counts requests without a valid submissionId", () => {
  test("invalid ids always count (no free retries)", async () => {
    const s = await startServer(MOCK_ENV);
    try {
      const ip = nextIp();
      const statuses = [];
      for (let i = 0; i < 7; i++) {
        statuses.push(
          (await post(s, contactPayload({ submissionId: "not-a-uuid" }), { ip })).status,
        );
      }
      assert.deepEqual(statuses, [400, 400, 400, 400, 400, 400, 429]);
    } finally {
      await s.stop();
    }
  });
});
