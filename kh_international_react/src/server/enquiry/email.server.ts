/**
 * Builds the notification email. The output depends ONLY on the validated payload and the reference,
 * never on server time or randomness, so a retry produces a byte-identical message. Resend rejects a
 * reused idempotency key with a different payload, so this determinism is required.
 */
import { REQUEST_TYPE_LABELS, type EnquiryPayload } from "@/lib/enquiry/schema";

export interface EnquiryEmail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
  tags: { name: string; value: string }[];
}

const FREE_MAIL = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.fr",
  "hotmail.com",
  "hotmail.fr",
  "outlook.com",
  "outlook.fr",
  "live.com",
  "live.fr",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "gmx.de",
  "gmx.fr",
  "web.de",
  "mail.ru",
  "yandex.com",
  "yandex.ru",
  "qq.com",
  "163.com",
  "126.com",
  "rediffmail.com",
  "orange.fr",
  "wanadoo.fr",
  "free.fr",
  "laposte.net",
  "sfr.fr",
]);

/** Below this fill time (client clock) the subject is tagged [fast]; the enquiry is NOT rejected. */
export const FAST_FILL_MS = 2000;

export function isFreeMail(email: string): boolean {
  return FREE_MAIL.has(email.slice(email.lastIndexOf("@") + 1).toLowerCase());
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clip(value: string, max: number) {
  return value.length > max ? value.slice(0, max - 1) + "…" : value;
}

function isoOrUnknown(ms: number) {
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? "unknown" : d.toISOString();
}

export function buildEnquiryEmail(payload: EnquiryPayload, reference: string): EnquiryEmail {
  const f = payload.fields;
  const typeLabel = REQUEST_TYPE_LABELS[payload.requestType];
  const fast = payload.submittedAt - payload.startedAt < FAST_FILL_MS;
  const tags = [isFreeMail(f.email) ? "[free-mail]" : "", fast ? "[fast]" : ""]
    .filter(Boolean)
    .join(" ");

  const rows: [string, string][] = [
    ["Reference", reference],
    ["Request type", typeLabel],
    ["Full name", f.fullName],
    ["Company", f.company],
    ["Business email", f.email],
    ["Country", f.country],
  ];
  let longLabel: string;
  let longValue: string;
  if (payload.form === "contact") {
    const c = payload.fields;
    rows.push(["Phone / WhatsApp", c.phone || "(not provided)"]);
    rows.push(["Product of interest", c.product || "(not provided)"]);
    rows.push(["Estimated volume", c.volume || "(not provided)"]);
    longLabel = "Message";
    longValue = c.message;
  } else {
    longLabel = "Note";
    longValue = payload.fields.note || "(not provided)";
  }

  // Every value placed in the subject was cleaned to a single line by the schema; clip lengths anyway.
  const subject = clip(
    `[Website enquiry] ${typeLabel} · ${clip(f.country, 40)} · ${reference}${tags ? " " + tags : ""}`,
    200,
  );

  const meta = [
    `Form: ${payload.form === "contact" ? "Contact form" : "Sample / report request"}`,
    `Submitted (visitor's clock, UTC): ${isoOrUnknown(payload.submittedAt)}`,
    `Submission ID: ${payload.submissionId}`,
    tags ? `Flags: ${tags}` : "",
  ].filter(Boolean);

  const text = [
    `New website enquiry: ${typeLabel}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `${longLabel}:`,
    longValue,
    "",
    "---",
    ...meta,
    "Sent by the KH International website enquiry form. Reply to this email to answer the sender directly.",
  ].join("\n");

  const cell =
    "padding:4px 12px 4px 0;vertical-align:top;font-family:Arial,sans-serif;font-size:14px";
  const html = [
    `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a">`,
    `<p style="margin:0 0 12px"><strong>New website enquiry: ${escapeHtml(typeLabel)}</strong></p>`,
    `<table role="presentation" style="border-collapse:collapse">`,
    ...rows.map(
      ([k, v]) =>
        `<tr><td style="${cell};color:#555">${escapeHtml(k)}</td><td style="${cell}">${escapeHtml(v)}</td></tr>`,
    ),
    `</table>`,
    `<p style="margin:16px 0 4px;color:#555">${escapeHtml(longLabel)}</p>`,
    `<div style="white-space:pre-wrap;border-left:3px solid #ccc;padding-left:12px">${escapeHtml(longValue)}</div>`,
    `<p style="margin:16px 0 0;color:#777;font-size:12px">${meta.map(escapeHtml).join("<br>")}<br>`,
    `Sent by the KH International website enquiry form. Reply to this email to answer the sender directly.</p>`,
    `</div>`,
  ].join("");

  return {
    subject,
    text,
    html,
    replyTo: f.email,
    tags: [
      { name: "form", value: payload.form },
      { name: "request_type", value: payload.requestType },
    ],
  };
}

/** Deterministic, human-friendly reference derived from the submission ID (same on every retry). */
export async function referenceFor(submissionId: string, prefix = "KH"): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(submissionId)),
  );
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[digest[i]! % alphabet.length];
  return `${prefix}-${out}`;
}
