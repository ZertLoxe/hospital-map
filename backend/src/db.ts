/**
 * Production-ready Knex database connection
 * 
 * This is the ONLY database abstraction used in this project.
 * TypeORM is NOT used.
 * 
 * Database connection uses DATABASE_URL with SSL for cloud providers.
 * Schema management is done exclusively via Knex migrations.
 */

import * as dotenv from "dotenv";
import knex, { type Knex } from "knex";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

/**
 * Knex instance - use this for all database queries
 * 
 * IMPORTANT: 
 * - Uses DATABASE_URL with SSL configuration for cloud databases
 * - SSL is required for Aiven, AWS RDS, Supabase, Neon, etc.
 * - Connection pooling configured for production workloads
 */
const db: Knex = knex({
  client: "pg",
  
  // Use DATABASE_URL with SSL configuration
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for cloud-hosted databases
    },
  },
  
  // Production-grade connection pool
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,
  },
  
  // Query debugging in development
  debug: process.env.NODE_ENV === "development",
});

// Export default instance
export default db;
