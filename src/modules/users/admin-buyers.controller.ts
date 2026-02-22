import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/create-user.dto';
import { CreateAdminBuyerDto } from './dto/admin-buyer.dto';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
    mobile: string;
    role: UserRole;
  };
}

@Controller('admin/buyers')
@UseGuards(JwtAuthGuard)
export class AdminBuyersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createBuyer(
    @Request() req: AuthenticatedRequest,
    @Body() createBuyerDto: CreateAdminBuyerDto,
  ): Promise<User> {
    this.ensureAdmin(req);

    const password = createBuyerDto.password || process.env.DEFAULT_BUYER_PASSWORD || 'buyer123';

    if (createBuyerDto.confirmPassword && createBuyerDto.confirmPassword !== password) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    return await this.usersService.createBuyer({
      name: createBuyerDto.name,
      mobile: createBuyerDto.mobile,
      password,
      email: createBuyerDto.email,
      address: createBuyerDto.address,
      profileImage: createBuyerDto.profileImage,
      isActive: createBuyerDto.isActive,
    });
  }

  @Get()
  async findAllBuyers(@Request() req: AuthenticatedRequest): Promise<User[]> {
    this.ensureAdmin(req);
    return await this.usersService.findAllBuyers();
  }

  @Get(':id')
  async findBuyerById(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<User> {
    this.ensureAdmin(req);
    return await this.usersService.findBuyerById(id);
  }

  @Put(':id')
  async updateBuyer(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    this.ensureAdmin(req);
    return await this.usersService.updateBuyer(id, updateUserDto);
  }

  @Delete(':id')
  async deleteBuyer(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    this.ensureAdmin(req);
    await this.usersService.deleteBuyer(id);
    return { message: 'Buyer deleted successfully' };
  }

  @Put(':id/toggle-active')
  async toggleBuyerActive(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<User> {
    this.ensureAdmin(req);
    return await this.usersService.toggleBuyerActive(id);
  }

  private ensureAdmin(req: AuthenticatedRequest): void {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can manage buyers');
    }
  }
}
