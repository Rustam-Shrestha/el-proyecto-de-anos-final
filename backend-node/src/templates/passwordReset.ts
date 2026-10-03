import { layout, type EmailContent } from './layout';

export interface PasswordResetParams {
  resetUrl: string;
}

export function passwordResetEmail({ resetUrl }: PasswordResetParams): EmailContent {
  const subject = 'Reset Your FinGuard Password';
  const html = layout({
    title: 'Reset Your Password',
    preheader: 'Reset your FinGuard password — link expires in 1 hour',
    bodyHtml: `<p style="color: #374151; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Use the button below to continue.</p>
      <p style="color: #6b7280; font-size: 13px;">This link expires in 1 hour. If you did not request this, ignore this email.</p>`,
    cta: { label: 'Reset Password', href: resetUrl },
  });
  const text = [
    'Reset your password.',
    `Open this link: ${resetUrl}`,
    'This link expires in 1 hour.',
    'If you did not request this, ignore this email.',
  ].join('\n');
  return { subject, html, text };
}
