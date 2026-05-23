import { Exclude } from 'class-transformer';

export class WinningNumberShowResponseDto {
  @Exclude()
  id: number;
}
