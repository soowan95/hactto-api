import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../../mail/application/mail.service';
import { prisma } from '../../../libs/prisma';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { RedisService } from '../../../helpers/redis/application/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
  ) {}

  private getRestoreSecret(): string {
    return process.env.RESTORE_SECRET || 'fallback_restore_secret_hactto';
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private async generateUniqueId(): Promise<string> {
    while (true) {
      const id = this.generateId();
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) return id;
    }
  }

  private generateRestoreToken(email: string): string {
    return crypto
      .createHmac('sha256', this.getRestoreSecret())
      .update(email)
      .digest('hex');
  }

  async sendVerificationEmail(email: string): Promise<{ isRestore: boolean }> {
    const restoreToken = this.generateRestoreToken(email);
    const existingDeleted = await prisma.user.findUnique({
      where: { restoreToken },
    });

    if (existingDeleted && existingDeleted.deletedAt) {
      // 1년 이내 탈퇴 계정인 경우 복원 메일 발송
      const token = this.jwtService.sign(
        { email, type: 'restore' },
        { expiresIn: '15m' },
      );
      await this.mailService.sendRestoreEmail(email, token);
      return { isRestore: true };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && !existingUser.deletedAt) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const token = this.jwtService.sign(
      { email, type: 'signup' },
      { expiresIn: '15m' },
    );
    await this.mailService.sendSignupVerificationEmail(email, token);
    return { isRestore: false };
  }

  async verifySignupToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'signup')
        throw new BadRequestException('유효하지 않은 토큰입니다.');
      return { email: payload.email };
    } catch {
      throw new BadRequestException('토큰이 만료되었거나 유효하지 않습니다.');
    }
  }

  private validatePassword(password: string) {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]).{10,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        '비밀번호는 영문 대소문자, 숫자, 특수기호를 모두 포함하여 10자리 이상이어야 합니다.',
      );
    }
  }

  async signup(email: string, nickname: string, passwordRaw: string) {
    this.validatePassword(passwordRaw);
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail && !existingEmail.deletedAt)
      throw new ConflictException('이미 가입된 이메일입니다.');

    const existingNickname = await prisma.user.findUnique({
      where: { nickname },
    });
    if (existingNickname)
      throw new ConflictException('이미 사용 중인 닉네임입니다.');

    const password = await argon2.hash(passwordRaw);
    const id = await this.generateUniqueId();

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          id,
          email,
          password,
          nickname,
        },
      });

      await tx.hon.create({
        data: {
          userId: id,
          freeBalance: 50,
          paidBalance: 0,
        },
      });

      return createdUser;
    });

    return this.generateTokens(user.id);
  }

  async login(email: string, passwordRaw: string, ip: string) {
    let failLog = await prisma.loginFailLog.findUnique({
      where: { ip_email: { ip, email } },
    });

    if (failLog && failLog.lockedUntil && failLog.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        '5회 이상 로그인을 실패하여 5분간 로그인이 제한됩니다. 잠시 후 다시 시도해 주세요.',
      );
    }

    // If lockout expired, reset it
    if (failLog && failLog.lockedUntil && failLog.lockedUntil <= new Date()) {
      failLog = await prisma.loginFailLog.update({
        where: { ip_email: { ip, email } },
        data: { failCount: 0, lockedUntil: null },
      });
    }

    const handleFail = async () => {
      if (!failLog) {
        failLog = await prisma.loginFailLog.create({
          data: { ip, email, failCount: 1 },
        });
      } else {
        failLog = await prisma.loginFailLog.update({
          where: { ip_email: { ip, email } },
          data: {
            failCount: failLog.failCount + 1,
            lockedUntil:
              failLog.failCount + 1 >= 5
                ? new Date(Date.now() + 5 * 60 * 1000)
                : null,
          },
        });
      }

      if (failLog.failCount >= 5) {
        throw new UnauthorizedException(
          '5회 이상 로그인을 실패하여 5분간 로그인이 제한됩니다. 잠시 후 다시 시도해 주세요.',
        );
      }
      throw new UnauthorizedException(
        `이메일 또는 비밀번호가 올바르지 않습니다. (로그인 실패: ${failLog.failCount}/5)`,
      );
    };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || !user.password) {
      return handleFail();
    }

    const isValid = await argon2.verify(user.password, passwordRaw);
    if (!isValid) {
      return handleFail();
    }

    if (failLog) {
      await prisma.loginFailLog.delete({ where: { ip_email: { ip, email } } });
    }

    const tokens = await this.generateTokens(user.id);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async sendPasswordResetLink(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      // 보안상 가입되지 않은 이메일이라도 성공 메시지를 반환할 수 있으나, 요구사항에 따라 에러 반환 가능성 있음.
      // 명확한 피드백을 위해 에러 반환.
      throw new BadRequestException('가입되지 않은 이메일입니다.');
    }

    const token = this.jwtService.sign(
      { email, type: 'reset-password' },
      { expiresIn: '15m' },
    );
    await this.mailService.sendPasswordResetEmail(email, token);
  }

  async resetPassword(token: string, passwordRaw: string) {
    this.validatePassword(passwordRaw);

    let email: string;
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'reset-password')
        throw new BadRequestException('유효하지 않은 토큰입니다.');
      email = payload.email;
    } catch {
      throw new BadRequestException('토큰이 만료되었거나 유효하지 않습니다.');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt)
      throw new BadRequestException('유효하지 않은 사용자입니다.');

    const password = await argon2.hash(passwordRaw);
    await prisma.user.update({
      where: { email },
      data: { password },
    });
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '14d' });

    await this.redisService.set(
      `refresh_token:${userId}`,
      refreshToken,
      14 * 24 * 60 * 60,
    );

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const userId = payload.sub;
      const storedToken = await this.redisService.get(
        `refresh_token:${userId}`,
      );

      if (storedToken !== refreshToken)
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');

      return this.generateTokens(userId);
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
  }

  async sendWithdrawalLink(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt)
      throw new BadRequestException('유효하지 않은 사용자입니다.');

    const token = this.jwtService.sign(
      { sub: userId, type: 'withdraw' },
      { expiresIn: '15m' },
    );
    await this.mailService.sendWithdrawalEmail(user.email!, token);
  }

  async withdraw(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'withdraw')
        throw new BadRequestException('유효하지 않은 토큰입니다.');

      const userId = payload.sub;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.deletedAt || !user.email)
        throw new BadRequestException('유효하지 않은 사용자입니다.');

      const restoreToken = this.generateRestoreToken(user.email);
      const randomHash = crypto.randomBytes(32).toString('hex');

      await prisma.user.update({
        where: { id: userId },
        data: {
          email: `${randomHash}@deleted.local`,
          password: await argon2.hash(randomHash),
          nickname: null,
          providerId: null,
          restoreToken,
          deletedAt: new Date(),
        },
      });

      await this.redisService.del(`refresh_token:${userId}`);
    } catch {
      throw new BadRequestException('토큰이 만료되었거나 유효하지 않습니다.');
    }
  }

  async verifyRestoreToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'restore')
        throw new BadRequestException('유효하지 않은 토큰입니다.');

      const email = payload.email;
      const restoreToken = this.generateRestoreToken(email);

      const user = await prisma.user.findUnique({ where: { restoreToken } });
      if (!user || !user.deletedAt)
        throw new BadRequestException('복원할 계정이 없습니다.');

      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: email,
          restoreToken: null,
          deletedAt: null,
        },
      });
    } catch {
      throw new BadRequestException('토큰이 만료되었거나 유효하지 않습니다.');
    }
  }
}
