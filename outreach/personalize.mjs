#!/usr/bin/env node
// aiTA outreach engine — dependency-free (Node 18+). No paid email API.
//
// DELIVERY (creative, credential-free): drives Mail.app via AppleScript using the account already
// configured on this Mac — your real identity + deliverability, no Resend, no API key.
//
//   (no flag)        DRY RUN — render paste-ready drafts to outbox/ (+ _manifest.json). Needs nothing.
//   --mail-drafts    Create a real DRAFT in Mail.app for every channel:"email" prospect (reversible;
//                    sits in your Drafts, one click from send). This is the default "execute" mode.
//   --mail-send      Actually SEND those via Mail.app. Approval-gated — only with explicit go.
//   --eml            Also write RFC822 .eml files to outbox/ (double-click opens in Mail, ready to send).
//   --only=<id>      Limit to one prospect.
//
// Non-email channels (form/dm/fb) are NEVER auto-delivered — platforms ban automation and the strategy
// is value-first/proxy. They always render as manual drafts with "where to paste it" instructions.
//
// SENDER: OUTREACH_FROM="Luke Mladenoff <luke.mladenoff@gmail.com>" picks the Mail account; empty = default.
// SIGNATURE vars: OUTREACH_SENDER_NAME / OUTREACH_SENDER_EMAIL (rendered into {{sender_*}}).

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const __dir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const MAIL_DRAFTS = args.includes("--mail-drafts");
const MAIL_SEND = args.includes("--mail-send");
const WRITE_EML = args.includes("--eml");
const ONLY = (args.find((a) => a.startsWith("--only=")) || "").split("=")[1] || null;

const SENDER_NAME = process.env.OUTREACH_SENDER_NAME || "{{your name}}";
const SENDER_EMAIL = process.env.OUTREACH_SENDER_EMAIL || "{{your email}}";
const FROM = process.env.OUTREACH_FROM || ""; // "Name <addr>" matching a Mail account, or "" = default

const data = JSON.parse(readFileSync(join(__dir, "prospects.json"), "utf8"));
let prospects = (data.prospects || []).filter((p) => p && p.id);

// Merge individual-teacher rows from the CSV (if present). Skips comment (#) and example- rows.
function parseCsvLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
const csvPath = join(__dir, "prospects.individuals.csv");
if (existsSync(csvPath)) {
  const lines = readFileSync(csvPath, "utf8").split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  if (lines.length > 1) {
    const header = parseCsvLine(lines[0]);
    for (const line of lines.slice(1)) {
      const cells = parseCsvLine(line);
      const row = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
      if (!row.id || row.id.startsWith("example-") || !row.contact_name) continue;
      prospects.push({
        id: row.id,
        outlet: row.outlet || row.contact_name,
        contact_name: row.contact_name,
        to: row.to || "",
        channel: row.channel || "email",
        template: row.template || "cold-teacher",
        related_party: String(row.related_party).toLowerCase() === "true",
        vars: { audience: row.audience || "", angle: row.angle || "" },
        notes: row.notes || (row.source ? `source: ${row.source}` : ""),
      });
    }
  }
}

if (ONLY) prospects = prospects.filter((p) => p.id === ONLY);
if (prospects.length === 0) {
  console.error(`No prospects matched${ONLY ? ` --only=${ONLY}` : ""}.`);
  process.exit(1);
}

const tplDir = join(__dir, "templates");
const templates = {};
for (const f of readdirSync(tplDir).filter((f) => f.endsWith(".md"))) {
  templates[f.replace(/\.md$/, "")] = readFileSync(join(tplDir, f), "utf8");
}

function render(str, ctx) {
  return str.replace(/\{\{(\w+)\}\}/g, (m, k) =>
    ctx[k] !== undefined && ctx[k] !== null ? String(ctx[k]) : `«${k}?»`
  );
}
function build(p) {
  const tpl = templates[p.template];
  if (!tpl) throw new Error(`prospect ${p.id}: unknown template "${p.template}"`);
  const ctx = {
    ...(p.vars || {}),
    outlet: p.outlet,
    contact_name: p.contact_name || "there",
    sender_name: SENDER_NAME,
    sender_email: SENDER_EMAIL,
  };
  const [firstLine, ...rest] = render(tpl, ctx).split("\n");
  const subject = firstLine.replace(/^Subject:\s*/i, "").trim();
  return { subject, body: rest.join("\n").trim() };
}

// --- Mail.app delivery (AppleScript) -------------------------------------
const mailer = join(__dir, "mailer.applescript");
function deliverViaMail(p, subject, body, mode /* "draft" | "send" */) {
  if (!p.to) throw new Error(`prospect ${p.id}: channel=email but no "to" address.`);
  const bodyFile = join(tmpdir(), `aita-outreach-${p.id}.txt`);
  writeFileSync(bodyFile, body, "utf8");
  const out = execFileSync("osascript", [mailer, mode, p.to, FROM, subject, bodyFile], {
    encoding: "utf8",
  }).trim();
  return out; // "ok:draft" | "ok:send"
}

function writeEml(p, subject, body) {
  const from = FROM || `${SENDER_NAME} <${SENDER_EMAIL}>`;
  const eml =
    `From: ${from}\r\n` +
    `To: ${p.to}\r\n` +
    `Subject: ${subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
    body.replace(/\n/g, "\r\n") +
    "\r\n";
  writeFileSync(join(outbox, `${p.id}.eml`), eml);
}

const outbox = join(__dir, "outbox");
if (!existsSync(outbox)) mkdirSync(outbox, { recursive: true });
const ledgerLog = join(__dir, "delivery.log.jsonl");

const manifest = [];
let drafted = 0, sent = 0, manual = 0, emls = 0;

for (const p of prospects) {
  let subject, body;
  try {
    ({ subject, body } = build(p));
  } catch (e) {
    console.error(`✗ ${p.id}: ${e.message}`);
    manifest.push({ id: p.id, status: "error", error: e.message });
    continue;
  }

  const sendable = p.channel === "email";
  const howToSend = {
    email: `Mail.app draft/send to ${p.to}.`,
    form: `MANUAL: submit via the outlet's contact form. ${p.notes || ""}`,
    dm: `MANUAL: send as a direct message. ${p.notes || ""}`,
    fb: `MANUAL: Facebook Messenger to the group admin — do NOT self-post. ${p.notes || ""}`,
    exhibitor: `MANUAL: paid/structured channel. ${p.notes || ""}`,
  }[p.channel] || `MANUAL. ${p.notes || ""}`;

  writeFileSync(
    join(outbox, `${p.id}.md`),
    `# ${p.outlet} — ${p.id}\n\n` +
      `- channel: **${p.channel}**\n- to: ${p.to || "(via " + p.channel + ")"}\n` +
      `- related_party: ${p.related_party ? "TRUE (revenue cannot count this)" : "false"}\n` +
      `- how to send: ${howToSend}\n\n---\n\n**Subject:** ${subject}\n\n${body}\n`
  );

  if (sendable && WRITE_EML) { writeEml(p, subject, body); emls++; }

  let status = sendable ? "draft(ready)" : "draft(manual)";
  if (!sendable) {
    manual++;
  } else if (MAIL_SEND || MAIL_DRAFTS) {
    const mode = MAIL_SEND ? "send" : "draft";
    try {
      const r = deliverViaMail(p, subject, body, mode);
      status = mode === "send" ? "sent" : "mail-draft-created";
      if (mode === "send") sent++; else drafted++;
      writeFileSync(ledgerLog, JSON.stringify({ ts: new Date().toISOString(), id: p.id, to: p.to, mode, result: r }) + "\n", { flag: "a" });
      console.log(`✓ ${status} ${p.id} -> ${p.to} (${r})`);
    } catch (e) {
      status = `${mode}_failed`;
      console.error(`✗ ${mode} ${p.id}: ${String(e.message).split("\n")[0]}`);
    }
  }
  manifest.push({ id: p.id, channel: p.channel, status });
}

writeFileSync(join(outbox, "_manifest.json"), JSON.stringify(manifest, null, 2));

const ready = manifest.filter((m) => m.status === "draft(ready)").length;
console.log(
  `\noutbox/ updated  |  mail drafts created: ${drafted}  |  sent: ${sent}  |  ` +
    `manual (form/dm/fb): ${manual}  |  .eml written: ${emls}`
);
if (!MAIL_DRAFTS && !MAIL_SEND && ready > 0)
  console.log(`Run with --mail-drafts to create real Mail.app drafts for the ${ready} email prospect(s).`);
