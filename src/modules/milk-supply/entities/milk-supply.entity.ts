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

@Entity('milk_supply')
@Index(['sellerId', 'date'])
export class MilkSupply {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  sellerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller!: User;

  @Column({ type: 'date' })
  date!: Date;

@Column({ type: 'decimal', precision: 10, scale: 2 })
quantity!: number;

@Column({ type: 'varchar', length: 10, default: 'L' })
unit!: string; // L (liter) or kg

@Column({ type: 'enum', enum: ['morning', 'evening'], default: 'morning' })
deliverySession!: 'morning' | 'evening';

@Column({ type: 'enum', enum: ['cow', 'buffalo'], default: 'cow' })
milkType!: 'cow' | 'buffalo';

@Column({ type: 'text', nullable: true })
remarks!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
