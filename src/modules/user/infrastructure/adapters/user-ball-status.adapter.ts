import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  UserBallStatusReader,
  UserBallTemperature,
} from '../../domain/ports/ball-status-reader.port';
import { GetLotteryBallStatusQuery } from '../../../number/application/queries/get-lottery-ball-status.query';
import { BallTemperature as NumberBallTemperature } from '../../../number/domain/vos/ball.temperature.vo';

@Injectable()
export class UserBallStatusAdapter implements UserBallStatusReader {
  constructor(private readonly queryBus: QueryBus) {}

  async getBallTemperatures(
    balls: number[],
  ): Promise<Record<number, UserBallTemperature>> {
    const temperatures: Record<number, UserBallTemperature> = {};
    await Promise.all(
      balls.map(async (ball) => {
        const result = await this.queryBus.execute(
          new GetLotteryBallStatusQuery(ball),
        );
        temperatures[ball] = this.mapTemperature(result.status);
      }),
    );
    return temperatures;
  }

  private mapTemperature(status: NumberBallTemperature): UserBallTemperature {
    switch (status) {
      case NumberBallTemperature.HOT:
        return 'HOT';
      case NumberBallTemperature.WARM:
        return 'WARM';
      case NumberBallTemperature.COLD:
        return 'COLD';
      default:
        throw new Error(`Unknown ball temperature: ${status}`);
    }
  }
}
