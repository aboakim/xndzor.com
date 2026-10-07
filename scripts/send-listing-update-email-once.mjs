/**
 * One-time email to users who registered with email and own at least one public listing.
 *
 * Usage:
 *   node scripts/send-listing-update-email-once.mjs --dry-run
 *   node scripts/send-listing-update-email-once.mjs --send
 *
 * Mail: uses Resend HTTP API if RESEND_API_KEY + EMAIL_FROM are set (no in-app mailer yet).
 * Never prints full recipient list or secret values.
 */
import { createRequire } from "node:module";
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile();

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SITE = "https://www.xndzor.com";
const LOCALE = "hy";
const FROM_NAME = "Խնձոր (Xndzor)";

const SUBJECT =
  "Թարմացրեք ձեր հայտարարությունը — Xndzor";

const SHARE_HEADING = "📣 Կիսվեք ձեր հայտարարությամբ";
const SHARE_INTRO =
  "Որպեսզի ավելի շատ մարդ տեսնի, ուղարկեք այն այս ցանցերով։ Կոճակը հայտարարության էջում է։";
const SHARE_CHANNELS = ["💬 WhatsApp", "✈️ Telegram", "📘 Facebook"];

function shareBlockPlainText() {
  return [
    SHARE_HEADING,
    SHARE_INTRO,
    ...SHARE_CHANNELS,
  ].join("\n");
}

function shareBlockHtml() {
  const channels = SHARE_CHANNELS.map((line) => `${escapeHtml(line)}<br/>`).join("");
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0; width: 100%; max-width: 560px;">
  <tr>
    <td style="background-color: #e8f5e9; border-radius: 8px; padding: 16px 20px; border: 1px solid #c8e6c9;">
      <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #2e7d32; font-family: system-ui, -apple-system, Segoe UI, sans-serif;">${escapeHtml(SHARE_HEADING)}</p>
      <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #333333; font-family: system-ui, -apple-system, Segoe UI, sans-serif;">${escapeHtml(SHARE_INTRO)}</p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #444444; font-family: system-ui, -apple-system, Segoe UI, sans-serif;">${channels}</p>
    </td>
  </tr>
</table>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildBody({ name, listingUrl, listingsUrl, loginUrl }) {
  const greeting = name?.trim() ? `Ողջույն, ${name.trim()}։` : "Ողջույն։";
  const listingLines = listingUrl
    ? `Վերջին հայտարարություն՝ ${listingUrl}\n`
    : "";

  const text = `${greeting}

Դուք Xndzor-ում հրապարակել եք հայտարարություն։ Եթե ապրանքի, գնի, քանակի, հասանելիության կամ լուսանկարի մասին ինչ-որ բան փոխվել է, խնդրում ենք մուտք գործել և թարմացնել տվյալները, որպեսզի գնորդները տեսնեն ճշգրիտ տեղեկությունը։

Ձեր հայտարարությունները՝ ${listingsUrl}
${listingLines}
${shareBlockPlainText()}

Մուտք գործել՝ ${loginUrl}

Հարգանքներով,
${FROM_NAME}
${SITE}/${LOCALE}`;

  const listingHtml = listingUrl
    ? `<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #333333; font-family: system-ui, -apple-system, Segoe UI, sans-serif;">Վերջին հայտարարություն՝ <a href="${escapeHtml(listingUrl)}" style="color: #2e7d32;">${escapeHtml(listingUrl)}</a></p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="hy">
<body style="margin: 0; padding: 16px; background-color: #ffffff;">
  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #333333; font-family: system-ui, -apple-system, Segoe UI, sans-serif;">${escapeHtml(greeting)}</p>
  <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #333333; font-family: system-ui, -apple-system, Segoe UI, sans-serif;">Դուք Xndzor-ում հրապարակել եք հայտարարություն։ Եթե ապրանքի, գնի, քանակի, հասանելիության կամ լուսանկարի մասին ինչ-որ բան փոխվել է, խնդրում ենք մուտք գործել և թարմացնել տվյալները, որպեսզի գնորդները տեսնեն ճշգրիտ տեղեկությունը։</p>
  <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #333333; font-family: system-ui, -apple-system, Segoe UI, sans-serif;">Ձեր հայտարարությունները՝ <a href="${escapeHtml(listingsUrl)}" style="color: #2e7d32;">${escapeHtml(listingsUrl)}</a></p>
  ${listingHtml}
  ${shareBlockHtml()}
  <p style="margin: 16px 0 0 0; font-size: 14px; line-height: 1.5; color: #333333; font-family: system-ui, -apple-system, Segoe UI, sans-serif;">Մուտք գործել՝ <a href="${escapeHtml(loginUrl)}" style="color: #2e7d32;">${escapeHtml(loginUrl)}</a></p>
  <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.5; color: #333333; font-family: system-ui, -apple-system, Segoe UI, sans-serif;">Հարգանքներով,<br/>${escapeHtml(FROM_NAME)}<br/><a href="${escapeHtml(`${SITE}/${LOCALE}`)}" style="color: #2e7d32;">${escapeHtml(`${SITE}/${LOCALE}`)}</a></p>
</body>
</html>`;

  return { text, html };
}

/** @demo.am and obvious local seed accounts — not real listing owners on production */
const EXCLUDED_EMAIL_SUFFIXES = ["@demo.am"];

function isExcludedEmail(email) {
  const e = email.toLowerCase().trim();
  return EXCLUDED_EMAIL_SUFFIXES.some((s) => e.endsWith(s));
}

function isValidEmail(email) {
  const e = email?.trim();
  return Boolean(e && e.includes("@") && e.length > 3);
}

function absoluteHy(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE}/${LOCALE}${p.replace(new RegExp(`^/${LOCALE}`), "")}`;
}

async function distinctUserIdsWithListings() {
  const ids = new Set();
  const tables = [
    () => prisma.supply.findMany({ select: { userId: true }, distinct: ["userId"] }),
    () => prisma.demand.findMany({ select: { userId: true }, distinct: ["userId"] }),
    () => prisma.futureHarvest.findMany({ select: { userId: true }, distinct: ["userId"] }),
    () => prisma.machineryListing.findMany({ select: { userId: true }, distinct: ["userId"] }),
    () => prisma.animalListing.findMany({ select: { userId: true }, distinct: ["userId"] }),
    () => prisma.catalogListing.findMany({ select: { userId: true }, distinct: ["userId"] }),
    () => prisma.jobRequest.findMany({ select: { userId: true }, distinct: ["userId"] }),
    () => prisma.serviceProvider.findMany({ select: { userId: true }, distinct: ["userId"] }),
    () => prisma.spaceListing.findMany({ select: { userId: true }, distinct: ["userId"] }),
  ];
  for (const q of tables) {
    const rows = await q();
    for (const r of rows) ids.add(r.userId);
  }
  return [...ids];
}

/** Most recent listing URL for personalization (hy locale paths). */
async function latestListingUrlForUser(userId) {
  const candidates = [];

  const push = (createdAt, path) => candidates.push({ createdAt, url: absoluteHy(path) });

  const [s, d, f, m, a, c, j, sp, sl] = await Promise.all([
    prisma.supply.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }),
    prisma.demand.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }),
    prisma.futureHarvest.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }),
    prisma.machineryListing.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }),
    prisma.animalListing.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }),
    prisma.catalogListing.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, category: true, createdAt: true } }),
    prisma.jobRequest.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }),
    prisma.serviceProvider.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }),
    prisma.spaceListing.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }),
  ]);

  if (s) push(s.createdAt, `/supply/${s.id}`);
  if (d) push(d.createdAt, `/demand/${d.id}`);
  if (f) push(f.createdAt, `/forward/${f.id}`);
  if (m) push(m.createdAt, `/machinery/${m.id}`);
  if (a) push(a.createdAt, `/animals/${a.id}`);
  if (c) {
    const route = {
      FERTILIZER: "fertilizers",
      SEED: "seeds",
      FEED: "feed",
      CHEMICAL: "chemicals",
      TOOL: "tools",
      LAND: "land",
      NATURAL_PRODUCT: "natural-products",
    };
    const slug = route[c.category] ?? "fertilizers";
    push(c.createdAt, `/shop/${slug}/${c.id}`);
  }
  if (j) push(j.createdAt, `/jobs/${j.id}`);
  if (sp) push(sp.createdAt, `/providers/${sp.id}`);
  if (sl) push(sl.createdAt, `/spaces/${sl.id}`);

  candidates.sort((x, y) => y.createdAt - x.createdAt);
  return candidates[0]?.url ?? null;
}

function mailEnvStatus() {
  const missing = [];
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!resendKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("EMAIL_FROM");
  return { ok: missing.length === 0, missing, resendKey, from };
}

async function sendViaResend({ to, subject, text, html, from }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${from}>`,
      to: [to],
      subject,
      text,
      html,
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
}

async function buildRecipients() {
  const userIds = await distinctUserIdsWithListings();
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });

  const byEmail = new Map();
  for (const u of users) {
    if (!isValidEmail(u.email) || isExcludedEmail(u.email)) continue;
    const key = u.email.toLowerCase().trim();
    if (!byEmail.has(key)) {
      byEmail.set(key, { email: key, name: u.name, userId: u.id });
    }
  }

  const listingsUrl = absoluteHy("/account/listings");
  const loginUrl = absoluteHy("/auth/login?callbackUrl=/hy/account/listings");

  const recipients = [];
  for (const r of byEmail.values()) {
    const listingUrl = await latestListingUrlForUser(r.userId);
    const { text, html } = buildBody({ name: r.name, listingUrl, listingsUrl, loginUrl });
    recipients.push({ ...r, listingUrl, text, html });
  }
  return recipients;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--send");

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const recipients = await buildRecipients();
  const sample = recipients[0];
  const sampleBody = sample
    ? buildBody({
        name: sample.name,
        listingUrl: sample.listingUrl,
        listingsUrl: absoluteHy("/account/listings"),
        loginUrl: absoluteHy("/auth/login?callbackUrl=/hy/account/listings"),
      })
    : buildBody({
        name: "Օրինակ",
        listingUrl: absoluteHy("/supply/example"),
        listingsUrl: absoluteHy("/account/listings"),
        loginUrl: absoluteHy("/auth/login?callbackUrl=/hy/account/listings"),
      });

  console.log(JSON.stringify({
    mode: dryRun ? "dry-run" : "send",
    uniqueRecipients: recipients.length,
    subject: SUBJECT,
    shareBlockText: shareBlockPlainText(),
    bodySampleText: sampleBody.text,
    mailIntegration: "Resend via RESEND_API_KEY + EMAIL_FROM",
  }, null, 2));

  if (dryRun) {
    console.log("\nDry run only. Re-run with --send to attempt delivery.");
    return;
  }

  const mail = mailEnvStatus();
  if (!mail.ok) {
    console.error(
      `Send blocked: missing env var(s): ${mail.missing.join(", ")}. ` +
        "This project has no built-in SMTP/Nodemailer/Resend module; set Resend keys on the machine that runs this script.",
    );
    process.exit(2);
  }

  let sent = 0;
  let failed = 0;
  const failures = [];

  for (const r of recipients) {
    try {
      await sendViaResend({
        to: r.email,
        subject: SUBJECT,
        text: r.text,
        html: r.html,
        from: mail.from,
      });
      sent++;
    } catch (e) {
      failed++;
      failures.push({ reason: String(e.message || e).slice(0, 120) });
    }
  }

  console.log(JSON.stringify({ sent, failed, failures: failures.slice(0, 10) }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
