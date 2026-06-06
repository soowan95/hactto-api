import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { UpdateAlgorithmCommand } from '../commands/update-algorithm.command';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.port';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@CommandHandler(UpdateAlgorithmCommand)
export class UpdateAlgorithmHandler implements ICommandHandler<UpdateAlgorithmCommand> {
  constructor(
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
    private readonly redisService: RedisService,
    private readonly publisher: EventPublisher,
  ) {}
  async execute(command: UpdateAlgorithmCommand): Promise<DomainAlgorithm> {
    const existing = await this.algorithmRepository.findByType(command.type);

    const algorithm = this.publisher.mergeObjectContext(
      new DomainAlgorithm(
        command.type,
        command.complexity !== undefined
          ? command.complexity
          : existing.complexity,
        command.name !== undefined ? command.name : existing.name,
        command.description !== undefined
          ? command.description
          : existing.description,
      ),
    );

    await this.algorithmRepository.update(algorithm);

    await this.redisService.del('algorithm:all');
    await this.redisService.del(`algorithm:${command.type}`);

    algorithm.updated();

    algorithm.commit();

    return algorithm;
  }
}
