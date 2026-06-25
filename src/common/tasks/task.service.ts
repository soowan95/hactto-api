import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { HacttoCronExpression } from './hactto-cron-expression.enum';
import { FetchRecentWinningNumberCommand } from '../../modules/number/application/commands/fetch-recent-winning-number.command';
import { AnalyzeCommand } from '../../modules/lottery-analysis/application/commands/analyze.command';
import { SystemStatusService } from '../utils/system-status/system-status.service';
import {
  IHonRepository,
  HON_REPOSITORY_TOKEN,
} from '../../modules/user/domain/ports/hon.port';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY_TOKEN,
} from '../../modules/user/domain/ports/payment.port';
import { PortoneClient } from '../../modules/user/infrastructure/clients/portone.client';
import { randomUUID } from 'crypto';
import { prisma } from '../../libs/prisma';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly systemStatusService: SystemStatusService,
    @Inject(HON_REPOSITORY_TOKEN)
    private readonly honRepository: IHonRepository,
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: IPaymentRepository,
    private readonly portoneClient: PortoneClient,
  ) {}

  @Cron(HacttoCronExpression.SATURDAY_AT_8PM_30M, {
    timeZone: 'Asia/Seoul',
  })
  async lockSiteForAnalysis() {
    this.logger.debug(
      '🔒 Locking site for winning number drawing and analysis...',
    );
    await this.systemStatusService.setAnalysisStatus(true);
  }

  @Cron(HacttoCronExpression.SATURDAY_AT_8PM_40M, {
    timeZone: 'Asia/Seoul',
  })
  async fetchRecentWinningNumbers() {
    this.logger.debug('🚀 Starting fetch recent winning numbers job...');
    const maxRetries = 15; // 15 attempts
    const retryIntervalMs = 2 * 60 * 1000; // 2 minutes

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Executing FetchRecentWinningNumberCommand (Attempt ${attempt}/${maxRetries})...`,
        );
        const result = (await this.commandBus.execute(
          new FetchRecentWinningNumberCommand(),
        )) as {
          status: 'success' | 'already_drawn' | 'waiting_new_episode';
          episode: number;
        };

        this.logger.debug(
          `Command execution result: ${JSON.stringify(result)}`,
        );

        if (result.status === 'success') {
          this.logger.debug(
            `🎉 Successfully drew episode ${result.episode}. Triggering reliability analysis...`,
          );
          await this.commandBus.execute(new AnalyzeCommand());
          this.logger.debug(
            `Reliability analysis completed for episode ${result.episode}.`,
          );
          return;
        }

        if (result.status === 'already_drawn') {
          this.logger.debug(
            `Episode ${result.episode} is already drawn. Unlocking site immediately.`,
          );
          await this.systemStatusService.setAnalysisStatus(false);
          return;
        }

        this.logger.debug(
          `Expected new episode is not published yet (returned episode ${result.episode}). Waiting for retry...`,
        );
      } catch (error) {
        this.logger.error(`Error on attempt ${attempt}:`, error);
      }

      if (attempt < maxRetries) {
        this.logger.debug(
          `Waiting ${retryIntervalMs / 1000}s before next retry...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
      }
    }

    this.logger.warn(
      '⚠️ Reached max retries without drawing new numbers. Unlocking site as fallback.',
    );
    await this.systemStatusService.setAnalysisStatus(false);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Seoul',
  })
  async renewSubscriptions() {
    this.logger.debug('🔄 Starting daily subscription renewal batch job...');
    const now = new Date();
    try {
      const expiredSubs =
        await this.honRepository.findExpiredSubscriptions(now);
      this.logger.debug(`Found ${expiredSubs.length} subscriptions to renew.`);

      for (const sub of expiredSubs) {
        try {
          this.logger.log(`Processing renewal for visitor: ${sub.visitorId}`);

          // 1. 새로운 결제 ID 및 관련 파라미터 생성
          const paymentId = randomUUID();
          const amount = sub.plan === 'MONTHLY' ? 12000 : 100000;
          const orderName =
            sub.plan === 'MONTHLY'
              ? '월간 무제한 구독 (갱신)'
              : '연간 무제한 구독 (갱신)';

          // 2. 포트원 빌링 결제 요청
          const portoneResult = await this.portoneClient.payWithBillingKey(
            paymentId,
            sub.billingKey,
            amount,
            orderName,
          );

          if (portoneResult.success) {
            // 결제 이벤트 기록 (PaymentRequested -> PaymentApproved -> SubscriptionRenewed)
            await this.paymentRepository.saveEvent({
              paymentId,
              version: 1,
              eventType: 'PaymentRequested',
              payload: {
                visitorId: sub.visitorId,
                amount,
                orderId: `renew-${paymentId}`,
                orderName,
              },
            });

            await this.paymentRepository.saveEvent({
              paymentId,
              version: 2,
              eventType: 'PaymentApproved',
              payload: {
                paymentKey: sub.billingKey,
                approvedAt: portoneResult.approvedAt || new Date(),
              },
            });

            // Projection 생성
            await this.paymentRepository.saveProjection({
              paymentId,
              visitorId: sub.visitorId,
              amount,
              orderId: `renew-${paymentId}`,
              orderName,
              status: 'PAID',
              paymentKey: sub.billingKey,
              approvedAt: portoneResult.approvedAt || new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // 다음 결제일 및 종료일 연장 계산
            const nextPaymentAt = new Date(sub.nextPaymentAt);
            const endsAt = new Date(sub.endsAt);
            if (sub.plan === 'MONTHLY') {
              nextPaymentAt.setMonth(nextPaymentAt.getMonth() + 1);
              endsAt.setMonth(endsAt.getMonth() + 1);
            } else {
              nextPaymentAt.setFullYear(nextPaymentAt.getFullYear() + 1);
              endsAt.setFullYear(endsAt.getFullYear() + 1);
            }

            await this.paymentRepository.saveEvent({
              paymentId,
              version: 3,
              eventType: 'SubscriptionRenewed',
              payload: {
                visitorId: sub.visitorId,
                plan: sub.plan,
                nextPaymentAt,
              },
            });

            await this.honRepository.saveSubscription({
              visitorId: sub.visitorId,
              plan: sub.plan,
              status: 'ACTIVE',
              billingKey: sub.billingKey,
              nextPaymentAt,
              startsAt: sub.startsAt,
              endsAt,
            });

            this.logger.log(
              `Successfully renewed subscription for visitor: ${sub.visitorId}`,
            );
          } else {
            // 결제 실패 시 구독 만료 처리 및 실패 이벤트 기록
            this.logger.warn(
              `Subscription renewal failed for visitor: ${sub.visitorId}. Reason: ${portoneResult.failReason}`,
            );

            await this.paymentRepository.saveEvent({
              paymentId,
              version: 1,
              eventType: 'SubscriptionRenewalFailed',
              payload: {
                visitorId: sub.visitorId,
                reason: portoneResult.failReason || 'Renewal payment failed',
              },
            });

            await this.honRepository.saveSubscription({
              ...sub,
              status: 'EXPIRED',
              updatedAt: new Date(),
            });
          }
        } catch (subError) {
          this.logger.error(
            `Error renewing subscription for visitor ${sub.visitorId}:`,
            subError,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Error occurred during subscription renewal job:',
        error,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Seoul',
  })
  async resetDailyFreeHon() {
    if (!process.env.PORTONE_API_SECRET) {
      this.logger.log(
        'PORTONE_API_SECRET가 설정되어 있지 않아, 매일 자정 무료 HON을 50개로 초기화합니다.',
      );
      try {
        await prisma.hon.updateMany({
          data: {
            freeBalance: 50,
          },
        });
        this.logger.log(
          '성공적으로 모든 사용자의 무료 HON을 50개로 초기화했습니다.',
        );
      } catch (error) {
        this.logger.error('무료 HON 일괄 초기화 중 오류 발생:', error);
      }
    }
  }
}
