import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { asInviteId, asOrganizationId } from '../../../domain/ids.js';
import type { Invite } from '../../../domain/invite.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth.guard.js';
import { INVITE_USE_CASES, type InviteUseCases } from '../tokens.js';
import { ZodValidationPipe } from '../zod-validation.pipe.js';

const createInviteSchema = z.object({
  emailHint: z.string().optional().nullable(),
});
const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

type CreateInviteDto = z.infer<typeof createInviteSchema>;
type AcceptInviteDto = z.infer<typeof acceptInviteSchema>;

interface InviteView {
  readonly id: string;
  readonly token: string;
  readonly emailHint: string | null;
  readonly role: string;
  readonly acceptedAt: string | null;
  readonly revokedAt: string | null;
  readonly createdAt: string;
}

const toInviteView = (i: Invite): InviteView => ({
  id: i.id,
  token: i.token,
  emailHint: i.emailHint,
  role: i.role,
  acceptedAt: i.acceptedAt,
  revokedAt: i.revokedAt,
  createdAt: i.createdAt,
});

@Controller('api/organizations/:orgId/invites')
@UseGuards(AuthGuard)
export class OrgInvitesController {
  constructor(@Inject(INVITE_USE_CASES) private readonly cases: InviteUseCases) {}

  @Get()
  async list(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
  ): Promise<readonly InviteView[]> {
    const invites = await this.cases.listInvites.execute(
      req.userId,
      asOrganizationId(orgId),
    );
    return invites.map(toInviteView);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
    @Body(new ZodValidationPipe(createInviteSchema)) input: CreateInviteDto,
  ): Promise<InviteView> {
    const invite = await this.cases.createInvite.execute(
      req.userId,
      asOrganizationId(orgId),
      input,
    );
    return toInviteView(invite);
  }

  @Delete(':inviteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
    @Param('inviteId') inviteId: string,
  ): Promise<void> {
    await this.cases.revokeInvite.execute(
      req.userId,
      asOrganizationId(orgId),
      asInviteId(inviteId),
    );
  }
}

@Controller('api/invites')
export class InvitesPublicController {
  constructor(@Inject(INVITE_USE_CASES) private readonly cases: InviteUseCases) {}

  @Get(':token')
  async preview(
    @Param('token') token: string,
  ): Promise<{ id: string; name: string; logoPath: string | null }> {
    const org = await this.cases.previewInvite.execute(token);
    return { id: org.id, name: org.name, logoPath: org.logoPath };
  }

  @Post('accept')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async accept(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(acceptInviteSchema)) input: AcceptInviteDto,
  ): Promise<{ organizationId: string; organizationName: string }> {
    const result = await this.cases.acceptInvite.execute(req.userId, input.token);
    return {
      organizationId: result.organization.id,
      organizationName: result.organization.name,
    };
  }
}
