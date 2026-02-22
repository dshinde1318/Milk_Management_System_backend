import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMilkSupplyDto, QueryMilkSupplyDto } from './dto/create-milk-supply.dto';
import { MilkSupply } from './entities/milk-supply.entity';
import { MilkSupplySellerSummary, MilkSupplyService } from './milk-supply.service';

@Controller('milk-supply')
@UseGuards(JwtAuthGuard)
export class MilkSupplyController {
  constructor(private readonly milkSupplyService: MilkSupplyService) {}

  @Post()
  async create(@Body() createDto: CreateMilkSupplyDto): Promise<MilkSupply> {
    return this.milkSupplyService.create(createDto);
  }

  @Get()
  async findAll(@Query() query: QueryMilkSupplyDto): Promise<MilkSupply[]> {
    return this.milkSupplyService.findAll(query);
  }

  @Get('sellers/summary')
  async getSellersSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<MilkSupplySellerSummary[]> {
    return this.milkSupplyService.getSellersSummary(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
