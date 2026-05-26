import { Inject, Injectable, Logger } from '@nestjs/common';
import { AlgorithmService } from '../../algorithm/application/algorithm.service';
import { AlgorithmType } from '@hactto/algorithm';
import { AlgorithmResult } from '../../algorithm/domain/entities/algorithm-result.entity';
import { WinningNumber } from '../../winning-number/domain/entities/winning-number.entity';
import { ReliabilityAverageResponseDto } from '../presentation/dtos/responses/reliability-average-response.dto';
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
import { Reliability } from '../domain/entities/reliability.entity';

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

    const targetAlgorithmResults: AlgorithmResult[] =
      await this.algorithmResultRepository.findWithoutReliability();

    const reliabilityDataList: Reliability[] = [];

    for (const result of targetAlgorithmResults) {
      const winningNumber: WinningNumber =
        await this.winningNumberRepository.findByEpisode(result.episode);
      if (!winningNumber || !winningNumber.isDrawn) continue;

      reliabilityDataList.push(Reliability.calculate(winningNumber, result));
    }

    if (reliabilityDataList.length > 0) {
      await this.reliabilityRepository.createMany(reliabilityDataList);
    }
  }

  async getAverageScore(
    type?: AlgorithmType,
  ): Promise<ReliabilityAverageResponseDto> {
    const average = await this.reliabilityRepository.getAverageScore(type);
    return {
      type: type!,
      average: average,
    };
  }
}
