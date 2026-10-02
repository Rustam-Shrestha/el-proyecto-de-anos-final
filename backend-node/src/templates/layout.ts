/**
 * Shared email layout + HTML escaping for all FinGuard templates.
 * Every per-type template returns { subject, html, text } and delegates
 * the outer shell to `layout()` so branding stays in one place.
 */

/** Escape user-controlled values before interpolating into HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Branded outer shell. `preheader` is the inbox preview line.
 */
export function layout(opts: {
  title: string;
  preheader: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
}): string {
  const cta = opts.cta
    ? `<p style="margin: 24px 0 0;"><a href="${escapeHtml(opts.cta.href)}" style="display: inline-block; background: #1d4ed8; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">${escapeHtml(opts.cta.label)}</a></p>`
    : '';
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /></head>
  <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
    <span style="display: none; visibility: hidden; opacity: 0; height: 0; width: 0;">${escapeHtml(opts.preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; padding: 32px;">
          <tr><td>
            <p style="margin: 0 0 4px; font-size: 13px; letter-spacing: 2px; color: #1d4ed8; font-weight: 700;">FINGUARD</p>
            <h1 style="margin: 0 0 16px; font-size: 20px; color: #111827;">${escapeHtml(opts.title)}</h1>
            ${opts.bodyHtml}
            ${cta}
            <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">FinGuard &middot; Secure lending, verified.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function paragraph(text: string): string {
  return `<p style="margin: 0 0 12px; color: #374151; font-size: 15px; line-height: 1.6;">${escapeHtml(text)}</p>`;
}
