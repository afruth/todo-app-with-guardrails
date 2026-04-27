import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { SystemClock } from '../../infrastructure/clock.js';
import { openDatabase } from '../../infrastructure/db/database.js';
import { DrizzleInviteRepository } from '../../infrastructure/db/invite-repository.js';
import { DrizzleMembershipRepository } from '../../infrastructure/db/membership-repository.js';
import { DrizzleOrganizationRepository } from '../../infrastructure/db/organization-repository.js';
import { DrizzleProjectRepository } from '../../infrastructure/db/project-repository.js';
import { DrizzleTagRepository } from '../../infrastructure/db/tag-repository.js';
import { DrizzleTodoRepository } from '../../infrastructure/db/todo-repository.js';
import { DrizzleUserRepository } from '../../infrastructure/db/user-repository.js';
import { UuidV7Generator } from '../../infrastructure/id-generator.js';
import { BcryptPasswordHasher } from '../../infrastructure/password-hasher.js';
import { RandomTokenGenerator } from '../../infrastructure/token-generator.js';
import { JoseTokenSigner } from '../../infrastructure/token-signer.js';
import { AppModule } from './app.module.js';
import { DomainErrorFilter } from './domain-error.filter.js';

const DEFAULT_PORT = 3000;
const DEFAULT_DB_PATH = './data.sqlite';
const DEFAULT_SECRET = 'change-me-in-prod-please-do-not-use-this';

const bootstrap = async (): Promise<void> => {
  const handle = openDatabase(process.env.DB_PATH ?? DEFAULT_DB_PATH);
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register({
      users: new DrizzleUserRepository(handle.db),
      organizations: new DrizzleOrganizationRepository(handle.db),
      memberships: new DrizzleMembershipRepository(handle.db),
      invites: new DrizzleInviteRepository(handle.db),
      projects: new DrizzleProjectRepository(handle.db),
      tags: new DrizzleTagRepository(handle.db),
      todos: new DrizzleTodoRepository(handle.db),
      hasher: new BcryptPasswordHasher(),
      tokens: new JoseTokenSigner(process.env.JWT_SECRET ?? DEFAULT_SECRET),
      inviteTokens: new RandomTokenGenerator(),
      clock: new SystemClock(),
      ids: new UuidV7Generator(),
    }),
  );
  app.use(cookieParser());
  app.useGlobalFilters(new DomainErrorFilter());
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  await app.listen(port);
  console.warn(`Backend listening on http://localhost:${String(port)}`);
};

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
