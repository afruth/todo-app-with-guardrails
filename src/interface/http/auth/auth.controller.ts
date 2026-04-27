import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AUTH_USE_CASES, type AuthUseCases } from '../tokens.js';
import { ZodValidationPipe } from '../zod-validation.pipe.js';
import {
  credentialsSchema,
  type AuthResponse,
  type CredentialsDto,
} from './auth.dto.js';

const COOKIE_NAME = 'todo_session';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const setSessionCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  });
};

@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AUTH_USE_CASES) private readonly cases: AuthUseCases) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(credentialsSchema)) input: CredentialsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.cases.signUp.execute(input);
    setSessionCookie(res, result.token);
    return { user: { id: result.user.id, email: result.user.email } };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(credentialsSchema)) input: CredentialsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.cases.logIn.execute(input);
    setSessionCookie(res, result.token);
    return { user: { id: result.user.id, email: result.user.email } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(COOKIE_NAME, { path: '/' });
  }
}
