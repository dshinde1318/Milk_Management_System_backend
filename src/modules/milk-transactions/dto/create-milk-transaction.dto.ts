import { IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from '../entities/milk-transaction.entity';

export class CreateMilkTransactionDto {
  @IsUUID()
  buyerId!: string;

  @IsDateString()
  date!: string;

  @IsNumber()
  quantity!: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

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
