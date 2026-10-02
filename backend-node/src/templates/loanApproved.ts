import { escapeHtml, layout, type EmailContent } from './layout';

export interface LoanApprovedParams {
  fullName?: string;
  amount?: number | string;
  portfolioUrl: string;
}

export function loanApprovedEmail({ fullName, amount, portfolioUrl }: LoanApprovedParams): EmailContent {
  const subject = 'Loan Application Approved - FinGuard';
  const name = fullName || 'there';
  const amountText =
    amount !== undefined && amount !== null && `${amount}` !== '' ? ` for ₹${Number(amount).toLocaleString('en-IN')}` : '';
  const html = layout({
    title: 'Loan Approved',
    preheader: `Your loan application${amountText} has been approved`,
    bodyHtml: `<p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${escapeHtml(name)},</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Congratulations! Your loan application${escapeHtml(amountText)} has been approved. Funds will be disbursed within 2-3 business days.</p>`,
    cta: { label: 'View Loan Details', href: portfolioUrl },
  });
  const text = [
    `Hi ${name},`,
    `Your loan application${amountText} has been approved. Funds will be disbursed within 2-3 business days.`,
    `View details: ${portfolioUrl}`,
  ].join('\n');
  return { subject, html, text };
}
