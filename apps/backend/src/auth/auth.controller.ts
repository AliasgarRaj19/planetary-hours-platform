import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { getUnauthenticatedAuditContextFromRequest } from '../audit/types/audit-context';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    const context = getUnauthenticatedAuditContextFromRequest(
      request,
      loginDto.username,
    );

    try {
      const result = await this.authService.login(
        loginDto.username,
        loginDto.password,
      );

      await this.auditService.record({
        action: 'auth.login.success',
        module: 'auth',
        resourceType: 'admin_session',
        resourceId: loginDto.username,
        resourceDisplayName: loginDto.username,
        description: 'Admin login succeeded.',
        context,
        metadata: {
          username: loginDto.username,
        },
      });

      return result;
    } catch (error) {
      await this.auditService.record({
        action: 'auth.login.failure',
        module: 'auth',
        resourceType: 'admin_session',
        resourceId: loginDto.username,
        resourceDisplayName: loginDto.username,
        description: 'Admin login failed.',
        result: 'failure',
        context,
        metadata: {
          username: loginDto.username,
        },
      });

      throw error;
    }
  }
}
