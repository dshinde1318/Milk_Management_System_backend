import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminBuyersController } from './admin-buyers.controller';
import { AdminSellersController } from './admin-sellers.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController, AdminBuyersController, AdminSellersController],
  exports: [UsersService],
})
export class UsersModule {}
