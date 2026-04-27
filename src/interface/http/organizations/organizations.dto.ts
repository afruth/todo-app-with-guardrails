import { z } from 'zod';
import type { Organization } from '../../../domain/organization.js';

export const createOrganizationSchema = z.object({
  name: z.string(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().optional(),
  logoPath: z.string().nullable().optional(),
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;

export interface OrganizationView {
  readonly id: string;
  readonly name: string;
  readonly logoPath: string | null;
}

export const orgToView = (org: Organization): OrganizationView => ({
  id: org.id,
  name: org.name,
  logoPath: org.logoPath,
});
