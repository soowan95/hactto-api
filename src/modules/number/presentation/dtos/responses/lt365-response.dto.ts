import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class Lt365 {
  @ApiProperty({ description: '기타 구매 타입 0' })
  winType0: number;

  @ApiProperty({ description: '자동 구매 당첨 수' })
  winType1: number;

  @ApiProperty({ description: '수동 구매 당첨 수' })
  winType2: number;

  @ApiProperty({ description: '반자동 구매 당첨 수' })
  winType3: number;

  @ApiProperty({ description: '게임 고유 번호', example: 5133 })
  gmSqNo: number;

  @ApiProperty({ description: '로또 회차', example: 90 })
  ltEpsd: number;

  @ApiProperty({ description: '당첨 번호 1', example: 17 })
  tm1WnNo: number;

  @ApiProperty({ description: '당첨 번호 2', example: 20 })
  tm2WnNo: number;

  @ApiProperty({ description: '당첨 번호 3', example: 29 })
  tm3WnNo: number;

  @ApiProperty({ description: '당첨 번호 4', example: 35 })
  tm4WnNo: number;

  @ApiProperty({ description: '당첨 번호 5', example: 38 })
  tm5WnNo: number;

  @ApiProperty({ description: '당첨 번호 6', example: 44 })
  tm6WnNo: number;

  @ApiProperty({ description: '보너스 번호', example: 10 })
  bnsWnNo: number;

  @ApiProperty({ description: '추첨일 (YYYYMMDD)', example: '20040821' })
  ltRflYmd: string;

  @ApiProperty({ description: '1등 당첨자 수', example: 4 })
  rnk1WnNope: number;

  @ApiProperty({ description: '1등 당첨 금액', example: 3291435300 })
  rnk1WnAmt: number;

  @ApiProperty({ description: '1등 총 당첨 금액 누적' })
  rnk1SumWnAmt: number;

  @ApiProperty({ description: '2등 당첨자 수', example: 34 })
  rnk2WnNope: number;

  @ApiProperty({ description: '2등 당첨 금액', example: 64537948 })
  rnk2WnAmt: number;

  @ApiProperty({ description: '2등 총 당첨 금액 누적' })
  rnk2SumWnAmt: number;

  @ApiProperty({ description: '3등 당첨자 수', example: 1297 })
  rnk3WnNope: number;

  @ApiProperty({ description: '3등 당첨 금액', example: 1691820 })
  rnk3WnAmt: number;

  @ApiProperty({ description: '3등 총 당첨 금액 누적' })
  rnk3SumWnAmt: number;

  @ApiProperty({ description: '4등 당첨자 수', example: 67888 })
  rnk4WnNope: number;

  @ApiProperty({ description: '4등 당첨 금액', example: 64645 })
  rnk4WnAmt: number;

  @ApiProperty({ description: '4등 총 당첨 금액 누적' })
  rnk4SumWnAmt: number;

  @ApiProperty({ description: '5등 당첨자 수', example: 1160774 })
  rnk5WnNope: number;

  @ApiProperty({ description: '5등 당첨 금액', example: 5000 })
  rnk5WnAmt: number;

  @ApiProperty({ description: '5등 총 당첨 금액 누적' })
  rnk5SumWnAmt: number;

  @ApiProperty({ description: '총 당첨 수', example: 1229997 })
  sumWnNope: number;

  @ApiProperty({ description: '순 매출액', example: 55493544000 })
  rlvtEpsdSumNtslAmt: number;

  @ApiProperty({ description: '총 판매액', example: 55493544000 })
  wholEpsdSumNtslAmt: number;

  @ApiProperty({ description: '엑셀 순위 정보', example: '1등' })
  excelRnk: string;

  getWinningNumber(): number[] {
    return [
      this.tm1WnNo,
      this.tm2WnNo,
      this.tm3WnNo,
      this.tm4WnNo,
      this.tm5WnNo,
      this.tm6WnNo,
      this.bnsWnNo,
    ];
  }
}

export class Lt365Data {
  @ApiProperty({
    type: [Lt365],
    description: '로또 회차별 결과 리스트',
  })
  @Type(() => Lt365) // 중첩 객체 배열 변환을 위해 필수
  list: Lt365[];
}

export class Lt365ResponseDto {
  @ApiProperty({ description: '결과 코드', nullable: true, example: null })
  resultCode: string | null;
  @ApiProperty({ description: '결과 메시지', nullable: true, example: null })
  resultMessage: string | null;
  @ApiProperty({ type: Lt365Data, description: '응답 데이터 본문' })
  @Type(() => Lt365Data)
  data: Lt365Data;
}
