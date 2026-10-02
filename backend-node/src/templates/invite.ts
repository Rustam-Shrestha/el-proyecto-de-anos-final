import { escapeHtml, layout, type EmailContent } from './layout';

export interface InviteParams {
  companyName: string;
  link: string;
  code?: string;
}

export function inviteEmail({ companyName, link, code }: InviteParams): EmailContent {
  const subject = `Invitation code for ${companyName} — FinGuard`;
  const codeBlock = code
    ? `<p style="font-size:14px;color:#374151;">Your invitation code for <strong>${escapeHtml(companyName)}</strong>:</p>
       <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#166534;">${escapeHtml(code)}</p>
       <p style="font-size:13px;color:#6b7280;">Open FinGuard → Company Setup → enter this code to join ${escapeHtml(companyName)}. Code expires in 7 days.</p>`
    : '';
  const html = layout({
    title: `You are invited to join ${companyName}`,
    preheader: `Join ${companyName} on FinGuard`,
    bodyHtml: `${codeBlock}
      <p style="font-size:13px;color:#6b7280;">Or paste this link: ${escapeHtml(link)}</p>`,
    cta: { label: 'Accept invite online', href: link },
  });
  const text = [
    `You are invited to join ${companyName}.`,
    code ? `Invitation code for ${companyName}: ${code} (enter it in FinGuard → Company Setup)` : null,
    `Accept online: ${link}`,
    'Code/link expires in 7 days.',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}
