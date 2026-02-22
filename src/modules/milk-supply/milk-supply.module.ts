import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilkSupplyController } from './milk-supply.controller';
import { MilkSupply } from './entities/milk-supply.entity';
import { MilkSupplyService } from './milk-supply.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MilkSupply, User])],
  controllers: [MilkSupplyController],
  providers: [MilkSupplyService],
  exports: [MilkSupplyService],
})
export class MilkSupplyModule {}
