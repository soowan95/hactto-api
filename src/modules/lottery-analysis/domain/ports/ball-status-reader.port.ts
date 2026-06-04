export const BALL_STATUS_READER_TOKEN = 'IBallStatusReader';

export type AnalysisBallTemperature = 'HOT' | 'WARM' | 'COLD';

export interface BallStatusReader {
  getBallTemperature(
    ball: number,
    beforeEpisode?: number,
  ): Promise<AnalysisBallTemperature>;
  getBallTemperatures(
    balls: number[],
    beforeEpisode?: number,
  ): Promise<Record<number, AnalysisBallTemperature>>;
}
