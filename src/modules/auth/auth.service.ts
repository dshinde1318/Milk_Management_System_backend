import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(mobile: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByMobileWithPassword(mobile);

    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.mobile, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid mobile or password');
    }

    const expiresIn = process.env.JWT_EXPIRATION ?? '7d';
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      mobile: user.mobile,
      role: user.role,
    });

    return {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      accessToken,
      expiresIn,
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.usersService.sanitizeUser(user);
  }
}
