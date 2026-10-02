import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { prisma } from '@/config/database';
import nodemailer, { type Transporter } from 'nodemailer';
import { buildEmail, type EmailParams, type EmailType } from '@/templates';

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

// Gmail (and most providers) require the From address to match the
// authenticated account, otherwise sends are rejected.
const defaultFrom = env.SMTP_USER || 'noreply@finguard.local';

/**
 * Best-effort delivery log. Never throws — email auditing must not break
 * the request that triggered the send (or the send itself).
 */
async function logEmail(to: string, type: string, subject: string, status: 'SENT' | 'FAILED', error?: string): Promise<void> {
  try {
    await prisma.emailLog.create({ data: { to, type, subject, status, error: error ?? null } });
  } catch (err) {
    logger.warn({ err, email: to, subject }, 'EmailLog write failed (non-fatal)');
  }
}

function sendInBackground(to: string, params: EmailParams, failureMessage: string): void {
  const { type, content } = buildEmail(params);
  const sendPromise = transporter
    .sendMail({ from: defaultFrom, to, subject: content.subject, html: content.html, text: content.text })
    .then((info) => {
      if (isSmtpConfigured) {
        logger.info({ email: to, subject: content.subject, messageId: info.messageId }, 'Email sent');
      } else {
        logger.info(
          { email: to, subject: content.subject, payload: JSON.parse(info.message as string) },
          'Email captured (dev mode, no SMTP configured)'
        );
      }
      void logEmail(to, type, content.subject, 'SENT');
    })
    .catch((error) => {
      logger.warn({ err: error, email: to, subject: content.subject }, failureMessage);
      void logEmail(to, type, content.subject, 'FAILED', error instanceof Error ? error.message : String(error));
    });

  void sendPromise;
}

const frontendBase = env.FRONTEND_URL || 'http://localhost:5173';

export const mailService = {
  sendMail(email: string, subject: string, text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      transporter.sendMail({ from: defaultFrom, to: email, subject, text, html: `<p>${text}</p>` }, (err) => {
        if (err) {
          logger.warn({ err }, 'sendMail failed');
          void logEmail(email, 'generic', subject, 'FAILED', err instanceof Error ? err.message : String(err));
          reject(err);
        } else {
          void logEmail(email, 'generic', subject, 'SENT');
          resolve();
        }
      });
    });
  },
  /**
   * Invitation mail for a company. Always mentions the 6-digit invitation
   * code for that company (the user types it in the app); the accept link
   * is included as a shortcut.
   */
  sendInviteMail(email: string, companyName: string, link: string, code?: string): void {
    sendInBackground(email, { type: 'invite', companyName, link, code }, 'Failed to send invite');
  },
  sendVerificationMail(email: string, token: string): void {
    sendInBackground(
      email,
      { type: 'verification', verificationUrl: `${frontendBase}/verify-email?token=${token}` },
      'Failed to send verification email'
    );
  },

  sendPasswordResetMail(email: string, token: string): void {
    sendInBackground(
      email,
      { type: 'password-reset', resetUrl: `${frontendBase}/reset-password?token=${token}` },
      'Failed to send password reset email'
    );
  },

  sendKycApprovedMail(email: string, fullName?: string): void {
    sendInBackground(
      email,
      {
        type: 'kyc-approved',
        fullName,
        lendersUrl: `${frontendBase}/dashboard/lenders`,
      },
      'Failed to send KYC approval email'
    );
  },

  sendKycRejectedMail(email: string, fullName?: string, reason?: string): void {
    sendInBackground(
      email,
      {
        type: 'kyc-rejected',
        fullName,
        reason,
        resubmitUrl: `${frontendBase}/dashboard/kyc-submit`,
      },
      'Failed to send KYC rejection email'
    );
  },

  sendLoanApprovedMail(email: string, amount?: number | string, fullName?: string): void {
    sendInBackground(
      email,
      {
        type: 'loan-approved',
        fullName,
        amount,
        portfolioUrl: `${frontendBase}/portfolio`,
      },
      'Failed to send loan approval email'
    );
  },

  sendLoanRejectedMail(email: string, fullName?: string, reason?: string): void {
    sendInBackground(
      email,
      { type: 'loan-rejected', fullName, reason, loansUrl: `${frontendBase}/loans` },
      'Failed to send loan rejection email'
    );
  },

  sendKycResubmitMail(email: string, fullName?: string, note?: string): void {
    sendInBackground(
      email,
      {
        type: 'kyc-resubmit',
        fullName,
        note,
        resubmitUrl: `${frontendBase}/kyc/resubmit`,
      },
      'Failed to send KYC resubmit email'
    );
  },
};

export type { EmailType };
