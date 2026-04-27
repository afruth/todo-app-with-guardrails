import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type CredentialsDto = z.infer<typeof credentialsSchema>;

export interface AuthResponse {
  readonly user: {
    readonly id: string;
    readonly email: string;
  };
}
