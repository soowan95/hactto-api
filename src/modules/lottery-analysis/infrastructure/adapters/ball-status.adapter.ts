import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  BallStatusReader,
  AnalysisBallTemperature,
} from '../../domain/ports/ball-status-reader.port';
import { GetLotteryBallStatusQuery } from '../../../number/application/queries/get-lottery-ball-status.query';
import { BallTemperature as NumberBallTemperature } from '../../../number/domain/vos/ball.temperature.vo';

@Injectable()
export class BallStatusAdapter implements BallStatusReader {
  constructor(private readonly queryBus: QueryBus) {}

  async getBallTemperature(
    ball: number,
    beforeEpisode?: number,
  ): Promise<AnalysisBallTemperature> {
    const result = await this.queryBus.execute(
      new GetLotteryBallStatusQuery(ball, beforeEpisode),
    );
    return this.mapToAnalysisTemperature(result.status);
  }

  async getBallTemperatures(
    balls: number[],
    beforeEpisode?: number,
  ): Promise<Record<number, AnalysisBallTemperature>> {
    const temperatures: Record<number, AnalysisBallTemperature> = {};
    for (const ball of balls) {
      temperatures[ball] = await this.getBallTemperature(ball, beforeEpisode);
    }
    return temperatures;
  }

  private mapToAnalysisTemperature(
    status: NumberBallTemperature,
  ): AnalysisBallTemperature {
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
