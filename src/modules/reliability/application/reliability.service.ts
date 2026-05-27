import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AlgorithmService } from '../../algorithm/application/algorithm.service';
import { AlgorithmType } from '@hactto/algorithm';
import { DomainAlgorithmResult } from '../../algorithm/domain/entities/algorithm-result.entity';
import { DomainWinningNumber } from '../../winning-number/domain/entities/winning-number.entity';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../winning-number/domain/ports/winning-number.repository.interface';
import {
  ALGORITHM_RESULT_REPOSITORY_TOKEN,
  IAlgorithmResultRepository,
} from '../../algorithm/domain/ports/algorithm-result.repository.interface';
import {
  IReliabilityRepository,
  RELIABILITY_REPOSITORY_TOKEN,
} from '../domain/ports/reliability.repository.interface';
import { DomainReliability } from '../domain/entities/reliability.entity';
import { ReliabilityCalculator } from '../domain/services/reliability-calculator';
import { PersonalWeightService } from '../../personal-weight/application/personal-weight.service';

@Injectable()
export class ReliabilityService {
  private readonly logger = new Logger(ReliabilityService.name);

  constructor(
    private readonly algorithmService: AlgorithmService,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    @Inject(ALGORITHM_RESULT_REPOSITORY_TOKEN)
    private readonly algorithmResultRepository: IAlgorithmResultRepository,
    @Inject(RELIABILITY_REPOSITORY_TOKEN)
    private readonly reliabilityRepository: IReliabilityRepository,
    @Inject(forwardRef(() => PersonalWeightService))
    private readonly personalWeightService: PersonalWeightService,
  ) {}

  async analyze(): Promise<void> {
    const isExistAtLeastOneAlgorithmResult: boolean =
      (await this.algorithmResultRepository.count()) > 0;

    this.logger.debug(
      `Algorithm result is exists: `,
      isExistAtLeastOneAlgorithmResult,
    );

    if (!isExistAtLeastOneAlgorithmResult)
      await this.algorithmService.initialize();

    const targetAlgorithmResults: DomainAlgorithmResult[] =
      await this.algorithmResultRepository.findWithoutReliability();

    const reliabilityDataList: DomainReliability[] = [];

    for (const result of targetAlgorithmResults) {
      const winningNumber: DomainWinningNumber =
        await this.winningNumberRepository.findByEpisode(result.episode);
      if (!winningNumber || !winningNumber.isDrawn) continue;

      let customWeights: number[] | undefined = undefined;
      if (result.personalWeightId) {
        const personalWeight = await this.personalWeightService.findById(
          result.personalWeightId,
        );
        if (personalWeight) {
          customWeights = personalWeight.getWeightsArray();
        }
      } else if (result.visitorId) {
        const personalWeight = await this.personalWeightService.getWeights(
          result.visitorId,
          result.algorithm,
        );
        if (personalWeight) {
          customWeights = personalWeight.getWeightsArray();
          await this.algorithmResultRepository.updatePersonalWeight(
            result.getId(),
            personalWeight.id!,
          );
        }
      }

      reliabilityDataList.push(
        ReliabilityCalculator.calculate(winningNumber, result, customWeights),
      );
    }

    if (reliabilityDataList.length > 0) {
      await this.reliabilityRepository.createMany(reliabilityDataList);
    }
  }

  async recalculateForUserAndAlgorithm(
    visitorId: string,
    algorithm: AlgorithmType,
    weights: number[],
    personalWeightId?: number,
  ): Promise<void> {
    const results = await this.algorithmResultRepository.findByUser(visitorId);
    const targetResults = results.filter((r) => r.algorithm === algorithm);

    for (const result of targetResults) {
      // 1. 예측번호 결과 테이블의 가중치 이력 매핑 업데이트
      if (personalWeightId) {
        await this.algorithmResultRepository.updatePersonalWeight(
          result.getId(),
          personalWeightId,
        );
      }

      const winningNumber = await this.winningNumberRepository.findByEpisode(
        result.episode,
      );
      if (!winningNumber || !winningNumber.isDrawn) continue;

      // 2. 신뢰도 계산 수행
      const recalculatedReliability = ReliabilityCalculator.calculate(
        winningNumber,
        result,
        weights,
      );

      await this.reliabilityRepository.upsert(recalculatedReliability);
    }
  }

  async getAverageScore(
    type?: AlgorithmType,
  ): Promise<number> {
    return this.reliabilityRepository.getAverageScore(type);
  }
}
