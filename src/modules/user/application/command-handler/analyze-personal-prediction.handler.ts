import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnalyzePersonalPredictionCommand } from '../commands/analyze-personal-prediction.command';
import { DomainPersonalAnalysis } from '../../domain/aggregates/personal-analysis.entity';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../../number/domain/ports/winning-number.port';
import {
  UserBallStatusReader,
  USER_BALL_STATUS_READER_TOKEN,
} from '../../domain/ports/ball-status-reader.port';
import { Inject } from '@nestjs/common';

@CommandHandler(AnalyzePersonalPredictionCommand)
export class AnalyzePersonalPredictionHandler implements ICommandHandler<AnalyzePersonalPredictionCommand> {
  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    @Inject(USER_BALL_STATUS_READER_TOKEN)
    private readonly ballStatusReader: UserBallStatusReader,
  ) {}

  async execute(
    command: AnalyzePersonalPredictionCommand,
  ): Promise<DomainPersonalAnalysis> {
    const temperatures = await this.ballStatusReader.getBallTemperatures(
      command.prediction,
    );

    return DomainPersonalAnalysis.create(
      this.winningNumberRepository,
      0,
      command.prediction,
      temperatures,
    );
  }
}
