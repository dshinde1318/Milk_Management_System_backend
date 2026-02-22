import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMilkSupplyDto, QueryMilkSupplyDto } from './dto/create-milk-supply.dto';
import { MilkSupply } from './entities/milk-supply.entity';
import { User } from '../users/entities/user.entity';

export interface MilkSupplySellerSummary {
  sellerId: string;
  sellerName: string;
  sellerMobile: string;
  totalEntries: number;
  totalQuantity: number;
  totalLiters: number;
  totalKg: number;
  morningEntries: number;
  eveningEntries: number;
  cowEntries: number;
  buffaloEntries: number;
}

@Injectable()
export class MilkSupplyService {
  constructor(
    @InjectRepository(MilkSupply)
    private readonly milkSupplyRepository: Repository<MilkSupply>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createDto: CreateMilkSupplyDto): Promise<MilkSupply> {
    const seller = await this.userRepository.findOne({
      where: { id: createDto.sellerId },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const supply = this.milkSupplyRepository.create({
      ...createDto,
      date: new Date(createDto.date),
      unit: createDto.unit ?? 'L',
      deliverySession: createDto.deliverySession ?? createDto.shift ?? 'morning',
      milkType: createDto.milkType ?? 'cow',
    });
    return this.milkSupplyRepository.save(supply);
  }

  async findAll(query: QueryMilkSupplyDto): Promise<MilkSupply[]> {
    const qb = this.milkSupplyRepository
      .createQueryBuilder('milkSupply')
      .orderBy('milkSupply.date', 'DESC')
      .addOrderBy('milkSupply.createdAt', 'DESC');

    if (query.sellerId) {
      qb.andWhere('milkSupply.sellerId = :sellerId', { sellerId: query.sellerId });
    }

    if (query.startDate) {
      qb.andWhere('milkSupply.date >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      qb.andWhere('milkSupply.date <= :endDate', { endDate: query.endDate });
    }

    if (query.page || query.limit) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 50;
      qb.skip((page - 1) * limit).take(limit);
    }

    return qb.getMany();
  }

  async getSellersSummary(startDate?: Date, endDate?: Date): Promise<MilkSupplySellerSummary[]> {
    const qb = this.milkSupplyRepository
      .createQueryBuilder('milkSupply')
      .leftJoin('milkSupply.seller', 'seller')
      .select('milkSupply.sellerId', 'sellerId')
      .addSelect('seller.name', 'sellerName')
      .addSelect('seller.mobile', 'sellerMobile')
      .addSelect('COUNT(*)', 'totalEntries')
      .addSelect('SUM(milkSupply.quantity)', 'totalQuantity')
      .addSelect("SUM(CASE WHEN milkSupply.unit = 'L' THEN milkSupply.quantity ELSE 0 END)", 'totalLiters')
      .addSelect("SUM(CASE WHEN milkSupply.unit = 'kg' THEN milkSupply.quantity ELSE 0 END)", 'totalKg')
      .addSelect(
        "SUM(CASE WHEN milkSupply.deliverySession = 'morning' THEN 1 ELSE 0 END)",
        'morningEntries',
      )
      .addSelect(
        "SUM(CASE WHEN milkSupply.deliverySession = 'evening' THEN 1 ELSE 0 END)",
        'eveningEntries',
      )
      .addSelect("SUM(CASE WHEN milkSupply.milkType = 'cow' THEN 1 ELSE 0 END)", 'cowEntries')
      .addSelect("SUM(CASE WHEN milkSupply.milkType = 'buffalo' THEN 1 ELSE 0 END)", 'buffaloEntries')
      .groupBy('milkSupply.sellerId')
      .addGroupBy('seller.name')
      .addGroupBy('seller.mobile')
      .orderBy('SUM(milkSupply.quantity)', 'DESC');

    if (startDate && endDate) {
      qb.andWhere('milkSupply.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      qb.andWhere('milkSupply.date >= :startDate', { startDate });
    } else if (endDate) {
      qb.andWhere('milkSupply.date <= :endDate', { endDate });
    }

    const rows = await qb.getRawMany<{
      sellerId: string;
      sellerName: string;
      sellerMobile: string;
      totalEntries: string;
      totalQuantity: string;
      totalLiters: string;
      totalKg: string;
      morningEntries: string;
      eveningEntries: string;
      cowEntries: string;
      buffaloEntries: string;
    }>();

    return rows.map((row) => ({
      sellerId: row.sellerId,
      sellerName: row.sellerName,
      sellerMobile: row.sellerMobile,
      totalEntries: row.totalEntries ? Number(row.totalEntries) : 0,
      totalQuantity: row.totalQuantity ? Number(row.totalQuantity) : 0,
      totalLiters: row.totalLiters ? Number(row.totalLiters) : 0,
      totalKg: row.totalKg ? Number(row.totalKg) : 0,
      morningEntries: row.morningEntries ? Number(row.morningEntries) : 0,
      eveningEntries: row.eveningEntries ? Number(row.eveningEntries) : 0,
      cowEntries: row.cowEntries ? Number(row.cowEntries) : 0,
      buffaloEntries: row.buffaloEntries ? Number(row.buffaloEntries) : 0,
    }));
  }
}
