import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class ManageHonDto {
  @IsNumber()
  amount: number;
}

export class GrantSubscriptionDto {
  @IsDateString()
  endsAt: string;
}

export class BlockVisitorDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  period?: number; // hours
}
