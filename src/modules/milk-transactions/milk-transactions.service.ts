import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  DeliverySession,
  MilkTransaction,
  MilkType,
  TransactionStatus,
} from './entities/milk-transaction.entity';
import { CreateMilkTransactionDto, UpdateMilkTransactionDto, QueryMilkTransactionDto } from './dto/create-milk-transaction.dto';
import { QueryBuyerBillingDto } from './dto/query-buyer-billing.dto';
import { MilkRatesService } from '../milk-rates/milk-rates.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MilkTransactionsService {
  constructor(
    @InjectRepository(MilkTransaction)
    private readonly transactionsRepository: Repository<MilkTransaction>,
    private readonly milkRatesService: MilkRatesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(sellerId: string, createDto: CreateMilkTransactionDto): Promise<MilkTransaction> {
    const status = createDto.status || TransactionStatus.DELIVERED;
    const deliverySession = createDto.deliverySession || createDto.shift || DeliverySession.MORNING;
    const milkType = createDto.milkType || MilkType.COW;
    const transactionDate = new Date(createDto.date);
    const quantity =
      status === TransactionStatus.DELIVERED
        ? (createDto.quantity as number)
        : 0;
    const { pricePerUnit, totalAmount } = await this.resolvePricingSnapshot(
      status,
      milkType,
      deliverySession,
      transactionDate,
      quantity,
    );

    const transactionData = {
      sellerId,
      buyerId: createDto.buyerId,
      date: transactionDate,
      quantity,
      unit: createDto.unit || 'L',
      status,
      deliverySession,
      milkType,
      remarks: createDto.remarks,
      pricePerUnit,
      totalAmount,
    };
    
    const transaction = this.transactionsRepository.create(transactionData);
    const saved = await this.transactionsRepository.save(transaction);

    if (status === TransactionStatus.DELIVERED && quantity > 0) {
      await this.notificationsService.notifyDelivery(sellerId, createDto.buyerId, quantity);
    }

    return saved;
  }

  async findById(id: string): Promise<MilkTransaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['seller', 'buyer'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async findAll(query: QueryMilkTransactionDto): Promise<MilkTransaction[]> {
    const queryBuilder = this.transactionsRepository.createQueryBuilder('transaction');

    if (query.sellerId) {
      queryBuilder.andWhere('transaction.sellerId = :sellerId', { sellerId: query.sellerId });
    }

    if (query.buyerId) {
      queryBuilder.andWhere('transaction.buyerId = :buyerId', { buyerId: query.buyerId });
    }

    if (query.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: query.status });
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    return await queryBuilder.orderBy('transaction.date', 'DESC').getMany();
  }

  async update(id: string, updateDto: UpdateMilkTransactionDto): Promise<MilkTransaction> {
    const transaction = await this.findById(id);

    const { shift, deliverySession, ...rest } = updateDto;
    Object.assign(transaction, rest);

    if (deliverySession || shift) {
      transaction.deliverySession = deliverySession || shift!;
    }

    if (transaction.status !== TransactionStatus.DELIVERED) {
      transaction.quantity = 0;
      transaction.pricePerUnit = 0;
      transaction.totalAmount = 0;
      return await this.transactionsRepository.save(transaction);
    }

    const quantity = Number(transaction.quantity ?? 0);
    if (!(quantity > 0)) {
      throw new BadRequestException('Quantity must be greater than 0 for delivered entries');
    }

    const shouldResolveRate =
      Number(transaction.pricePerUnit ?? 0) <= 0 ||
      updateDto.milkType !== undefined ||
      updateDto.deliverySession !== undefined ||
      updateDto.shift !== undefined ||
      updateDto.status !== undefined;

    if (shouldResolveRate) {
      transaction.pricePerUnit = await this.milkRatesService.resolveRate(
        transaction.milkType,
        transaction.deliverySession,
        transaction.date,
      );
    }
    transaction.totalAmount = quantity * Number(transaction.pricePerUnit ?? 0);

    return await this.transactionsRepository.save(transaction);
  }

  async delete(id: string): Promise<void> {
    const result = await this.transactionsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Transaction not found');
    }
  }

  async getSellerStats(sellerId: string, startDate: Date, endDate: Date) {
    const transactions = await this.transactionsRepository.find({
      where: {
        sellerId,
        date: Between(startDate, endDate),
      },
    });

    const totalQuantity = transactions.reduce((sum, t) => sum + parseFloat(t.quantity.toString()), 0);
    const totalLiters = transactions
      .filter((t) => t.unit === 'L')
      .reduce((sum, t) => sum + parseFloat(t.quantity.toString()), 0);
    const totalKg = transactions
      .filter((t) => t.unit === 'kg')
      .reduce((sum, t) => sum + parseFloat(t.quantity.toString()), 0);
    const totalAmount = transactions.reduce(
      (sum, t) => sum + parseFloat((t.totalAmount ?? 0).toString()),
      0,
    );
    const deliveredCount = transactions.filter(t => t.status === TransactionStatus.DELIVERED).length;

    return {
      totalTransactions: transactions.length,
      totalQuantity,
      totalLiters,
      totalKg,
      totalAmount,
      deliveredCount,
      transactions,
    };
  }

  async getAllSellersStats(startDate?: Date, endDate?: Date, status?: TransactionStatus) {
    const qb = this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.seller', 'seller')
      .select('transaction.sellerId', 'sellerId')
      .addSelect('seller.name', 'sellerName')
      .addSelect('seller.mobile', 'sellerMobile')
      .addSelect('COUNT(*)', 'totalTransactions')
      .addSelect('SUM(transaction.quantity)', 'totalQuantity')
      .addSelect("SUM(CASE WHEN transaction.unit = 'L' THEN transaction.quantity ELSE 0 END)", 'totalLiters')
      .addSelect("SUM(CASE WHEN transaction.unit = 'kg' THEN transaction.quantity ELSE 0 END)", 'totalKg')
      .addSelect('SUM(COALESCE(transaction."totalAmount", 0))', 'totalAmount')
      .addSelect(
        "SUM(CASE WHEN transaction.status = 'delivered' THEN 1 ELSE 0 END)",
        'deliveredCount',
      )
      .groupBy('transaction.sellerId')
      .addGroupBy('seller.name')
      .addGroupBy('seller.mobile')
      .orderBy('SUM(transaction.quantity)', 'DESC');

    if (startDate && endDate) {
      qb.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      qb.andWhere('transaction.date >= :startDate', { startDate });
    } else if (endDate) {
      qb.andWhere('transaction.date <= :endDate', { endDate });
    }

    if (status) {
      qb.andWhere('transaction.status = :status', { status });
    }

    const rows = await qb.getRawMany<{
      sellerId: string;
      sellerName: string;
      sellerMobile: string;
      totalTransactions: string;
      totalQuantity: string;
      totalLiters: string;
      totalKg: string;
      totalAmount: string;
      deliveredCount: string;
    }>();

    return rows.map((row) => ({
      sellerId: row.sellerId,
      sellerName: row.sellerName,
      sellerMobile: row.sellerMobile,
      totalTransactions: row.totalTransactions ? Number(row.totalTransactions) : 0,
      totalQuantity: row.totalQuantity ? Number(row.totalQuantity) : 0,
      totalLiters: row.totalLiters ? Number(row.totalLiters) : 0,
      totalKg: row.totalKg ? Number(row.totalKg) : 0,
      totalAmount: row.totalAmount ? Number(row.totalAmount) : 0,
      deliveredCount: row.deliveredCount ? Number(row.deliveredCount) : 0,
    }));
  }

  async getBuyerStats(buyerId: string, startDate: Date, endDate: Date) {
    const transactions = await this.transactionsRepository.find({
      where: {
        buyerId,
        date: Between(startDate, endDate),
      },
      relations: ['seller'],
    });

    const totalQuantity = transactions.reduce((sum, t) => sum + parseFloat(t.quantity.toString()), 0);
    const totalAmount = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    return {
      totalTransactions: transactions.length,
      totalQuantity,
      totalAmount,
      transactions,
    };
  }

  async getBuyerBilling(buyerId: string, query: QueryBuyerBillingDto) {
    const { startDate, endDate, month } = this.resolveBillingPeriod(query);
    const transactions = await this.transactionsRepository.find({
      where: {
        buyerId,
        status: TransactionStatus.DELIVERED,
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });

    const totalQuantity = transactions.reduce(
      (sum, item) => sum + Number(item.quantity ?? 0),
      0,
    );
    const totalAmount = transactions.reduce(
      (sum, item) => sum + Number(item.totalAmount ?? 0),
      0,
    );

    return {
      buyerId,
      month,
      periodStart: this.toDateOnly(startDate),
      periodEnd: this.toDateOnly(endDate),
      totalDeliveredEntries: transactions.length,
      totalQuantity,
      totalAmount,
      paymentsApplied: 0,
      netPayable: totalAmount,
      transactions,
    };
  }

  private async resolvePricingSnapshot(
    status: TransactionStatus,
    milkType: MilkType,
    deliverySession: DeliverySession,
    transactionDate: Date,
    quantity: number,
  ): Promise<{ pricePerUnit: number; totalAmount: number }> {
    if (status !== TransactionStatus.DELIVERED) {
      return { pricePerUnit: 0, totalAmount: 0 };
    }
    const resolvedRate = await this.milkRatesService.resolveRate(
      milkType,
      deliverySession,
      transactionDate,
    );
    return {
      pricePerUnit: resolvedRate,
      totalAmount: quantity * resolvedRate,
    };
  }

  private resolveBillingPeriod(query: QueryBuyerBillingDto): {
    startDate: Date;
    endDate: Date;
    month: string;
  } {
    if (query.month) {
      const [yearRaw, monthRaw] = query.month.split('-');
      const year = Number(yearRaw);
      const month = Number(monthRaw);
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0));
      return { startDate, endDate, month: query.month };
    }

    if (query.startDate || query.endDate) {
      if (!query.startDate || !query.endDate) {
        throw new BadRequestException('Both startDate and endDate are required when month is not provided');
      }
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      return {
        startDate,
        endDate,
        month: `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}`,
      };
    }

    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    return {
      startDate,
      endDate,
      month: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`,
    };
  }

  private toDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
