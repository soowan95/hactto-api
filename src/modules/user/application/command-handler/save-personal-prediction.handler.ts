import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SavePersonalPredictionCommand } from '../commands/save-personal-prediction.command';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../../number/domain/ports/winning-number.port';
import {
  UserBallStatusReader,
  USER_BALL_STATUS_READER_TOKEN,
} from '../../domain/ports/ball-status-reader.port';
import {
  IPersonalPredictionRepository,
  PERSONAL_PREDICTION_REPOSITORY_TOKEN,
} from '../../domain/ports/personal-prediction.port';
import { DomainPersonalAnalysis } from '../../domain/aggregates/personal-analysis.entity';
import { DomainPersonalPrediction } from '../../domain/aggregates/personal-perdiction.entity';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@CommandHandler(SavePersonalPredictionCommand)
export class SavePersonalPredictionHandler implements ICommandHandler<SavePersonalPredictionCommand> {
  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    @Inject(USER_BALL_STATUS_READER_TOKEN)
    private readonly ballStatusReader: UserBallStatusReader,
    @Inject(PERSONAL_PREDICTION_REPOSITORY_TOKEN)
    private readonly personalPredictionRepository: IPersonalPredictionRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: SavePersonalPredictionCommand): Promise<void> {
    const temperatures = await this.ballStatusReader.getBallTemperatures(
      command.prediction,
    );

    const analysis = await DomainPersonalAnalysis.create(
      this.winningNumberRepository,
      0,
      command.prediction,
      temperatures,
    );

    const predictionEntity = new DomainPersonalPrediction(
      command.visitorId,
      command.episode,
      command.prediction,
    );

    await this.personalPredictionRepository.save(predictionEntity, analysis);

    // Invalidate Cache
    const cacheKey = `user:${command.visitorId}:personal-predictions:history`;
    await this.redisService.del(cacheKey);
  }
}
