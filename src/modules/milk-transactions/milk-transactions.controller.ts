import {
  Controller,
  Post,
  ForbiddenException,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MilkTransactionsService } from './milk-transactions.service';
import { CreateMilkTransactionDto, UpdateMilkTransactionDto, QueryMilkTransactionDto } from './dto/create-milk-transaction.dto';
import { QueryBuyerBillingDto } from './dto/query-buyer-billing.dto';
import { MilkTransaction, TransactionStatus } from './entities/milk-transaction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';

interface AuthenticatedRequest {
  user: {
    userId: string;
    role: UserRole;
  };
}

@Controller('milk-transactions')
@UseGuards(JwtAuthGuard)
export class MilkTransactionsController {
  constructor(private readonly transactionsService: MilkTransactionsService) {}

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateMilkTransactionDto,
  ): Promise<MilkTransaction> {
    if (req.user.role === UserRole.BUYER) {
      throw new ForbiddenException('Buyers are not allowed to record milk transactions');
    }
    return await this.transactionsService.create(req.user.userId, createDto);
  }

  @Get()
  async findAll(@Query() query: QueryMilkTransactionDto): Promise<MilkTransaction[]> {
    return await this.transactionsService.findAll(query);
  }

  @Get('sellers/stats')
  async getAllSellersStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: TransactionStatus,
  ) {
    return await this.transactionsService.getAllSellersStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      status,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMilkTransactionDto,
  ): Promise<MilkTransaction> {
    return await this.transactionsService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.transactionsService.delete(id);
    return { message: 'Transaction deleted successfully' };
  }

  @Get('seller/:sellerId/stats')
  async getSellerStats(
    @Param('sellerId') sellerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.transactionsService.getSellerStats(
      sellerId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('buyer/:buyerId/stats')
  async getBuyerStats(
    @Param('buyerId') buyerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.transactionsService.getBuyerStats(
      buyerId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('buyer/:buyerId/billing')
  async getBuyerBilling(
    @Request() req: AuthenticatedRequest,
    @Param('buyerId') buyerId: string,
    @Query() query: QueryBuyerBillingDto,
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can access buyer billing');
    }
    return await this.transactionsService.getBuyerBilling(buyerId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MilkTransaction> {
    return await this.transactionsService.findById(id);
  }
}
