import { sql } from 'drizzle-orm';
import {
  index,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { organizations } from './organizations.js';
import { users } from './users.js';

export const organizationInvites = sqliteTable(
  'organization_invites',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    emailHint: text('email_hint'),
    role: text('role', { enum: ['owner', 'member'] }).notNull(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    acceptedByUserId: text('accepted_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    acceptedAt: text('accepted_at'),
    revokedAt: text('revoked_at'),
    createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    uniqueIndex('uniq_invite_token').on(table.token),
    index('idx_invite_org').on(table.organizationId),
  ],
);
