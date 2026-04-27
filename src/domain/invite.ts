import { ValidationError } from './errors.js';
import type {
  InviteId,
  OrganizationId,
  UserId,
} from './ids.js';
import type { OrganizationRole } from './organization.js';

const TOKEN_LENGTH = 32;
const MAX_EMAIL_HINT_LENGTH = 254;

export interface Invite {
  readonly id: InviteId;
  readonly organizationId: OrganizationId;
  readonly token: string;
  readonly emailHint: string | null;
  readonly role: OrganizationRole;
  readonly createdByUserId: UserId;
  readonly acceptedByUserId: UserId | null;
  readonly acceptedAt: string | null;
  readonly revokedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const validateInviteToken = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.length < TOKEN_LENGTH) {
    throw new ValidationError('invite token is invalid');
  }
  return trimmed;
};

export const normalizeEmailHint = (raw: string | null | undefined): string | null => {
  if (raw === null || raw === undefined) {
    return null;
  }
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > MAX_EMAIL_HINT_LENGTH) {
    throw new ValidationError('email hint is too long');
  }
  return trimmed;
};

export const isPending = (invite: Invite): boolean =>
  invite.acceptedAt === null && invite.revokedAt === null;
