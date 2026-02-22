import {
  Controller,
  Delete,
  ForbiddenException,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
    mobile: string;
    role: UserRole;
  };
}

@Controller('admin/sellers')
@UseGuards(JwtAuthGuard)
export class AdminSellersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete(':id')
  async deleteSeller(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    this.ensureAdmin(req);
    await this.usersService.deleteSeller(id);
    return { message: 'Seller deleted successfully' };
  }

  private ensureAdmin(req: AuthenticatedRequest): void {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can manage sellers');
    }
  }
}
