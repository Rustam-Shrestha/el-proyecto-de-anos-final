import { escapeHtml, layout, type EmailContent } from './layout';

export interface KycApprovedParams {
  fullName?: string;
  lendersUrl: string;
}

export function kycApprovedEmail({ fullName, lendersUrl }: KycApprovedParams): EmailContent {
  const subject = 'KYC Verification Approved';
  const name = fullName || 'there';
  const html = layout({
    title: 'KYC Verification Approved',
    preheader: 'Your identity verification is approved — pick a lender and apply',
    bodyHtml: `<p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${escapeHtml(name)},</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Your identity verification is approved. It is valid for every lender on FinGuard, so you never submit your documents again.</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Pick a lender and apply in a couple of minutes — we reuse your verified profile.</p>`,
    cta: { label: 'Browse lenders', href: lendersUrl },
  });
  const text = [
    `Hi ${name},`,
    'Your identity verification is approved and works with every FinGuard lender.',
    `Choose a lender and apply: ${lendersUrl}`,
  ].join('\n');
  return { subject, html, text };
}
