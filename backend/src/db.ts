/**
 * Simple Knex database connection for Docker PostgreSQL
 */

import * as dotenv from "dotenv";
import knex, { type Knex } from "knex";

dotenv.config();

// Default to local Docker database
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hospital_db";

/**
 * Knex instance - use this for all database queries
 */
const db: Knex = knex({
  client: "pg",
  connection: DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
  },
  debug: process.env.NODE_ENV === "development",
});

// Export default instance
export default db;
