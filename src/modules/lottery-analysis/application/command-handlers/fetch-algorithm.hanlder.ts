import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { FetchAlgorithmCommand } from '../commands/fetch-algorithm.command';
import { getAlgorithm } from '@hactto/algorithm';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.repository.port';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@CommandHandler(FetchAlgorithmCommand)
export class FetchAlgorithmHandler implements ICommandHandler<FetchAlgorithmCommand> {
  constructor(
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
    private readonly redisService: RedisService,
    private readonly publisher: EventPublisher,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(command: FetchAlgorithmCommand): Promise<void> {
    await this.redisService.del('algorithm:all');
    const hacttoAlgorithms: { type: string; complexity: number }[] =
      getAlgorithm();

    for (const hacttoAlgorithm of hacttoAlgorithms) {
      const algorithmEntity = new DomainAlgorithm(
        hacttoAlgorithm.type,
        hacttoAlgorithm.complexity,
      );

      const algorithm = this.publisher.mergeObjectContext(algorithmEntity);

      await this.algorithmRepository.upsert(algorithm);

      algorithm.upserted();

      algorithm.commit();
    }
  }
}
