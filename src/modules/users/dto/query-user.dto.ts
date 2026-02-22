import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class QueryUserDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
