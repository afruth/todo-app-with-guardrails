import { ValidationError } from './errors.js';
import { asInviteId, asOrganizationId, asUserId } from './ids.js';
import {
  isPending,
  normalizeEmailHint,
  validateInviteToken,
  type Invite,
} from './invite.js';

const baseInvite: Invite = {
  id: asInviteId('i-1'),
  organizationId: asOrganizationId('o-1'),
  token: 'a'.repeat(32),
  emailHint: null,
  role: 'member',
  createdByUserId: asUserId('u-1'),
  acceptedByUserId: null,
  acceptedAt: null,
  revokedAt: null,
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
};

describe('validateInviteToken', () => {
  it('accepts a 32-character token', () => {
    expect(validateInviteToken('a'.repeat(32))).toBe('a'.repeat(32));
  });

  it('rejects a too-short token', () => {
    expect(() => validateInviteToken('short')).toThrow(ValidationError);
  });
});

describe('normalizeEmailHint', () => {
  it('returns null for null', () => {
    expect(normalizeEmailHint(null)).toBeNull();
  });
  it('returns null for undefined', () => {
    expect(normalizeEmailHint(undefined)).toBeNull();
  });
  it('returns null for an empty string', () => {
    expect(normalizeEmailHint('   ')).toBeNull();
  });
  it('lowercases and trims a valid email hint', () => {
    expect(normalizeEmailHint('  Foo@Example.COM  ')).toBe('foo@example.com');
  });
  it('rejects an excessively long hint', () => {
    const long = `${'a'.repeat(250)}@example.com`;
    expect(() => normalizeEmailHint(long)).toThrow(ValidationError);
  });
});

describe('isPending', () => {
  it('returns true when neither accepted nor revoked', () => {
    expect(isPending(baseInvite)).toBe(true);
  });
  it('returns false when accepted', () => {
    expect(
      isPending({
        ...baseInvite,
        acceptedAt: '2026-04-26T01:00:00.000Z',
        acceptedByUserId: asUserId('u-2'),
      }),
    ).toBe(false);
  });
  it('returns false when revoked', () => {
    expect(
      isPending({ ...baseInvite, revokedAt: '2026-04-26T01:00:00.000Z' }),
    ).toBe(false);
  });
});
