import { Inject, Injectable, Logger } from '@nestjs/common';
import { AlgorithmService } from '../../algorithm/application/algorithm.service';
import { AlgorithmType } from '@hactto/algorithm';
import { AlgorithmResult, WinningNumber } from '../../../lib/prisma';
import { ReliabilityAverageResponseDto } from '../presentation/dtos/responses/reliability-average-response.dto';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../winning-number/domain/ports/winning-number.repository.interface';
import {
  IAlgorithmResultRepository,
  ALGORITHM_RESULT_REPOSITORY_TOKEN,
} from '../../algorithm/domain/ports/algorithm-result.repository.interface';
import {
  IReliabilityRepository,
  RELIABILITY_REPOSITORY_TOKEN,
} from '../domain/ports/reliability.repository.interface';

@Injectable()
export class ReliabilityService {
  private readonly log = new Logger(ReliabilityService.name);

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

    if (!isExistAtLeastOneAlgorithmResult)
      await this.algorithmService.initialize();

    const targetAlgorithmResults: AlgorithmResult[] =
      await this.algorithmResultRepository.findWithoutReliability();

    const reliabilityDataList: any[] = [];

    for (const result of targetAlgorithmResults) {
      const winningNumber: WinningNumber | null =
        await this.winningNumberRepository.findByEpisode(result.episode);
      if (!winningNumber || !winningNumber.isNonZero()) continue;
      const reliability: number = await this.calculateReliability(
        winningNumber.getNumberArray(),
        result.getNumberArray(),
      );

      reliabilityDataList.push({
        id: result.id,
        score: reliability,
      });
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

  private async calculateReliability(
    winningNumber: number[],
    generatedNumber: number[],
  ): Promise<number> {
    if (generatedNumber.every((num) => num === 0)) return -1;
    const WEIGHTS: number[] = [25, 20, 15, 15, 10, 10, 5];
    const maxScore: number = WEIGHTS.reduce((sum, weight) => sum + weight, 0);

    let score: number = 0;

    for (let i = 0; i < WEIGHTS.length; i++) {
      const winningNumberValue = winningNumber[i];
      const generatedNumberValue = generatedNumber[i];
      const weight = WEIGHTS[i];

      const distance = Math.abs(winningNumberValue - generatedNumberValue);

      const positionScore = weight / (1 + distance);

      score += positionScore;
    }

    return Math.round((score / maxScore) * 100 * 100) / 100;
  }
}
