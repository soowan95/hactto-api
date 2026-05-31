import { Injectable, OnModuleInit } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { RedisService } from '../../helpers/redis/application/redis.service';

@Injectable()
export class SystemStatusService implements OnModuleInit {
  private readonly REDIS_LOCK_KEY = 'system:status:analysis-in-progress';
  private readonly LOCK_TTL_SECONDS = 7200; // 2-hour safety TTL

  private readonly statusSubject = new BehaviorSubject<boolean>(false);
  public readonly statusStream$: Observable<boolean> =
    this.statusSubject.asObservable();

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    await this.syncFromRedis();
  }

  /**
   * Syncs the in-memory subject with the status stored in Redis
   */
  async syncFromRedis(): Promise<void> {
    const value = await this.redisService.get(this.REDIS_LOCK_KEY);
    const inProgress = value === 'true';
    if (this.statusSubject.value !== inProgress) {
      this.statusSubject.next(inProgress);
    }
  }

  /**
   * Sets the analysis restriction status and emits changes
   */
  async setAnalysisStatus(inProgress: boolean): Promise<void> {
    if (inProgress) {
      // Set lock in Redis with 2-hour safety TTL
      await this.redisService.set(
        this.REDIS_LOCK_KEY,
        'true',
        this.LOCK_TTL_SECONDS,
      );
    } else {
      // Clear lock in Redis
      await this.redisService.del(this.REDIS_LOCK_KEY);
    }

    // Emit new state
    this.statusSubject.next(inProgress);
  }

  /**
   * Gets the current analysis status
   */
  getAnalysisStatus(): boolean {
    return this.statusSubject.value;
  }
}
