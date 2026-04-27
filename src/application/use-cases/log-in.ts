import { UnauthorizedError } from '../../domain/errors.js';
import { normalizeEmail, type User } from '../../domain/user.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { TokenSigner } from '../ports/token-signer.js';
import type { UserRepository } from '../ports/user-repository.js';

export interface LogInInput {
  readonly email: string;
  readonly password: string;
}

export interface LogInResult {
  readonly user: User;
  readonly token: string;
}

export interface LogInDeps {
  readonly users: UserRepository;
  readonly hasher: PasswordHasher;
  readonly tokens: TokenSigner;
}

export class LogIn {
  constructor(private readonly deps: LogInDeps) {}

  async execute(input: LogInInput): Promise<LogInResult> {
    const email = normalizeEmail(input.email);
    const user = await this.deps.users.findByEmail(email);
    if (user === null) {
      throw new UnauthorizedError('invalid credentials');
    }
    const ok = await this.deps.hasher.verify(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError('invalid credentials');
    }
    const token = await this.deps.tokens.sign({ userId: user.id });
    return { user, token };
  }
}
