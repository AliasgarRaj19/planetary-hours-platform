import { UnauthorizedException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AuthenticatedAdmin } from './types/authenticated-admin';

type JwtPayload = {
  sub: string;
  username: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const admin = await this.validateAdmin(username, password);

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: admin.username,
      username: admin.username,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
    };
  }

  async validateAdmin(
    username: string,
    password: string,
  ): Promise<AuthenticatedAdmin | null> {
    const configuredUsername =
      this.configService.getOrThrow<string>('auth.adminUsername');
    const passwordHash = this.configService.getOrThrow<string>(
      'auth.adminPasswordHash',
    );

    if (username !== configuredUsername) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return {
      username: configuredUsername,
    };
  }
}
