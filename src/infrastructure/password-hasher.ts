import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../application/ports/password-hasher.js';

const DEFAULT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds: number = DEFAULT_ROUNDS) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
