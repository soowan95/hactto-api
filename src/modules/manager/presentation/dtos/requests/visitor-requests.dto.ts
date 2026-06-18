import { IsDateString, IsNumber } from 'class-validator';

export class ManageHonDto {
  @IsNumber()
  amount: number;
}

export class GrantSubscriptionDto {
  @IsDateString()
  endsAt: string;
}
