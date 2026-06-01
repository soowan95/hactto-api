export enum BallTemperature {
  HOT = 'HOT',
  WARM = 'WARM',
  COLD = 'COLD',
}

export function getBallTemperature(skip: number): BallTemperature {
  if (skip <= 5) return BallTemperature.HOT;
  else if (skip <= 10) return BallTemperature.WARM;
  else return BallTemperature.COLD;
}
