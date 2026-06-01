import { ApiProperty } from '@nestjs/swagger';

export class MatchResultDto {
  @ApiProperty({ description: '실제 당첨 번호' })
  winningNumbers: number[];

  @ApiProperty({ description: '일치하는 번호 목록' })
  matchedNumbers: number[];

  @ApiProperty({ description: '일치하는 번호 개수' })
  matchCount: number;

  @ApiProperty({ description: '보너스 번호 일치 여부' })
  bonusMatch: boolean;

  @ApiProperty({ description: '당첨 등수 (1~5, 0은 낙첨)' })
  rank: number;
}

export class AlgorithmHistoryResponseDto {
  @ApiProperty({ description: '예측 결과 ID' })
  id: number;

  @ApiProperty({ description: '알고리즘 명' })
  algorithm: string;

  @ApiProperty({ description: '회차 번호' })
  episode: number;

  @ApiProperty({ description: '생성된 예측 번호' })
  numbers: number[];

  @ApiProperty({
    description: '실제 추첨과의 비교 결과 (추첨 전일 경우 null)',
    type: MatchResultDto,
    required: false,
  })
  matchResult: MatchResultDto | null;
}
