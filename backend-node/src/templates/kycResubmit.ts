import { escapeHtml, layout, type EmailContent } from './layout';

export interface KycResubmitParams {
  fullName?: string;
  note?: string;
  resubmitUrl: string;
}

export function kycResubmitEmail({ fullName, note, resubmitUrl }: KycResubmitParams): EmailContent {
  const subject = 'Action Required: Resubmit KYC Application';
  const name = fullName || 'there';
  const noteBlock = note
    ? `<p style="color: #374151; background-color: #fef3c7; padding: 12px; border-radius: 8px;"><strong>Note:</strong> ${escapeHtml(note)}</p>`
    : '';
  const html = layout({
    title: 'Action Required: Resubmit KYC',
    preheader: 'Your KYC application needs corrections — resubmit here',
    bodyHtml: `<p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${escapeHtml(name)},</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Your KYC application requires resubmission. Please address the feedback below and submit again.</p>
      ${noteBlock}`,
    cta: { label: 'Resubmit KYC', href: resubmitUrl },
  });
  const text = [`Hi ${name},`, 'Your KYC application requires resubmission.', note ? `Note: ${note}` : null, `Resubmit here: ${resubmitUrl}`]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}
