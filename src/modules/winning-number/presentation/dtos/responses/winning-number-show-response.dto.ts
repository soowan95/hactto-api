import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class WinningNumberShowResponseDto {
  @Expose()
  episode: number;

  @Expose()
  @Transform(({ obj }) => obj.getNumberArray())
  numbers: number[];

  @Expose()
  isDrawn: boolean;
}
