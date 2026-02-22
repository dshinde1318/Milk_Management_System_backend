import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeliverySession, MilkType } from '../../milk-transactions/entities/milk-transaction.entity';

@Entity('milk_rates')
@Index(['milkType', 'deliverySession', 'effectiveFrom'], { unique: true })
@Index(['milkType', 'effectiveFrom'])
export class MilkRate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: MilkType })
  milkType!: MilkType;

  @Column({ type: 'enum', enum: DeliverySession, nullable: true })
  deliverySession!: DeliverySession | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerUnit!: number;

  @Column({ type: 'date' })
  effectiveFrom!: Date;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
