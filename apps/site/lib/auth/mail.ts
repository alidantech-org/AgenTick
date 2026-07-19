import "server-only";
import { Resend } from "resend";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function send(message: MailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "AgenTick <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "RESEND_API_KEY is required to send authentication email",
      );
    }
    console.info(
      `[AgenTick mail] ${message.subject} -> ${message.to}\n${message.text}`,
    );
    return;
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  if (result.error) throw new Error(result.error.message);
}

export async function sendLoginOtp(email: string, otp: string): Promise<void> {
  await send({
    to: email,
    subject: `${otp} is your AgenTick sign-in code`,
    text: `Your AgenTick sign-in code is ${otp}. It expires in 10 minutes. If you did not request this code, ignore this email.`,
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#152018"><div style="display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:20px"><span style="display:inline-grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#16a865;color:white">✓</span>AgenTick</div><h1 style="font-size:30px;letter-spacing:-.03em;margin:30px 0 12px">Confirm your email</h1><p style="color:#536258;line-height:1.7">Use this one-time code to sign in. It expires in 10 minutes.</p><div style="font:800 34px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;background:#effaf4;border:1px solid #b9e8cd;border-radius:14px;padding:22px;text-align:center;margin:24px 0">${otp}</div><p style="font-size:13px;color:#718078">If you did not request this code, you can safely ignore this email.</p></div>`,
  });
}

export async function sendOrganizationInvite(input: {
  email: string;
  organizationName: string;
  code: string;
}): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const joinUrl = `${siteUrl.replace(/\/$/, "")}/join?code=${encodeURIComponent(input.code)}`;
  const organizationName = escapeHtml(input.organizationName);
  const safeCode = escapeHtml(input.code);
  const safeJoinUrl = escapeHtml(joinUrl);
  await send({
    to: input.email,
    subject: `Join ${input.organizationName} on AgenTick`,
    text: `You were invited to join ${input.organizationName} on AgenTick. Invitation code: ${input.code}\nOpen: ${joinUrl}`,
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#152018"><h1 style="font-size:28px;letter-spacing:-.03em">Join ${organizationName}</h1><p style="color:#536258;line-height:1.7">Sign in with this email, then use the invitation code below.</p><div style="font:700 18px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;background:#effaf4;border:1px solid #b9e8cd;border-radius:14px;padding:18px;word-break:break-all">${safeCode}</div><p style="margin-top:24px"><a href="${safeJoinUrl}" style="display:inline-block;background:#16a865;color:white;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px">Accept invitation</a></p></div>`,
  });
}
