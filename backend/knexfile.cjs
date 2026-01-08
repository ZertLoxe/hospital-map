require("dotenv").config();

// Default to local Docker database if no DATABASE_URL set
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hospital_db";

/**
 * Knex configuration - simple setup for local Docker database
 * 
 * @type {import('knex').Knex.Config}
 */
module.exports = {
  client: "pg",
  
  connection: DATABASE_URL,
  
  pool: {
    min: 2,
    max: 10,
  },
  
  migrations: {
    directory: "./src/knex/migrations",
    extension: "cjs",
  },
};
