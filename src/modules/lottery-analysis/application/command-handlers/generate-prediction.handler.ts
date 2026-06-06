import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { GeneratePredictionCommand } from '../commands/generate-prediction.command';
import { Inject } from '@nestjs/common';
import {
  PREDICTION_REPOSITORY_TOKEN,
  IPredictionRepository,
} from '../../domain/ports/prediction.port';
import {
  WINNING_NUMBER_READER_TOKEN,
  WinningNumberReader,
} from '../../domain/ports/winning-number-reader.port';
import {
  BALL_STATUS_READER_TOKEN,
  BallStatusReader,
} from '../../domain/ports/ball-status-reader.port';
import { DomainPrediction } from '../../domain/aggregates/prediction.entity';
import { DomainAnalysis } from '../../domain/aggregates/analysis.entity';
import { AnalysisWinningNumber } from '../../domain/aggregates/winning-number.entity';
import { AlgorithmExecutor } from '../../domain/services/algorithm-executor';
import { PredictionGeneratedEvent } from '../../domain/events/prediction-generated.event';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.port';

@CommandHandler(GeneratePredictionCommand)
export class GeneratePredictionHandler implements ICommandHandler<GeneratePredictionCommand> {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepository: IPredictionRepository,
    @Inject(WINNING_NUMBER_READER_TOKEN)
    private readonly winningNumberReader: WinningNumberReader,
    @Inject(BALL_STATUS_READER_TOKEN)
    private readonly ballStatusReader: BallStatusReader,
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmTypeRepository: IAlgorithmRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: GeneratePredictionCommand): Promise<DomainPrediction> {
    const winningNumbers: AnalysisWinningNumber[] =
      await this.winningNumberReader.findAll();
    const latestWinningNumber: AnalysisWinningNumber | null =
      await this.winningNumberReader.findLatestWithWinningNumber();
    if (!latestWinningNumber) throw new Error('Not exists any winning number');
    const latestEpisode: number = latestWinningNumber.episode;
    const algorithmType = await this.algorithmTypeRepository.findByType(
      command.type,
    );

    const executed = await AlgorithmExecutor.execute(
      algorithmType,
      latestEpisode + 1,
      winningNumbers.map((winningNumber) => winningNumber.numbers),
      command.visitorId,
      command.weights,
      command.oddCount,
    );

    // Compute temperatures and analysis synchronously
    const temperatures = await this.ballStatusReader.getBallTemperatures(
      executed.getNumberArray(),
      executed.episode,
    );
    executed.analysis = DomainAnalysis.create(
      executed.getNumberArray(),
      temperatures,
    );
    (executed.analysis as any).temperatures = temperatures;

    const created = await this.predictionRepository.create(executed);
    if (created.analysis) {
      (created.analysis as any).temperatures = temperatures;
    }
    const prediction = this.publisher.mergeObjectContext(created);

    prediction.apply(
      new PredictionGeneratedEvent(
        prediction.id as number,
        prediction.algorithm.type,
        prediction.episode,
        prediction.visitorId,
        prediction.getNumberArray(),
      ),
    );
    prediction.commit();

    return prediction;
  }
}
