import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { DeliverySession, MilkType } from '../milk-transactions/entities/milk-transaction.entity';
import { CreateMilkRateDto, QueryMilkRateDto, UpdateMilkRateDto } from './dto/milk-rate.dto';
import { MilkRate } from './entities/milk-rate.entity';

@Injectable()
export class MilkRatesService {
  constructor(
    @InjectRepository(MilkRate)
    private readonly milkRateRepository: Repository<MilkRate>,
  ) {}

  async create(createDto: CreateMilkRateDto): Promise<MilkRate> {
    const effectiveFrom = new Date(createDto.effectiveFrom);
    const deliverySession: DeliverySession | null =
      createDto.deliverySession ?? createDto.shift ?? DeliverySession.MORNING;

    const existing = await this.findRateByKey(createDto.milkType, deliverySession, effectiveFrom);
    if (existing) {
      existing.pricePerUnit = createDto.pricePerUnit;
      existing.isActive = createDto.isActive ?? existing.isActive;
      try {
        return await this.milkRateRepository.save(existing);
      } catch (error) {
        this.throwIfUniqueConstraint(error);
        throw error;
      }
    }

    const entity = this.milkRateRepository.create({
      milkType: createDto.milkType,
      deliverySession,
      pricePerUnit: createDto.pricePerUnit,
      effectiveFrom,
      isActive: createDto.isActive ?? true,
    });

    try {
      return await this.milkRateRepository.save(entity);
    } catch (error) {
      this.throwIfUniqueConstraint(error);
      throw error;
    }
  }

  async findAll(query: QueryMilkRateDto): Promise<MilkRate[]> {
    const qb = this.milkRateRepository
      .createQueryBuilder('rate')
      .orderBy('rate.effectiveFrom', 'DESC')
      .addOrderBy('rate.updatedAt', 'DESC')
      .addOrderBy('rate.createdAt', 'DESC');

    if (query.milkType) {
      qb.andWhere('rate.milkType = :milkType', { milkType: query.milkType });
    }

    const deliverySession = query.deliverySession ?? query.shift;
    if (deliverySession) {
      qb.andWhere('rate.deliverySession = :deliverySession', {
        deliverySession,
      });
    } else {
      // Hide legacy session-null rows from admin listing.
      qb.andWhere('rate.deliverySession IS NOT NULL');
    }

    if (query.effectiveDate) {
      qb.andWhere('rate.effectiveFrom <= :effectiveDate', {
        effectiveDate: query.effectiveDate,
      });
    }

    if (typeof query.isActive === 'boolean') {
      qb.andWhere('rate.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.page || query.limit) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 50;
      qb.skip((page - 1) * limit).take(limit);
    }

    return qb.getMany();
  }

  async update(id: string, updateDto: UpdateMilkRateDto): Promise<MilkRate> {
    const rate = await this.findById(id);

    if (updateDto.milkType !== undefined) {
      rate.milkType = updateDto.milkType;
    }
    if (updateDto.deliverySession !== undefined || updateDto.shift !== undefined) {
      rate.deliverySession = updateDto.deliverySession ?? updateDto.shift!;
    }
    if (updateDto.pricePerUnit !== undefined) {
      rate.pricePerUnit = updateDto.pricePerUnit;
    }
    if (updateDto.effectiveFrom !== undefined) {
      rate.effectiveFrom = new Date(updateDto.effectiveFrom);
    }
    if (updateDto.isActive !== undefined) {
      rate.isActive = updateDto.isActive;
    }

    await this.assertUniqueRateCombination(
      rate.milkType,
      rate.deliverySession,
      rate.effectiveFrom,
      rate.id,
    );

    try {
      return await this.milkRateRepository.save(rate);
    } catch (error) {
      this.throwIfUniqueConstraint(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const rate = await this.findById(id);
    await this.milkRateRepository.remove(rate);
  }

  async resolveRate(
    milkType: MilkType,
    deliverySession: DeliverySession,
    transactionDate: Date,
  ): Promise<number> {
    const dateOnly = new Date(transactionDate.toISOString().slice(0, 10));
    const candidateRates = await this.milkRateRepository
      .createQueryBuilder('rate')
      .where('rate.milkType = :milkType', { milkType })
      .andWhere('rate.isActive = true')
      .andWhere('rate.effectiveFrom <= :effectiveFrom', {
        effectiveFrom: dateOnly.toISOString().slice(0, 10),
      })
      .andWhere('(rate.deliverySession = :deliverySession OR rate.deliverySession IS NULL)', {
        deliverySession,
      })
      .orderBy('CASE WHEN rate.deliverySession = :deliverySession THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('rate.effectiveFrom', 'DESC')
      .addOrderBy('rate.createdAt', 'DESC')
      .setParameter('deliverySession', deliverySession)
      .getMany();

    const rate = candidateRates[0];
    if (!rate) {
      throw new BadRequestException(
        `No active milk rate configured for milkType=${milkType}, session=${deliverySession}, date=${dateOnly.toISOString().slice(0, 10)}`,
      );
    }

    return Number(rate.pricePerUnit);
  }

  private async findById(id: string): Promise<MilkRate> {
    const rate = await this.milkRateRepository.findOne({ where: { id } });
    if (!rate) {
      throw new NotFoundException('Milk rate not found');
    }
    return rate;
  }

  private async assertUniqueRateCombination(
    milkType: MilkType,
    deliverySession: DeliverySession | null,
    effectiveFrom: Date,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.findRateByKey(milkType, deliverySession, effectiveFrom, excludeId);
    if (existing) {
      throw new ConflictException(
        {
          message: 'Rate already exists for this milkType/session/effectiveFrom combination',
          conflictingRateId: existing.id,
        },
      );
    }
  }

  private async findRateByKey(
    milkType: MilkType,
    deliverySession: DeliverySession | null,
    effectiveFrom: Date,
    excludeId?: string,
  ): Promise<MilkRate | null> {
    const qb = this.milkRateRepository
      .createQueryBuilder('rate')
      .where('rate.milkType = :milkType', { milkType })
      .andWhere('rate.effectiveFrom = :effectiveFrom', {
        effectiveFrom: effectiveFrom.toISOString().slice(0, 10),
      });

    if (deliverySession === null) {
      qb.andWhere('rate.deliverySession IS NULL');
    } else {
      qb.andWhere('rate.deliverySession = :deliverySession', { deliverySession });
    }

    if (excludeId) {
      qb.andWhere('rate.id != :excludeId', { excludeId });
    }

    return qb.orderBy('rate.updatedAt', 'DESC').getOne();
  }

  private throwIfUniqueConstraint(error: unknown): void {
    if (error instanceof QueryFailedError) {
      const driverError = (
        error as QueryFailedError & { driverError?: { code?: string; constraint?: string } }
      ).driverError;
      if (driverError?.code === '23505') {
        throw new ConflictException(
          'Rate already exists for this milkType/session/effectiveFrom combination',
        );
      }
    }
  }
}
