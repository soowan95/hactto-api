import {
  Controller,
  Post,
  Body,
  Query,
  Get,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from '../application/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-verification')
  @HttpCode(HttpStatus.OK)
  async sendVerification(@Body('email') email: string) {
    const result = await this.authService.sendVerificationEmail(email);
    return {
      success: true,
      isRestore: result.isRestore,
      message: result.isRestore
        ? '복원 안내 메일이 발송되었습니다.'
        : '인증 메일이 발송되었습니다.',
    };
  }

  @Get('verify-signup')
  async verifySignupToken(@Query('token') token: string) {
    return this.authService.verifySignupToken(token);
  }

  @Post('signup')
  async signup(@Body() body: any) {
    const { email, nickname, password } = body;
    return this.authService.signup(email, nickname, password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: any, @Body() body: any) {
    const { email, password } = body;
    const ip =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      '0.0.0.0';
    const clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
    return this.authService.login(email, password, clientIp);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('withdraw/send-link')
  @HttpCode(HttpStatus.OK)
  async sendWithdrawalLink(@Body('userId') userId: string) {
    // Should be from AuthGuard
    await this.authService.sendWithdrawalLink(userId);
    return { success: true };
  }

  @Post('withdraw/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmWithdrawal(@Body('token') token: string) {
    await this.authService.withdraw(token);
    return { success: true };
  }

  @Post('restore/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmRestore(@Body('token') token: string) {
    await this.authService.verifyRestoreToken(token);
    return { success: true };
  }

  @Post('reset-password/send-link')
  @HttpCode(HttpStatus.OK)
  async sendPasswordResetLink(@Body('email') email: string) {
    await this.authService.sendPasswordResetLink(email);
    return { success: true };
  }

  @Post('reset-password/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordReset(@Body() body: any) {
    const { token, password } = body;
    await this.authService.resetPassword(token, password);
    return { success: true };
  }
}
