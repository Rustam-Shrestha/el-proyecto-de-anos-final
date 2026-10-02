import { escapeHtml, layout, type EmailContent } from './layout';

export interface KycRejectedParams {
  fullName?: string;
  reason?: string;
  resubmitUrl: string;
}

export function kycRejectedEmail({ fullName, reason, resubmitUrl }: KycRejectedParams): EmailContent {
  const subject = 'KYC Verification Rejected';
  const name = fullName || 'there';
  const reasonBlock = reason
    ? `<p style="color: #374151; background-color: #fee2e2; padding: 12px; border-radius: 8px;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>`
    : '';
  const html = layout({
    title: 'KYC Verification Rejected',
    preheader: 'Your KYC application was rejected — see the reason and resubmit',
    bodyHtml: `<p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${escapeHtml(name)},</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Your KYC application has been rejected.</p>
      ${reasonBlock}`,
    cta: { label: 'Resubmit Application', href: resubmitUrl },
  });
  const text = [`Hi ${name},`, 'Your KYC application has been rejected.', reason ? `Reason: ${reason}` : null, `Resubmit here: ${resubmitUrl}`]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}
