/**
 * Production-ready migration for hospitals table with PostGIS support
 * 
 * PostGIS is enabled to support geospatial queries (proximity search, radius filtering).
 * GEOGRAPHY type with SRID 4326 ensures lat/lng coordinates work globally.
 * 
 * Migration is idempotent - safe to run multiple times.
 * 
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // Enable PostGIS extension for geospatial operations
  // Idempotent: safe to run multiple times
  await knex.raw("CREATE EXTENSION IF NOT EXISTS postgis");

  // Create ENUM types with idempotent checks
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hospital_type') THEN
        CREATE TYPE hospital_type AS ENUM ('Générale', 'Spécialisée');
      END IF;
    END
    $$;
  `);

  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hospital_status') THEN
        CREATE TYPE hospital_status AS ENUM ('Active', 'En construction', 'En étude');
      END IF;
    END
    $$;
  `);
  // Create hospitals table using Knex schema builder
  await knex.schema.createTable("hospitals", (table) => {
    // Primary key: auto-increment integer
    table.increments("id").primary();

    // Hospital name: max 50 characters, required
    table.string("name", 50).notNullable();

    // Hospital type: custom ENUM
    table
      .specificType("type", "hospital_type")
      .notNullable()
      .defaultTo("Générale");

    // Hospital status: custom ENUM
    table
      .specificType("status", "hospital_status")
      .notNullable()
      .defaultTo("Active");

    // Geospatial location: GEOGRAPHY for accurate Earth distance calculations
    // SRID 4326 = WGS84 lat/lng coordinate system
    table.specificType("location", "GEOGRAPHY(POINT, 4326)").notNullable();

    // Audit timestamps
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    table.timestamp("updated_at").defaultTo(knex.fn.now()).notNullable();

    // GiST index for efficient geospatial queries (proximity, radius)
    table.index(["location"], "idx_hospitals_location", "gist");

    // Standard B-tree indexes for common filters
    table.index(["status"], "idx_hospitals_status");
    table.index(["type"], "idx_hospitals_type");
  });

  // Create trigger for automatic updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await knex.raw(`
    CREATE TRIGGER update_hospitals_updated_at
    BEFORE UPDATE ON hospitals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

/**
 * Rollback migration
 * 
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  // Drop trigger and function
  await knex.raw("DROP TRIGGER IF EXISTS update_hospitals_updated_at ON hospitals");
  await knex.raw("DROP FUNCTION IF EXISTS update_updated_at_column");

  // Drop table
  await knex.schema.dropTableIfExists("hospitals");

  // Drop custom types
  await knex.raw("DROP TYPE IF EXISTS hospital_status");
  await knex.raw("DROP TYPE IF EXISTS hospital_type");

  // Note: PostGIS extension is NOT dropped - it may be used by other tables
};