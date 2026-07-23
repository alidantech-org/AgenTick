import "server-only";

import nodemailer from "nodemailer";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for email delivery`);
  return value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

let transporter: nodemailer.Transporter | undefined;

function mailTransport(): nodemailer.Transporter {
  if (transporter) return transporter;

  const port = Number(required("SMTP_PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid TCP port");
  }

  const useAuth = process.env.SMTP_AUTH !== "false";
  const auth = useAuth
    ? { user: required("SMTP_USER"), pass: required("SMTP_PASSWORD") }
    : undefined;

  transporter = nodemailer.createTransport({
    host: required("SMTP_HOST"),
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth,
    pool: process.env.SMTP_POOL !== "false",
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS ?? 5),
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES ?? 100),
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS ?? 10_000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS ?? 10_000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS ?? 20_000),
  });

  return transporter;
}

interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function send(message: MailMessage): Promise<void> {
  await mailTransport().sendMail({
    from: required("SMTP_FROM"),
    replyTo: process.env.SMTP_REPLY_TO?.trim() || undefined,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

export async function sendLoginOtp(email: string, otp: string): Promise<void> {
  await send({
    to: email,
    subject: `${otp} is your Skillib sign-in code`,
    text: `Your Skillib sign-in code is ${otp}. It expires in 10 minutes. If you did not request this code, ignore this email.`,
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#111"><div style="font-weight:800;font-size:20px">✓ Skillib</div><h1 style="font-size:30px;letter-spacing:-.03em;margin:30px 0 12px">Confirm your email</h1><p style="color:#555;line-height:1.7">Use this one-time code to sign in. It expires in 10 minutes.</p><div style="font:800 34px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;background:#f5f5f5;border:1px solid #ddd;border-radius:14px;padding:22px;text-align:center;margin:24px 0">${escapeHtml(otp)}</div><p style="font-size:13px;color:#777">If you did not request this code, you can safely ignore this email.</p></div>`,
  });
}

export async function sendOrganizationInvite(input: {
  email: string;
  organizationName: string;
  code: string;
}): Promise<void> {
  const siteUrl = required("NEXT_PUBLIC_SITE_URL");
  const joinUrl = `${siteUrl.replace(/\/$/, "")}/join?code=${encodeURIComponent(input.code)}`;
  const organizationName = escapeHtml(input.organizationName);
  const safeCode = escapeHtml(input.code);
  const safeJoinUrl = escapeHtml(joinUrl);

  await send({
    to: input.email,
    subject: `Join ${input.organizationName} on Skillib`,
    text: `You were invited to join ${input.organizationName} on Skillib. Invitation code: ${input.code}\nOpen: ${joinUrl}`,
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#111"><h1 style="font-size:28px;letter-spacing:-.03em">Join ${organizationName}</h1><p style="color:#555;line-height:1.7">Sign in with this email, then use the invitation code below.</p><div style="font:700 18px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;background:#f5f5f5;border:1px solid #ddd;border-radius:14px;padding:18px;word-break:break-all">${safeCode}</div><p style="margin-top:24px"><a href="${safeJoinUrl}" style="display:inline-block;background:#111;color:white;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px">Accept invitation</a></p></div>`,
  });
}
