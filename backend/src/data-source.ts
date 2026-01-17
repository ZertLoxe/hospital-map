/**
 * ⚠️ DEPRECATED - This file should not be used
 * 
 * This project uses Knex.js exclusively for database operations.
 * Use src/db.ts for database connection.
 * 
 * TypeORM is NOT used in this project.
 */

export const MIGRATION_NOTICE = `
  This file exists for legacy compatibility only.
  All database operations use Knex.js via src/db.ts
  Migrations are managed via Knex: npm run knex:migrate
`;
