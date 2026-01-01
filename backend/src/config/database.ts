// backend/src/config/database.ts
import { DataSource } from 'typeorm';
import { Hospital } from '../models/Hospital';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_NAME || 'medlocator_db',
  synchronize: true,
  logging: false,
  entities: [Hospital],
});