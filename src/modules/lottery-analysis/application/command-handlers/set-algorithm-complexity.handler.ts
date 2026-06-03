import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { SetAlgorithmComplexityCommand } from '../commands/set-algorithm-complexity.command';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.repository.port';

@CommandHandler(SetAlgorithmComplexityCommand)
export class SetAlgorithmComplexityHandler implements ICommandHandler<SetAlgorithmComplexityCommand> {
  constructor(
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
    private readonly publisher: EventPublisher,
  ) {}
  async execute(
    command: SetAlgorithmComplexityCommand,
  ): Promise<DomainAlgorithm> {
    const algorithm = this.publisher.mergeObjectContext(
      new DomainAlgorithm(command.type, command.complexity),
    );

    await this.algorithmRepository.update(algorithm);

    algorithm.complexityUpdated();

    algorithm.commit();

    return algorithm;
  }
}
