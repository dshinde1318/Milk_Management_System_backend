import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MilkTransaction, TransactionStatus } from './entities/milk-transaction.entity';
import { CreateMilkTransactionDto, UpdateMilkTransactionDto, QueryMilkTransactionDto } from './dto/create-milk-transaction.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MilkTransactionsService {
  constructor(
    @InjectRepository(MilkTransaction)
    private readonly transactionsRepository: Repository<MilkTransaction>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(sellerId: string, createDto: CreateMilkTransactionDto): Promise<MilkTransaction> {
    const transactionData = {
      sellerId,
      buyerId: createDto.buyerId,
      date: new Date(createDto.date),
      quantity: createDto.quantity,
      unit: createDto.unit || 'L',
      status: createDto.status || TransactionStatus.DELIVERED,
      remarks: createDto.remarks,
      pricePerUnit: createDto.pricePerUnit,
      totalAmount: createDto.pricePerUnit ? createDto.quantity * createDto.pricePerUnit : undefined,
    };
    
    const transaction = this.transactionsRepository.create(transactionData);
    const saved = await this.transactionsRepository.save(transaction);

    // Send notification
    await this.notificationsService.notifyDelivery(sellerId, createDto.buyerId, createDto.quantity);

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

    Object.assign(transaction, updateDto);

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
}
