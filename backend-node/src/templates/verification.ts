import { layout, type EmailContent } from './layout';

export interface VerificationParams {
  verificationUrl: string;
}

export function verificationEmail({ verificationUrl }: VerificationParams): EmailContent {
  const subject = 'Verify Your FinGuard Email';
  const html = layout({
    title: 'Verify Your Email Address',
    preheader: 'Confirm your email to activate your FinGuard account',
    bodyHtml: `<p style="color: #374151; font-size: 16px; line-height: 1.6;">Thank you for signing up. Please verify your email address by clicking the button below.</p>
      <p style="color: #6b7280; font-size: 13px;">This link expires in 24 hours.</p>`,
    cta: { label: 'Verify Email', href: verificationUrl },
  });
  const text = ['Verify your email address.', `Open this link: ${verificationUrl}`, 'This link expires in 24 hours.'].join('\n');
  return { subject, html, text };
}
