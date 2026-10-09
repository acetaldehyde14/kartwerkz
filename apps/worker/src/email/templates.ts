/**
 * Minimal branded HTML templates, one per notification type. Kept as plain
 * string templates (no templating engine dependency) since the set of
 * notification types is small and fixed for the MVP.
 */

export type EmailJobType =
  | 'password-reset'
  | 'order-confirmation'
  | 'payment-confirmation'
  | 'proof-ready'
  | 'revision-request-received'
  | 'artwork-approved'
  | 'production-started'
  | 'order-shipped';

export interface RenderedEmail {
  subject: string;
  html: string;
}

function wrap(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f4f4f5; padding:24px; margin:0;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;">
      <div style="background:#111111;color:#ffffff;padding:20px 24px;">
        <strong style="font-size:18px;letter-spacing:0.5px;">KARTWERKZ</strong>
      </div>
      <div style="padding:24px;color:#1a1a1a;">
        <h2 style="margin-top:0;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;color:#888;font-size:12px;border-top:1px solid #eee;">
        Kartwerkz — custom karting graphics.
      </div>
    </div>
  </body>
</html>`;
}

export function renderEmail(type: EmailJobType, data: Record<string, unknown>): RenderedEmail {
  switch (type) {
    case 'password-reset':
      return {
        subject: 'Reset your Kartwerkz password',
        html: wrap(
          'Reset your password',
          `<p>Use the token below to reset your password. It expires in 30 minutes.</p>
           <p style="font-family:monospace;background:#f4f4f5;padding:12px;border-radius:4px;">${String(data.token)}</p>`,
        ),
      };
    case 'order-confirmation':
      return {
        subject: `Order ${String(data.orderNumber)} received`,
        html: wrap(
          'Order received',
          `<p>We've received your order <strong>${String(data.orderNumber)}</strong>.</p>`,
        ),
      };
    case 'payment-confirmation':
      return {
        subject: `Payment confirmed for ${String(data.orderNumber)}`,
        html: wrap(
          'Payment confirmed',
          `<p>Your payment for order <strong>${String(data.orderNumber)}</strong> was successful. We'll start on your artwork shortly.</p>`,
        ),
      };
    case 'proof-ready':
      return {
        subject: `Your artwork proof is ready — ${String(data.orderNumber)}`,
        html: wrap(
          'Artwork proof ready',
          `<p>Revision ${String(data.revisionNumber)} of your artwork proof for order <strong>${String(data.orderNumber)}</strong> is ready for your review.</p>`,
        ),
      };
    case 'revision-request-received':
      return {
        subject: `Revision request received — ${String(data.orderNumber)}`,
        html: wrap(
          'Revision request received',
          `<p>We've received your revision request for order <strong>${String(data.orderNumber)}</strong>:</p>
           <blockquote>${String(data.comment)}</blockquote>`,
        ),
      };
    case 'artwork-approved':
      return {
        subject: `Artwork approved — ${String(data.orderNumber)}`,
        html: wrap(
          'Artwork approved',
          `<p>Thanks! Your artwork for order <strong>${String(data.orderNumber)}</strong> is approved and will move to production.</p>`,
        ),
      };
    case 'production-started':
      return {
        subject: `Production started — ${String(data.orderNumber)}`,
        html: wrap(
          'Production started',
          `<p>Order <strong>${String(data.orderNumber)}</strong> is now in production.</p>`,
        ),
      };
    case 'order-shipped':
      return {
        subject: `Your order has shipped — ${String(data.orderNumber)}`,
        html: wrap(
          'Order shipped',
          `<p>Order <strong>${String(data.orderNumber)}</strong> has shipped via ${String(data.carrier)}.</p>
           ${data.trackingNumber ? `<p>Tracking number: <strong>${String(data.trackingNumber)}</strong></p>` : ''}`,
        ),
      };
    default:
      return {
        subject: 'Kartwerkz notification',
        html: wrap('Notification', '<p>See your account for details.</p>'),
      };
  }
}
