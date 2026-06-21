// POST /api/pitch-email — send a pitch link via email or return a mailto fallback.
// nodemailer is not in package.json. If SMTP vars are set at runtime the module
// is required via a runtime-only eval so TypeScript never sees the import.
// Without SMTP vars (the common case) we return a mailto URL the client opens.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Build the dark-themed pitch HTML email. */
function buildHtml(
  trackTitle: string,
  artist: string,
  score: number,
  scoreLabel: string,
  url: string,
): string {
  const scoreHex =
    score >= 85 ? "#a3e635" : score >= 70 ? "#bef264" : score >= 50 ? "#c4b5fd" : "#fca5a5";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SyncFit Pitch</title></head>
<body style="margin:0;padding:0;background:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d14;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#13131f;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9b8afb;">SyncFit by Synclat</p>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Pitch Report</h1>
        </td></tr>
        <tr><td style="padding:28px 40px 24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#7c7c9a;">Track</p>
          <p style="margin:0 0 2px;font-size:18px;font-weight:700;color:#fff;">${trackTitle}</p>
          <p style="margin:0 0 24px;font-size:14px;color:#9b9bb8;">${artist}</p>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
              <span style="font-size:52px;font-weight:800;line-height:1;color:${scoreHex};">${score}</span>
            </td>
            <td style="vertical-align:middle;padding-left:12px;">
              <p style="margin:0;font-size:13px;color:#9b9bb8;">/ 100</p>
              <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#e2e8f0;">${scoreLabel}</p>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">Open Full Pitch →</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;font-size:11px;color:#5b5b78;">Powered by <strong style="color:#9b8afb;">SyncFit by Synclat</strong> · Music sync intelligence · <a href="https://syncfit-fawn.vercel.app" style="color:#7c3aed;text-decoration:none;">syncfit-fawn.vercel.app</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: Request) {
  let body: {
    email?: string;
    url?: string;
    trackTitle?: string;
    artist?: string;
    score?: number;
    scoreLabel?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const {
    email = "",
    url = "",
    trackTitle = "Track",
    artist = "",
    score = 0,
    scoreLabel = "",
  } = body;

  // Validate
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "A valid email address is required." },
      { status: 400 },
    );
  }
  if (!url || (!url.startsWith("https://") && !url.startsWith("http://"))) {
    return NextResponse.json(
      { ok: false, error: "A valid URL is required." },
      { status: 400 },
    );
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    // Attempt SMTP via nodemailer loaded at runtime only (not in package.json).
    // We use a runtime require via Function to avoid TypeScript resolving the module.
    try {
      // eslint-disable-next-line no-new-func
      const requireFn = new Function("m", "return require(m)") as (m: string) => unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodemailer = requireFn("nodemailer") as any;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"SyncFit by Synclat" <${smtpUser}>`,
        to: email,
        subject: `🎵 Pitch: "${trackTitle}" by ${artist} — SyncFit Score ${score}`,
        html: buildHtml(trackTitle, artist, score, scoreLabel, url),
      });

      return NextResponse.json({ ok: true, sent: true });
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "Failed to send email." },
        { status: 500 },
      );
    }
  }

  // SMTP not configured — return a mailto URL the client can open.
  const subject = encodeURIComponent(`SyncFit Pitch: ${trackTitle} by ${artist}`);
  const mailBody = encodeURIComponent(`Check out this pitch: ${url}`);
  const mailtoUrl = `mailto:${email}?subject=${subject}&body=${mailBody}`;

  return NextResponse.json({ ok: true, sent: false, mailtoUrl });
}
