import type { UserRepository } from '../../src/application/ports/user-repository.js';
import type { UserId } from '../../src/domain/ids.js';
import type { User } from '../../src/domain/user.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<UserId, User>();
  private readonly byEmail = new Map<string, User>();

  insert(user: User): Promise<void> {
    this.byId.set(user.id, user);
    this.byEmail.set(user.email, user);
    return Promise.resolve();
  }

  findById(id: UserId): Promise<User | null> {
    return Promise.resolve(this.byId.get(id) ?? null);
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.byEmail.get(email) ?? null);
  }
}
