import { Min, IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { DeliverySession, MilkType, TransactionStatus } from '../entities/milk-transaction.entity';

export class CreateMilkTransactionDto {
  @IsUUID()
  buyerId!: string;

  @IsDateString()
  date!: string;

  @ValidateIf(
    (dto: CreateMilkTransactionDto) =>
      (dto.status ?? TransactionStatus.DELIVERED) === TransactionStatus.DELIVERED,
  )
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsEnum(DeliverySession)
  @IsOptional()
  deliverySession?: DeliverySession;

  // Backward-compatible alias accepted from older/mobile payloads.
  @IsEnum(DeliverySession)
  @IsOptional()
  shift?: DeliverySession;

  @IsEnum(MilkType)
  @IsOptional()
  milkType?: MilkType;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsNumber()
  @IsOptional()
  pricePerUnit?: number;
}

export class UpdateMilkTransactionDto {
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsEnum(DeliverySession)
  @IsOptional()
  deliverySession?: DeliverySession;

  @IsEnum(DeliverySession)
  @IsOptional()
  shift?: DeliverySession;

  @IsEnum(MilkType)
  @IsOptional()
  milkType?: MilkType;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class QueryMilkTransactionDto {
  @IsUUID()
  @IsOptional()
  buyerId?: string;

  @IsUUID()
  @IsOptional()
  sellerId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;
}
