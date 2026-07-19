import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  private getClientUrl() {
    return process.env.CLIENT_URL || 'http://localhost:5173';
  }

  async sendSignupVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${this.getClientUrl()}/auth/verify?token=${token}`;
    await this.mailerService.sendMail({
      to,
      subject: '[Hactto] 회원가입 이메일 인증 안내',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4CAF50;">Hactto 회원가입 이메일 인증</h2>
          <p>안녕하세요,</p>
          <p>Hactto 회원가입을 계속 진행하시려면 아래 버튼을 클릭하여 이메일 인증을 완료해 주세요.</p>
          <div style="margin: 30px 0;">
            <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">이메일 인증하기</a>
          </div>
          <p style="color: #888; font-size: 12px;">본인이 요청하지 않으셨다면 이 메일을 무시해 주세요.</p>
        </div>
      `,
    });
  }

  async sendWithdrawalEmail(to: string, token: string): Promise<void> {
    const url = `${this.getClientUrl()}/auth/withdraw/complete?token=${token}`;
    await this.mailerService.sendMail({
      to,
      subject: '[Hactto] 회원 탈퇴 확인 안내',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #E53935;">Hactto 회원 탈퇴 확인</h2>
          <p>안녕하세요,</p>
          <p>회원 탈퇴를 진행하시려면 아래 버튼을 클릭해 주세요.</p>
          <p>탈퇴 후 1년 이내에는 동일한 이메일로 가입을 시도할 경우 계정 복원이 가능합니다.</p>
          <p>1년이 경과하면 모든 계정 정보와 활동 내역이 영구적으로 파기되어 복구할 수 없습니다.</p>
          <div style="margin: 30px 0;">
            <a href="${url}" style="background-color: #E53935; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">회원 탈퇴 확정하기</a>
          </div>
          <p style="color: #888; font-size: 12px;">본인이 요청하지 않으셨다면 이 메일을 무시해 주세요.</p>
        </div>
      `,
    });
  }

  async sendRestoreEmail(to: string, token: string): Promise<void> {
    const url = `${this.getClientUrl()}/auth/restore/complete?token=${token}`;
    await this.mailerService.sendMail({
      to,
      subject: '[Hactto] 탈퇴 계정 복원 안내',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1E88E5;">Hactto 탈퇴 계정 복원</h2>
          <p>안녕하세요,</p>
          <p>탈퇴했던 계정의 복원을 요청하셨습니다.</p>
          <p>계속해서 기존 계정을 활성화하시려면 아래 버튼을 클릭해 주세요.</p>
          <div style="margin: 30px 0;">
            <a href="${url}" style="background-color: #1E88E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">계정 복원하기</a>
          </div>
          <p style="color: #888; font-size: 12px;">본인이 요청하지 않으셨다면 이 메일을 무시해 주세요.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${this.getClientUrl()}/auth/reset-password?token=${token}`;
    await this.mailerService.sendMail({
      to,
      subject: '[Hactto] 비밀번호 재설정 안내',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #00BCD4;">Hactto 비밀번호 재설정</h2>
          <p>안녕하세요,</p>
          <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해 주세요.</p>
          <p>이 링크는 15분 동안만 유효합니다.</p>
          <div style="margin: 30px 0;">
            <a href="${url}" style="background-color: #00BCD4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">비밀번호 재설정하기</a>
          </div>
          <p style="color: #888; font-size: 12px;">본인이 요청하지 않으셨다면 이 메일을 무시해 주시고 비밀번호를 안전하게 보호해 주세요.</p>
        </div>
      `,
    });
  }
}
