import nodemailer, { type Transporter } from 'nodemailer';
import { renderEmail, type EmailJobType } from './templates';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 1025),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      // Mailpit (local dev) and most self-hosted relays don't present a
      // trusted cert — this is fine for internal/dev mail relays only.
      secure: false,
    });
  }
  return transporter;
}

/**
 * Sends an email, or — when SMTP_HOST is unset (or sending otherwise fails,
 * e.g. Mailpit not up yet in dev) — logs the rendered email to the console
 * instead of throwing. This keeps the worker process alive rather than
 * crashing/looping on every job when no mail relay is configured, which is
 * the expected state for a fresh local checkout before `docker-compose up`
 * brings Mailpit online.
 */
export async function sendEmail(
  type: EmailJobType,
  to: string,
  data: Record<string, unknown>,
): Promise<void> {
  const { subject, html } = renderEmail(type, data);
  const from = process.env.SMTP_FROM ?? 'Kartwerkz <no-reply@kartwerkz.local>';

  const client = getTransporter();
  if (!client) {
    console.log(
      `[mailer] SMTP_HOST not set — logging email instead of sending.\n  to: ${to}\n  subject: ${subject}`,
    );
    return;
  }

  try {
    await client.sendMail({ from, to, subject, html });
  } catch (err) {
    console.error(
      `[mailer] Failed to send "${subject}" to ${to} — logging instead of throwing.`,
      err,
    );
  }
}
