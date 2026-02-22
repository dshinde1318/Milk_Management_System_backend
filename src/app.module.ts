import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getTypeOrmConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { MilkRatesModule } from './modules/milk-rates/milk-rates.module';
import { MilkSupplyModule } from './modules/milk-supply/milk-supply.module';
import { MilkTransactionsModule } from './modules/milk-transactions/milk-transactions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
    }),
    AuthModule,
    UsersModule,
    MilkRatesModule,
    MilkSupplyModule,
    MilkTransactionsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
