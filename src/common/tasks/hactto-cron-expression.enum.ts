import { CronExpression } from '@nestjs/schedule';

export const HacttoCronExpression = {
  ...({} as typeof CronExpression),
  SATURDAY_AT_9PM: '0 0 21 * * 6',
  SUNDAY_AT_3AM: '0 0 03 * * 7',
};
