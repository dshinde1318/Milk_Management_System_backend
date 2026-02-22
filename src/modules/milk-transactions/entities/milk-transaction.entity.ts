import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliverySession {
  MORNING = 'morning',
  EVENING = 'evening',
}

export enum MilkType {
  COW = 'cow',
  BUFFALO = 'buffalo',
}

@Entity('milk_transactions')
@Index(['sellerId', 'buyerId', 'date'])
export class MilkTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  sellerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller!: User;

  @Column({ type: 'uuid' })
  buyerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer!: User;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Column({ type: 'varchar', length: 10, default: 'L' })
  unit!: string; // L (Liter) or kg (kilogram)

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.DELIVERED })
  status!: TransactionStatus;

  @Column({ type: 'enum', enum: DeliverySession, default: DeliverySession.MORNING })
  deliverySession!: DeliverySession;

  @Column({ type: 'enum', enum: MilkType, default: MilkType.COW })
  milkType!: MilkType;

  @Column({ type: 'text', nullable: true })
  remarks!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerUnit!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
