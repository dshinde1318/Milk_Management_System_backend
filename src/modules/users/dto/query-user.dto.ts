import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class QueryUserDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  search?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  q?: string;
}
