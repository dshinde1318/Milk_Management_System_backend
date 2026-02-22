import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const emptyStringToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

const toMobileString = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) {
    return value;
  }
  return String(value).trim();
};

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
};

export class CreateAdminBuyerDto {
  @Transform(emptyStringToUndefined)
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @Transform(toMobileString)
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  mobile!: string;

  @Transform(emptyStringToUndefined)
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @Transform(emptyStringToUndefined)
  @IsString()
  @IsOptional()
  @MinLength(6)
  confirmPassword?: string;

  @Transform(emptyStringToUndefined)
  @IsEmail()
  @IsOptional()
  email?: string;

  @Transform(emptyStringToUndefined)
  @IsString()
  @IsOptional()
  address?: string;

  @Transform(emptyStringToUndefined)
  @IsString()
  @IsOptional()
  profileImage?: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Transform(emptyStringToUndefined)
  @IsString()
  @IsOptional()
  role?: string;
}
