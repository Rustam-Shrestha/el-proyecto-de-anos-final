import { env } from '@/config/env';
import { logger } from '@/config/logger';
import nodemailer, { type Transporter } from 'nodemailer';

const isSmtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_PORT);

const transporter: Transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      connectionTimeout: 5000,
      socketTimeout: 5000,
      auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

const defaultFrom = 'noreply@finguard.local';

function sendInBackground(
  to: string,
  subject: string,
  html: string,
  text: string,
  failureMessage: string
): void {
  const sendPromise = transporter
    .sendMail({ from: defaultFrom, to, subject, html, text })
    .then((info) => {
      if (isSmtpConfigured) {
        logger.info({ email: to, subject, messageId: info.messageId }, 'Email sent');
      } else {
        logger.info(
          { email: to, subject, payload: JSON.parse(info.message as string) },
          'Email captured (dev mode, no SMTP configured)'
        );
      }
    })
    .catch((error) => {
      logger.warn({ err: error, email: to, subject }, failureMessage);
    });

  void sendPromise;
}

export const mailService = {
  sendVerificationMail(email: string, token: string): void {
    const verificationUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    const subject = 'Verify Your FinGuard Email';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #111827; margin: 0 0 16px;">Verify Your Email Address</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Thank you for signing up. Please verify your email address by clicking the button below.</p>
        <p style="margin: 28px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
        </p>
        <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">If the button does not work, paste this link into your browser:<br />${verificationUrl}</p>
        <p style="color: #6b7280; font-size: 13px;">This link expires in 24 hours.</p>
      </div>
    `;

    const textContent = [
      'Verify your email address.',
      `Open this link: ${verificationUrl}`,
      'This link expires in 24 hours.',
    ].join('\n');

    sendInBackground(email, subject, htmlContent, textContent, 'Failed to send verification email');
  },

  sendPasswordResetMail(email: string, token: string): void {
    const resetUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const subject = 'Reset Your FinGuard Password';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #111827; margin: 0 0 16px;">Reset Your Password</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Use the button below to continue.</p>
        <p style="margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
        </p>
        <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">If the button does not work, paste this link into your browser:<br />${resetUrl}</p>
        <p style="color: #6b7280; font-size: 13px;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
      </div>
    `;

    const textContent = [
      'Reset your password.',
      `Open this link: ${resetUrl}`,
      'This link expires in 1 hour.',
      'If you did not request this, ignore this email.',
    ].join('\n');

    sendInBackground(email, subject, htmlContent, textContent, 'Failed to send password reset email');
  },

  sendKycApprovedMail(email: string, fullName?: string): void {
    const dashboardUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
    const subject = 'KYC Verification Approved';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f0fdf4;">
        <h2 style="color: #15803d; margin: 0 0 16px;">KYC Verification Approved</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${fullName || 'there'},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Your KYC application has been approved. You now have full access to all eligible features.</p>
        <p style="margin-top: 28px;">
          <a href="${dashboardUrl}" style="background-color: #15803d; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Dashboard</a>
        </p>
      </div>
    `;

    const textContent = [
      `Hi ${fullName || 'there'},`,
      'Your KYC application has been approved.',
      `Open the dashboard: ${dashboardUrl}`,
    ].join('\n');

    sendInBackground(email, subject, htmlContent, textContent, 'Failed to send KYC approval email');
  },

  sendKycRejectedMail(email: string, fullName?: string, reason?: string): void {
    const resubmitUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/kyc/resubmit`;
    const subject = 'KYC Verification Rejected';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fef2f2;">
        <h2 style="color: #dc2626; margin: 0 0 16px;">KYC Verification Rejected</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${fullName || 'there'},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Your KYC application has been rejected.</p>
        ${reason ? `<p style="color: #374151; background-color: #fee2e2; padding: 12px; border-radius: 8px;"><strong>Reason:</strong> ${reason}</p>` : ''}
        <p style="margin-top: 28px;">
          <a href="${resubmitUrl}" style="background-color: #dc2626; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600;">Resubmit Application</a>
        </p>
      </div>
    `;

    const textContent = [
      `Hi ${fullName || 'there'},`,
      'Your KYC application has been rejected.',
      reason ? `Reason: ${reason}` : null,
      `Resubmit here: ${resubmitUrl}`,
    ].filter(Boolean).join('\n');

    sendInBackground(email, subject, htmlContent, textContent, 'Failed to send KYC rejection email');
  },

  sendKycResubmitMail(email: string, fullName?: string, note?: string): void {
    const resubmitUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/kyc/resubmit`;
    const subject = 'Action Required: Resubmit KYC Application';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fffbeb;">
        <h2 style="color: #b45309; margin: 0 0 16px;">Action Required: Resubmit KYC</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${fullName || 'there'},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Your KYC application requires resubmission. Please address the feedback below and submit again.</p>
        ${note ? `<p style="color: #374151; background-color: #fef3c7; padding: 12px; border-radius: 8px;"><strong>Note:</strong> ${note}</p>` : ''}
        <p style="margin-top: 28px;">
          <a href="${resubmitUrl}" style="background-color: #b45309; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600;">Resubmit KYC</a>
        </p>
      </div>
    `;

    const textContent = [
      `Hi ${fullName || 'there'},`,
      'Your KYC application requires resubmission.',
      note ? `Note: ${note}` : null,
      `Resubmit here: ${resubmitUrl}`,
    ].filter(Boolean).join('\n');

    sendInBackground(email, subject, htmlContent, textContent, 'Failed to send KYC resubmit email');
  },
};

