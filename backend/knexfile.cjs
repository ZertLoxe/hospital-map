require("dotenv").config();

// Default to Docker Compose service `db` if no DATABASE_URL is set
const DATABASE_URL = process.env.DATABASE_URL || "";

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
