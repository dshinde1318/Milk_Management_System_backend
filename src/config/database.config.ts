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

export const getTypeOrmConfig = (configService?: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = configService?.get<string>('DATABASE_URL') ?? process.env.DATABASE_URL;
  const host = configService?.get<string>('DATABASE_HOST') ?? process.env.DATABASE_HOST ?? 'localhost';
  const port = toNumber(
    configService?.get<string>('DATABASE_PORT') ?? process.env.DATABASE_PORT,
    5433,
  );
  const username = configService?.get<string>('DATABASE_USER') ?? process.env.DATABASE_USER ?? 'milk_user';
  const password =
    configService?.get<string>('DATABASE_PASSWORD') ?? process.env.DATABASE_PASSWORD ?? 'milk_password';
  const database = configService?.get<string>('DATABASE_NAME') ?? process.env.DATABASE_NAME ?? 'milk_db';
  const nodeEnv = configService?.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';
  const sslEnabled =
    !!databaseUrl &&
    (databaseUrl.includes('sslmode=require') || databaseUrl.includes('neon.tech'));

  return {
    type: 'postgres',
    ...(databaseUrl
      ? {
          url: databaseUrl,
        }
      : {
          host,
          port,
          username,
          password,
          database,
        }),
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    entities: [User, MilkTransaction, MilkSupply, MilkRate],
    migrations: ['src/database/migrations/*.ts', 'dist/database/migrations/*.js'],
    synchronize: nodeEnv !== 'production',
    logging: nodeEnv === 'development',
  };
};

const dataSourceOptions = getTypeOrmConfig() as DataSourceOptions;

export default new DataSource(dataSourceOptions);
