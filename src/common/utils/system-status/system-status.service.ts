import { Injectable, OnModuleInit } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { RedisService } from '../../../helpers/redis/application/redis.service';

export interface SystemStatus {
  inProgress: boolean;
  progress: number;
  message: string;
  estimatedCompletionTime?: string;
}

@Injectable()
export class SystemStatusService implements OnModuleInit {
  private readonly REDIS_LOCK_KEY = 'system:status:analysis-in-progress';
  private readonly REDIS_PROGRESS_KEY = 'system:status:analysis-progress';
  private readonly LOCK_TTL_SECONDS = 7200; // 2-hour safety TTL

  private readonly statusSubject = new BehaviorSubject<SystemStatus>({
    inProgress: false,
    progress: 0,
    message: '',
  });
  public readonly statusStream$: Observable<SystemStatus> =
    this.statusSubject.asObservable();

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    await this.syncFromRedis();
  }

  /**
   * Syncs the in-memory subject with the status stored in Redis
   */
  async syncFromRedis(): Promise<void> {
    const isLocked = await this.redisService.get(this.REDIS_LOCK_KEY);
    const inProgress = isLocked === 'true';

    if (!inProgress) {
      const defaultState = { inProgress: false, progress: 0, message: '' };
      if (
        JSON.stringify(this.statusSubject.value) !==
        JSON.stringify(defaultState)
      ) {
        this.statusSubject.next(defaultState);
      }
      return;
    }

    const progressVal = await this.redisService.get(this.REDIS_PROGRESS_KEY);
    let detailedStatus: SystemStatus = {
      inProgress: true,
      progress: 0,
      message: '분석 진행 중',
    };

    if (progressVal) {
      try {
        detailedStatus = JSON.parse(progressVal);
        detailedStatus.inProgress = true;
      } catch {
        // Fallback if parsing fails
      }
    }

    if (
      JSON.stringify(this.statusSubject.value) !==
      JSON.stringify(detailedStatus)
    ) {
      this.statusSubject.next(detailedStatus);
    }
  }

  /**
   * Sets the analysis restriction status and emits changes
   */
  async setAnalysisStatus(inProgress: boolean): Promise<void> {
    if (inProgress) {
      await this.redisService.set(
        this.REDIS_LOCK_KEY,
        'true',
        this.LOCK_TTL_SECONDS,
      );
      const defaultProgress: SystemStatus = {
        inProgress: true,
        progress: 0,
        message: '분석 작업 대기 중',
      };
      await this.redisService.set(
        this.REDIS_PROGRESS_KEY,
        JSON.stringify(defaultProgress),
        this.LOCK_TTL_SECONDS,
      );
      this.statusSubject.next(defaultProgress);
    } else {
      await this.redisService.del(this.REDIS_LOCK_KEY);
      await this.redisService.del(this.REDIS_PROGRESS_KEY);
      this.statusSubject.next({
        inProgress: false,
        progress: 0,
        message: '',
      });
    }
  }

  /**
   * Updates detailed analysis progress
   */
  async updateProgress(
    progress: number,
    message: string,
    estimatedCompletionTime?: string,
  ): Promise<void> {
    const detailedStatus: SystemStatus = {
      inProgress: true,
      progress,
      message,
      estimatedCompletionTime,
    };
    await this.redisService.set(
      this.REDIS_PROGRESS_KEY,
      JSON.stringify(detailedStatus),
      this.LOCK_TTL_SECONDS,
    );
    this.statusSubject.next(detailedStatus);
  }

  /**
   * Gets the current analysis status
   */
  getAnalysisStatus(): boolean {
    return this.statusSubject.value.inProgress;
  }

  /**
   * Gets the detailed analysis status
   */
  getDetailedStatus(): SystemStatus {
    return this.statusSubject.value;
  }
}
