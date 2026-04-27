import type { UserId } from '../../domain/ids.js';
import type { User } from '../../domain/user.js';

export interface UserRepository {
  insert(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
