/**
 * Simple migration for hospitals table
 * No PostGIS, no complex ENUMs - just basic columns
 * 
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("hospitals", (table) => {
    // Primary key
    table.increments("id").primary();

    // Hospital name
    table.string("name", 100).notNullable();

    // Type and status as simple strings
    table.string("type", 50).notNullable().defaultTo("General");
    table.string("status", 50).notNullable().defaultTo("Active");

    // Location as simple lat/lng columns
    table.decimal("lat", 10, 7).notNullable();
    table.decimal("lng", 11, 7).notNullable();

    // Timestamps
    table.timestamps(true, true);
  });

  // Add indexes for common queries
  await knex.schema.alterTable("hospitals", (table) => {
    table.index(["lat", "lng"], "idx_hospitals_location");
    table.index(["type"], "idx_hospitals_type");
    table.index(["status"], "idx_hospitals_status");
  });
};

/**
 * Rollback migration
 * 
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("hospitals");
};
