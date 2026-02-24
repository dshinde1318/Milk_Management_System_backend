import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { MilkRate } from '../modules/milk-rates/entities/milk-rate.entity';
import { MilkSupply } from '../modules/milk-supply/entities/milk-supply.entity';
import { MilkTransaction } from '../modules/milk-transactions/entities/milk-transaction.entity';
import { User } from '../modules/users/entities/user.entity';

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const getTypeOrmConfig = (
  configService?: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl =
    configService?.get<string>('DATABASE_URL') ??
    process.env.DATABASE_URL;

  const nodeEnv =
    configService?.get<string>('NODE_ENV') ??
    process.env.NODE_ENV ??
    'development';

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [User, MilkTransaction, MilkSupply, MilkRate],
      migrations: ['dist/database/migrations/*.js'],
      synchronize: false,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  // fallback for local development
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'milk_password',
    database: process.env.DATABASE_NAME ?? 'milk_db',
    entities: [User, MilkTransaction, MilkSupply, MilkRate],
    synchronize: nodeEnv !== 'production',
  };
};

const dataSourceOptions = getTypeOrmConfig() as DataSourceOptions;

export default new DataSource(dataSourceOptions);
