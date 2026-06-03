import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { GeneratePredictionCommand } from '../commands/generate-prediction.command';
import { Inject } from '@nestjs/common';
import {
  PREDICTION_REPOSITORY_TOKEN,
  IPredictionRepository,
} from '../../domain/ports/prediction.repository.port';
import {
  WINNING_NUMBER_READER_TOKEN,
  WinningNumberReader,
} from '../../domain/ports/winning-number-reader.port';
import { DomainPrediction } from '../../domain/aggregates/prediction.entity';
import { AnalysisWinningNumber } from '../../domain/aggregates/winning-number.entity';
import { AlgorithmExecutor } from '../../domain/services/algorithm-executor';
import { PredictionGeneratedEvent } from '../../domain/events/prediction-generated.event';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.repository.port';

@CommandHandler(GeneratePredictionCommand)
export class GeneratePredictionHandler implements ICommandHandler<GeneratePredictionCommand> {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly repository: IPredictionRepository,
    @Inject(WINNING_NUMBER_READER_TOKEN)
    private readonly winningNumberReader: WinningNumberReader,
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
    );

    const created = await this.repository.create(executed);
    const prediction = this.publisher.mergeObjectContext(created);

    prediction.apply(
      new PredictionGeneratedEvent(
        prediction.getId(),
        prediction.algorithm.type,
        prediction.episode,
        prediction.visitorId,
      ),
    );
    prediction.commit();

    return prediction;
  }
}
