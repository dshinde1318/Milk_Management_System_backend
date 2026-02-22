import { IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class LoginDto {
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  mobile!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginResponseDto {
  id!: string;
  name!: string;
  mobile!: string;
  email?: string;
  role!: UserRole;
  accessToken!: string;
  expiresIn!: string;
}
