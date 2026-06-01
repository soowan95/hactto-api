import { Transform } from 'class-transformer';

export class LotteryBallStatusShowResponseDto {
  @Transform(({ obj }) => obj.getFriendlyNumberArray())
  friendlyNumbers: number[];
}
