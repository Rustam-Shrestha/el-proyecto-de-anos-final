import { escapeHtml, layout, type EmailContent } from './layout';

export interface LoanRejectedParams {
  fullName?: string;
  reason?: string;
  loansUrl: string;
}

export function loanRejectedEmail({ fullName, reason, loansUrl }: LoanRejectedParams): EmailContent {
  const subject = 'Loan Application Update - FinGuard';
  const name = fullName || 'there';
  const reasonBlock = reason
    ? `<p style="color: #374151; background-color: #fee2e2; padding: 12px; border-radius: 8px;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>`
    : '';
  const html = layout({
    title: 'Loan Application Update',
    preheader: 'An update on your loan application',
    bodyHtml: `<p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${escapeHtml(name)},</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">We regret to inform you that your loan application has been reviewed and we cannot proceed at this time.</p>
      ${reasonBlock}
      <p style="color: #6b7280; font-size: 13px;">You may reapply after 30 days. For assistance, please contact support.</p>`,
    cta: { label: 'View Applications', href: loansUrl },
  });
  const text = [
    `Hi ${name},`,
    'Your loan application has been reviewed and we cannot proceed at this time.',
    reason ? `Reason: ${reason}` : null,
    `View applications: ${loansUrl}`,
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}
