export const USER_BALL_STATUS_READER_TOKEN = 'IUserBallStatusReader';

export type UserBallTemperature = 'HOT' | 'WARM' | 'COLD';

export interface UserBallStatusReader {
  getBallTemperatures(
    balls: number[],
  ): Promise<Record<number, UserBallTemperature>>;
}
