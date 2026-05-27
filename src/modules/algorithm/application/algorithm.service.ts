import { AlgorithmType, getAlgorithm } from '@hactto/algorithm';
import { DomainAlgorithmResult } from '../domain/entities/algorithm-result.entity';
import { DomainWinningNumber } from '../../winning-number/domain/entities/winning-number.entity';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../winning-number/domain/ports/winning-number.repository.interface';
import {
  ALGORITHM_RESULT_REPOSITORY_TOKEN,
  IAlgorithmResultRepository,
} from '../domain/ports/algorithm-result.repository.interface';
import { AlgorithmExecutor } from '../domain/services/alogrithm-executor';

@Injectable()
export class AlgorithmService {
  private readonly logger = new Logger(AlgorithmService.name);

  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    @Inject(ALGORITHM_RESULT_REPOSITORY_TOKEN)
    private readonly algorithmResultRepository: IAlgorithmResultRepository,
  ) {}

  allAlgorithmTypes(): AlgorithmType[] {
    return getAlgorithm();
  }

  async initialize(): Promise<void> {
    this.logger.debug(`Algorithm Service Initialized.`);
    const types: AlgorithmType[] = this.allAlgorithmTypes();
    this.logger.debug(`Algorithm types.`, types);
    const winningNumbers: DomainWinningNumber[] =
      await this.winningNumberRepository.findAll();
    const data: number[][] = winningNumbers.map((winningNumber) =>
      winningNumber.getNumberArray(),
    );
    this.logger.debug(`Winning number data: `, data);

    for (const type of types) {
      for (let i = 1; i < data.length; i++) {
        const subData: number[][] = data.slice(0, i);
        await this.algorithmResultRepository.create(
          await AlgorithmExecutor.execute(type, i + 1, subData),
        );
      }
    }
  }

  async generate(
    type: AlgorithmType,
    ip?: string,
    visitorId?: string,
  ): Promise<DomainAlgorithmResult> {
    const winningNumbers: DomainWinningNumber[] =
      await this.winningNumberRepository.findAll();
    const lastestWinningNumber: DomainWinningNumber | null =
      await this.winningNumberRepository.findLatestWithWinningNumber();
    if (!lastestWinningNumber) throw new Error('Not exists any winning number');
    const lastestEpisode: number = lastestWinningNumber.episode;
    return await this.algorithmResultRepository.create(
      await AlgorithmExecutor.execute(
        type,
        lastestEpisode + 1,
        winningNumbers.map((winningNumber) => winningNumber.getNumberArray()),
        ip,
        visitorId,
      ),
    );
  }

  async getHistory(ip?: string, visitorId?: string): Promise<any[]> {
    const results = await this.algorithmResultRepository.findByUser(
      ip,
      visitorId,
    );
    if (results.length === 0) return [];

    const episodes = Array.from(new Set(results.map((r) => r.episode)));
    const winningNumbers = await this.winningNumberRepository.findAll({
      where: {
        episode: { in: episodes },
      },
    });

    const winningNumbersMap = new Map<number, DomainWinningNumber>();
    for (const wn of winningNumbers) {
      winningNumbersMap.set(wn.episode, wn);
    }

    return results.map((result) => {
      const winningNumber = winningNumbersMap.get(result.episode);
      const predictedNumbers = result.getNumberArray();

      let matchResult: any = null;
      if (winningNumber && winningNumber.isDrawn) {
        const winningNumbersArr = winningNumber.getNumberArray();

        // Count matches of predicted first 6 numbers against winning first 6 numbers
        const predictedMain = predictedNumbers.slice(0, 6);
        const winningMain = winningNumbersArr.slice(0, 6);
        const winningBonus = winningNumbersArr[6];

        const matchedNumbers = predictedMain.filter((n) =>
          winningMain.includes(n),
        );
        const matchCount = matchedNumbers.length;
        const bonusMatch = predictedMain.includes(winningBonus);

        let rank = 0; // 0 means no prize
        if (matchCount === 6) rank = 1;
        else if (matchCount === 5 && bonusMatch) rank = 2;
        else if (matchCount === 5) rank = 3;
        else if (matchCount === 4) rank = 4;
        else if (matchCount === 3) rank = 5;

        matchResult = {
          winningNumbers: winningNumbersArr,
          matchedNumbers,
          matchCount,
          bonusMatch,
          rank,
        };
      }

      return {
        id: result.id,
        algorithm: result.algorithm,
        episode: result.episode,
        numbers: predictedNumbers,
        matchResult,
      };
    });
  }
}
