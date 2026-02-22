import { IsDateString, IsOptional, Matches } from 'class-validator';

export class QueryBuyerBillingDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  @IsOptional()
  month?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
