import { Inject, Injectable, Logger } from '@nestjs/common';
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

      reliabilityDataList.push(
        ReliabilityCalculator.calculate(winningNumber, result),
      );
    }

    if (reliabilityDataList.length > 0) {
      await this.reliabilityRepository.createMany(reliabilityDataList);
    }
  }

  async getAverageScore(type?: AlgorithmType): Promise<number> {
    return this.reliabilityRepository.getAverageScore(type);
  }
}
