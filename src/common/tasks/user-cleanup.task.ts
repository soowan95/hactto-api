import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { prisma } from '../../libs/prisma';

@Injectable()
export class UserCleanupTask {
  private readonly logger = new Logger(UserCleanupTask.name);

  // Run every day at 3:00 AM
  @Cron('0 3 * * *')
  async handleCron() {
    this.logger.log('Starting user cleanup cron job...');
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const deletedUsers = await prisma.user.deleteMany({
        where: {
          deletedAt: {
            lte: oneYearAgo,
          },
        },
      });

      this.logger.log(
        `Successfully hard-deleted ${deletedUsers.count} users who withdrew more than 1 year ago.`,
      );
    } catch (error) {
      this.logger.error('Failed to run user cleanup cron job', error);
    }
  }
}
