import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GeneratePredictionCommand } from './generate-prediction.command';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_ANALYSIS_REPOSITORY_TOKEN,
  IAlgorithmAnalysisRepository,
} from '../../../domain/ports/algorithm-analysis.repository.interface';
import {
  WINNING_NUMBER_REPOSITORY_TOKEN,
  IWinningNumberRepository,
} from '../../../../winning-number/domain/ports/winning-number.repository.interface';
import { DomainPrediction } from '../../../domain/aggregates/prediction.entity';
import { DomainWinningNumber } from '../../../../winning-number/domain/entities/winning-number.entity';
import { AlgorithmExecutor } from '../../../domain/services/algorithm-executor';
import { RedisService } from '../../../../../helpers/redis/redis.service';

@CommandHandler(GeneratePredictionCommand)
export class GeneratePredictionHandler implements ICommandHandler<GeneratePredictionCommand> {
  constructor(
    @Inject(ALGORITHM_ANALYSIS_REPOSITORY_TOKEN)
    private readonly repository: IAlgorithmAnalysisRepository,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: GeneratePredictionCommand): Promise<DomainPrediction> {
    const winningNumbers: DomainWinningNumber[] =
      await this.winningNumberRepository.findAll();
    const latestWinningNumber: DomainWinningNumber | null =
      await this.winningNumberRepository.findLatestWithWinningNumber();
    if (!latestWinningNumber) throw new Error('Not exists any winning number');
    const latestEpisode: number = latestWinningNumber.episode;

    const executed = await AlgorithmExecutor.execute(
      command.type,
      latestEpisode + 1,
      winningNumbers.map((winningNumber) => winningNumber.getNumberArray()),
      command.visitorId,
      command.weights,
    );

    const result = await this.repository.create(executed);

    if (command.visitorId && command.visitorId !== 'guest') {
      const cacheKey = `user:${command.visitorId}:predictions:history`;
      await this.redisService.del(cacheKey);
    }

    return result;
  }
}
