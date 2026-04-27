import { eq } from 'drizzle-orm';
import type { UserRepository } from '../../application/ports/user-repository.js';
import { asUserId, type UserId } from '../../domain/ids.js';
import type { User } from '../../domain/user.js';
import type { Db } from './database.js';
import { users } from './schema/users.js';

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  async insert(user: User): Promise<void> {
    await this.db.insert(users).values({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async findById(id: UserId): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    const row = rows[0];
    return row === undefined ? null : toUser(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : toUser(row);
  }
}

interface UserRow {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const toUser = (row: UserRow): User => ({
  id: asUserId(row.id),
  email: row.email,
  passwordHash: row.passwordHash,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
