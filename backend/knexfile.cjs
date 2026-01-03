require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Detect if using cloud database vs local
const isCloudDatabase = process.env.DATABASE_URL.includes("aivencloud.com") ||
                        process.env.DATABASE_URL.includes("aws") ||
                        process.env.DATABASE_URL.includes("sslmode=require");

/**
 * Knex configuration - auto-detects cloud vs local database
 * 
 * @type {import('knex').Knex.Config}
 */
module.exports = {
  client: "pg",
  
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  },
  
  pool: {
    min: 0,
    max: 10,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,
  },
  
  migrations: {
    directory: "./src/knex/migrations",
    extension: "cjs",
  },
};
