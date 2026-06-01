import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SetPersonalWeightCommand } from '../commands/set-personal-weight.command';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@CommandHandler(SetPersonalWeightCommand)
export class SetPersonalWeightHandler implements ICommandHandler<SetPersonalWeightCommand> {
  constructor(private readonly redisService: RedisService) {}

  async execute(command: SetPersonalWeightCommand): Promise<void> {
    const cacheKey = `user:${command.visitorId}:algorithm:${command.algorithm}:weights`;
    await this.redisService.del(cacheKey);
    await this.redisService.set(cacheKey, JSON.stringify(command.weights));
  }
}
