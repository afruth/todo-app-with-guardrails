import { ConflictError } from '../../domain/errors.js';
import { asUserId } from '../../domain/ids.js';
import { normalizeEmail, validatePassword, type User } from '../../domain/user.js';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { TokenSigner } from '../ports/token-signer.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { CreateOrganization } from './create-organization.js';

export interface SignUpInput {
  readonly email: string;
  readonly password: string;
}

export interface SignUpResult {
  readonly user: User;
  readonly token: string;
}

export interface SignUpDeps {
  readonly users: UserRepository;
  readonly hasher: PasswordHasher;
  readonly tokens: TokenSigner;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly createOrganization: CreateOrganization;
}

const DEFAULT_ORG_NAME = 'Personal';

export class SignUp {
  constructor(private readonly deps: SignUpDeps) {}

  async execute(input: SignUpInput): Promise<SignUpResult> {
    const email = normalizeEmail(input.email);
    const password = validatePassword(input.password);
    const existing = await this.deps.users.findByEmail(email);
    if (existing !== null) {
      throw new ConflictError('email is already registered');
    }
    const now = this.deps.clock.nowIso();
    const passwordHash = await this.deps.hasher.hash(password);
    const user: User = {
      id: asUserId(this.deps.ids.next()),
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.users.insert(user);
    await this.deps.createOrganization.execute(user.id, DEFAULT_ORG_NAME);
    const token = await this.deps.tokens.sign({ userId: user.id });
    return { user, token };
  }
}
