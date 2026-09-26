import jwt from 'jsonwebtoken';
import { tokenService } from '@/services/tokenService';
import { env } from '@/config/env';
import { MD_TO_LEGACY_ROLE } from '@/routes/slugCompatRoutes';
import { normalizeRoleName, roleKind, roleLabel, normalizePan } from '@/utils/roles';

describe('multi-tenant compat JWT (MD Part 5)', () => {
  it('round-trips sub/email/role/company_id/customer_id with iss/aud', () => {
    const token = tokenService.generateCompatToken({
      sub: 'user-1',
      email: 'admin@hdfc.finguard.local',
      role: 'company_admin',
      company_id: 7,
      customer_id: 'cust-9',
    });
    const payload = tokenService.verifyCompatToken(token);
    expect(payload).not.toBeNull();
    expect(payload).toMatchObject({
      sub: 'user-1',
      email: 'admin@hdfc.finguard.local',
      role: 'company_admin',
      company_id: 7,
      tenantId: 7,
      customer_id: 'cust-9',
    });
    const decoded = jwt.decode(token) as Record<string, unknown>;
    expect(decoded.iss).toBe('finguard');
    expect(decoded.aud).toBe('finguard-app');
  });

  it('falls back to legacy tokens without iss/aud', () => {
    const legacy = jwt.sign({ sub: 'u2', email: 'x@y.z', role: 'ADMIN', tenantId: 3 }, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
    });
    const payload = tokenService.verifyCompatToken(legacy);
    expect(payload).toMatchObject({ sub: 'u2', role: 'ADMIN', tenantId: 3 });
  });

  it('rejects garbage tokens', () => {
    expect(tokenService.verifyCompatToken('not-a-token')).toBeNull();
    expect(tokenService.verifyCompatToken('')).toBeNull();
  });

  it('normalizes every role spelling to one canonical role', () => {
    expect(normalizeRoleName('company_admin')).toBe('ADMIN');
    expect(normalizeRoleName('ADMIN')).toBe('ADMIN');
    expect(normalizeRoleName('customer')).toBe('USER');
    expect(normalizeRoleName('reviewer')).toBe('REVIEWER');
    expect(normalizeRoleName('Validator')).toBe('REVIEWER');
    expect(normalizeRoleName('supercontroller')).toBe('SUPERADMIN');
    expect(roleKind('company_admin')).toBe('admin');
    expect(roleKind('customer')).toBe('user');
    expect(roleLabel('ADMIN')).toBe('Company Admin');
    expect(roleLabel('USER')).toBe('Customer');
    expect(roleLabel('REVIEWER')).toBe('Reviewer');
  });

  it('accepts PAN in any reasonable format, rejects junk', () => {
    expect(normalizePan('ABCDE1234F')).toBe('ABCDE1234F');
    expect(normalizePan('abcde1234f')).toBe('ABCDE1234F');
    expect(normalizePan('ACME-DEMO-01')).toBe('ACMEDEMO01');
    expect(normalizePan('  himalayan03c ')).toBe('HIMALAYAN03C');
    expect(() => normalizePan('AB12')).toThrow();
    expect(() => normalizePan('!!!')).toThrow();
    expect(() => normalizePan('')).toThrow();
  });

  it('maps MD roles to legacy roles', () => {
    expect(MD_TO_LEGACY_ROLE).toMatchObject({
      company_admin: 'ADMIN',
      reviewer: 'REVIEWER',
      approver: 'REVIEWER',
      customer: 'USER',
    });
  });
});
