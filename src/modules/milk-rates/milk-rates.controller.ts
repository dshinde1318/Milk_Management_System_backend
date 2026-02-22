import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreateMilkRateDto, QueryMilkRateDto, UpdateMilkRateDto } from './dto/milk-rate.dto';
import { MilkRate } from './entities/milk-rate.entity';
import { MilkRatesService } from './milk-rates.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
    mobile: string;
    role: UserRole;
  };
}

@Controller('milk-rates')
@UseGuards(JwtAuthGuard)
export class MilkRatesController {
  constructor(private readonly milkRatesService: MilkRatesService) {}

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateMilkRateDto,
  ): Promise<MilkRate> {
    this.ensureAdmin(req);
    return this.milkRatesService.create(createDto);
  }

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: QueryMilkRateDto,
  ): Promise<MilkRate[]> {
    this.ensureAdmin(req);
    return this.milkRatesService.findAll(query);
  }

  @Put(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateMilkRateDto,
  ): Promise<MilkRate> {
    this.ensureAdmin(req);
    return this.milkRatesService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    this.ensureAdmin(req);
    await this.milkRatesService.remove(id);
    return { message: 'Milk rate deleted successfully' };
  }

  private ensureAdmin(req: AuthenticatedRequest): void {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can manage milk rates');
    }
  }
}
