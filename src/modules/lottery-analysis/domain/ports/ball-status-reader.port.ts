export const BALL_STATUS_READER_TOKEN = 'IBallStatusReader';

export type AnalysisBallTemperature = 'HOT' | 'WARM' | 'COLD';

export interface BallStatusReader {
  getBallTemperature(ball: number): Promise<AnalysisBallTemperature>;
  getBallTemperatures(
    balls: number[],
  ): Promise<Record<number, AnalysisBallTemperature>>;
}
