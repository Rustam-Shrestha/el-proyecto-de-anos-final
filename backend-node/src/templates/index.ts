/**
 * Email template registry — the single catalogue of every transactional
 * email FinGuard sends. Each builder is a pure function
 * (params) => { subject, html, text }; delivery stays in mailService.
 */
import { inviteEmail, type InviteParams } from './invite';
import { verificationEmail, type VerificationParams } from './verification';
import { passwordResetEmail, type PasswordResetParams } from './passwordReset';
import { kycApprovedEmail, type KycApprovedParams } from './kycApproved';
import { kycRejectedEmail, type KycRejectedParams } from './kycRejected';
import { loanApprovedEmail, type LoanApprovedParams } from './loanApproved';
import { loanRejectedEmail, type LoanRejectedParams } from './loanRejected';
import { kycResubmitEmail, type KycResubmitParams } from './kycResubmit';
import type { EmailContent } from './layout';

export type EmailType =
  | 'invite'
  | 'verification'
  | 'password-reset'
  | 'kyc-approved'
  | 'kyc-rejected'
  | 'loan-approved'
  | 'loan-rejected'
  | 'kyc-resubmit';

export type EmailParams =
  | ({ type: 'invite' } & InviteParams)
  | ({ type: 'verification' } & VerificationParams)
  | ({ type: 'password-reset' } & PasswordResetParams)
  | ({ type: 'kyc-approved' } & KycApprovedParams)
  | ({ type: 'kyc-rejected' } & KycRejectedParams)
  | ({ type: 'loan-approved' } & LoanApprovedParams)
  | ({ type: 'loan-rejected' } & LoanRejectedParams)
  | ({ type: 'kyc-resubmit' } & KycResubmitParams);

export function buildEmail(params: EmailParams): { type: EmailType; content: EmailContent } {
  switch (params.type) {
    case 'invite':
      return { type: params.type, content: inviteEmail(params) };
    case 'verification':
      return { type: params.type, content: verificationEmail(params) };
    case 'password-reset':
      return { type: params.type, content: passwordResetEmail(params) };
    case 'kyc-approved':
      return { type: params.type, content: kycApprovedEmail(params) };
    case 'kyc-rejected':
      return { type: params.type, content: kycRejectedEmail(params) };
    case 'loan-approved':
      return { type: params.type, content: loanApprovedEmail(params) };
    case 'loan-rejected':
      return { type: params.type, content: loanRejectedEmail(params) };
    case 'kyc-resubmit':
      return { type: params.type, content: kycResubmitEmail(params) };
  }
}

export { escapeHtml, layout, type EmailContent } from './layout';
export type {
  InviteParams,
  VerificationParams,
  PasswordResetParams,
  KycApprovedParams,
  KycRejectedParams,
  LoanApprovedParams,
  LoanRejectedParams,
  KycResubmitParams,
};
