import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../../helpers/redis/application/redis.service';
import { RequestParser } from '../utils/request-parser';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly requestParser: RequestParser,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const masterKey: string = this.requestParser.getMasterKey();

    if (masterKey) {
      // Check master key
      const isValidMasterKey: boolean = await this.redisService.isMemberOfSet(
        'manager:k',
        masterKey,
      );
      if (!isValidMasterKey) throw new ForbiddenException('Invalid Master Key');
      return true;
    }

    return false;
  }
}
