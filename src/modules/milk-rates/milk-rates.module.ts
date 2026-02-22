import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilkRate } from './entities/milk-rate.entity';
import { MilkRatesController } from './milk-rates.controller';
import { MilkRatesService } from './milk-rates.service';

@Module({
  imports: [TypeOrmModule.forFeature([MilkRate])],
  controllers: [MilkRatesController],
  providers: [MilkRatesService],
  exports: [MilkRatesService],
})
export class MilkRatesModule {}
