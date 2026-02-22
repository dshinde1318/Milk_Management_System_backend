import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DeliverySession {
  MORNING = 'morning',
  EVENING = 'evening',
}

export enum MilkType {
  COW = 'cow',
  BUFFALO = 'buffalo',
}

export class CreateMilkSupplyDto {
  @IsUUID()
  sellerId!: string;

  @IsDateString()
  date!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  unit?: string;

  @IsEnum(DeliverySession)
  @IsOptional()
  deliverySession?: DeliverySession;

  @IsEnum(MilkType)
  @IsOptional()
  milkType?: MilkType;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class QueryMilkSupplyDto {
  @IsUUID()
  @IsOptional()
  sellerId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number;
}
