import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { asMembershipId, asOrganizationId } from '../../../domain/ids.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth.guard.js';
import {
  ORG_USE_CASES,
  type OrgUseCases,
} from '../tokens.js';
import { ZodValidationPipe } from '../zod-validation.pipe.js';
import {
  createOrganizationSchema,
  orgToView,
  updateOrganizationSchema,
  type CreateOrganizationDto,
  type OrganizationView,
  type UpdateOrganizationDto,
} from './organizations.dto.js';

const MAX_LOGO_BYTES = 1_048_576;
const ALLOWED_LOGO_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);

interface UploadedLogo {
  readonly buffer: Buffer;
  readonly mimetype: string;
  readonly originalname: string;
}

const extensionFor = (mimetype: string): string => {
  if (mimetype === 'image/png') {
    return 'png';
  }
  if (mimetype === 'image/jpeg') {
    return 'jpg';
  }
  return 'webp';
};

interface MembershipView {
  readonly id: string;
  readonly userId: string;
  readonly userEmail: string;
  readonly role: string;
}

@Controller('api/organizations')
@UseGuards(AuthGuard)
export class OrganizationsController {
  constructor(
    @Inject(ORG_USE_CASES) private readonly cases: OrgUseCases,
  ) {}

  @Get()
  async listMine(@Req() req: AuthenticatedRequest): Promise<readonly { id: string; name: string; role: string; logoPath: string | null }[]> {
    const memberships = await this.cases.listMyOrganizations.execute(req.userId);
    return memberships.map((m) => ({
      id: m.organizationId,
      name: m.organizationName,
      role: m.role,
      logoPath: m.organizationLogoPath,
    }));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createOrganizationSchema)) input: CreateOrganizationDto,
  ): Promise<OrganizationView> {
    const result = await this.cases.createOrganization.execute(req.userId, input.name);
    return orgToView(result.organization);
  }

  @Patch(':orgId')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
    @Body(new ZodValidationPipe(updateOrganizationSchema)) input: UpdateOrganizationDto,
  ): Promise<OrganizationView> {
    const updated = await this.cases.updateOrganization.execute(
      req.userId,
      asOrganizationId(orgId),
      input,
    );
    return orgToView(updated);
  }

  @Post(':orgId/logo')
  @UseInterceptors(FileInterceptor('logo', { limits: { fileSize: MAX_LOGO_BYTES } }))
  async uploadLogo(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
    @UploadedFile() file: UploadedLogo | undefined,
  ): Promise<OrganizationView> {
    if (file === undefined) {
      throw new BadRequestException('logo file is required');
    }
    if (!ALLOWED_LOGO_MIMES.has(file.mimetype)) {
      throw new BadRequestException('unsupported logo format');
    }
    const ext = extensionFor(file.mimetype);
    const filename = `${orgId}-${Date.now().toString()}.${ext}`;
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, filename), file.buffer);
    const logoPath = `/uploads/${filename}`;
    const updated = await this.cases.updateOrganization.execute(
      req.userId,
      asOrganizationId(orgId),
      { logoPath },
    );
    return orgToView(updated);
  }

  @Get(':orgId/members')
  async listMembers(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
  ): Promise<readonly MembershipView[]> {
    const members = await this.cases.listMembers.execute(
      req.userId,
      asOrganizationId(orgId),
    );
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      userEmail: m.userEmail,
      role: m.role,
    }));
  }

  @Delete(':orgId/members/:membershipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
    @Param('membershipId') membershipId: string,
  ): Promise<void> {
    await this.cases.removeMember.execute(
      req.userId,
      asOrganizationId(orgId),
      asMembershipId(membershipId),
    );
  }
}
