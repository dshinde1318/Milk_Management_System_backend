import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { DeliverySession, MilkType } from '../../milk-transactions/entities/milk-transaction.entity';

export class CreateMilkRateDto {
  @IsEnum(MilkType)
  milkType!: MilkType;

  @IsEnum(DeliverySession)
  @IsOptional()
  deliverySession?: DeliverySession;

  // Backward-compatible alias accepted from mobile/web payloads.
  @IsEnum(DeliverySession)
  @IsOptional()
  shift?: DeliverySession;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerUnit!: number;

  @IsDateString()
  effectiveFrom!: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateMilkRateDto {
  @IsEnum(MilkType)
  @IsOptional()
  milkType?: MilkType;

  @IsEnum(DeliverySession)
  @IsOptional()
  deliverySession?: DeliverySession;

  @IsEnum(DeliverySession)
  @IsOptional()
  shift?: DeliverySession;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerUnit?: number;

  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QueryMilkRateDto {
  @IsEnum(MilkType)
  @IsOptional()
  milkType?: MilkType;

  @IsEnum(DeliverySession)
  @IsOptional()
  deliverySession?: DeliverySession;

  @IsEnum(DeliverySession)
  @IsOptional()
  shift?: DeliverySession;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number;
}
