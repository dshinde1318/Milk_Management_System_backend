import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { MilkTransaction } from './entities/milk-transaction.entity';
import { MilkTransactionsController } from './milk-transactions.controller';
import { MilkTransactionsService } from './milk-transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([MilkTransaction]), NotificationsModule],
  controllers: [MilkTransactionsController],
  providers: [MilkTransactionsService],
  exports: [MilkTransactionsService],
})
export class MilkTransactionsModule {}
