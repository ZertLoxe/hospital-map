/**
 * Production-ready Hospital Repository
 * 
 * Handles all database operations for hospitals table.
 * Uses raw SQL for PostGIS operations, Knex for standard queries.
 */

import db from "../db";
import type {
  CreateHospitalDto,
  UpdateHospitalDto,
  HospitalResponse,
  Coordinate,
} from "../schemas/hospital.schema";

export class HospitalRepository {
  private readonly table = "hospitals";

  /**
   * Create a new hospital
   * Converts lat/lng to PostGIS GEOGRAPHY point
   */
  async create(data: CreateHospitalDto): Promise<HospitalResponse> {
    const { name, type, status, location } = data;

    const [hospital] = await db(this.table)
      .insert({
        name,
        type,
        status,
        // Convert coordinates to PostGIS GEOGRAPHY point
        location: db.raw(
          `ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography`,
          [location.longitude, location.latitude]
        ),
      })
      .returning("*");

    return this.mapToResponse(hospital);
  }

  /**
   * Find hospital by ID
   */
  async findById(id: number): Promise<HospitalResponse | null> {
    const hospital = await db(this.table)
      .select(
        "*",
        db.raw("ST_Y(location::geometry) as latitude"),
        db.raw("ST_X(location::geometry) as longitude")
      )
      .where({ id })
      .first();

    return hospital ? this.mapToResponse(hospital) : null;
  }

  /**
   * Find all hospitals with optional filtering
   */
  async findAll(filters?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<HospitalResponse[]> {
    let query = db(this.table).select(
      "*",
      db.raw("ST_Y(location::geometry) as latitude"),
      db.raw("ST_X(location::geometry) as longitude")
    );

    if (filters?.type) {
      query = query.where({ type: filters.type });
    }

    if (filters?.status) {
      query = query.where({ status: filters.status });
    }

    const hospitals = await query
      .limit(filters?.limit ?? 20)
      .offset(filters?.offset ?? 0)
      .orderBy("created_at", "desc");

    return hospitals.map((h) => this.mapToResponse(h));
  }

  /**
   * Find hospitals within radius (meters) of a point
   * Uses PostGIS ST_DWithin for efficient spatial queries
   */
  async findNearby(
    location: Coordinate,
    radiusMeters: number,
    filters?: { type?: string; status?: string; limit?: number }
  ): Promise<Array<HospitalResponse & { distance: number }>> {
    const point = db.raw(
      `ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography`,
      [location.longitude, location.latitude]
    );

    let query = db(this.table)
      .select(
        "*",
        db.raw("ST_Y(location::geometry) as latitude"),
        db.raw("ST_X(location::geometry) as longitude"),
        db.raw(`ST_Distance(location, ${point.toQuery()}) as distance`)
      )
      .whereRaw(`ST_DWithin(location, ${point.toQuery()}, ?)`, [radiusMeters]);

    if (filters?.type) {
      query = query.where({ type: filters.type });
    }

    if (filters?.status) {
      query = query.where({ status: filters.status });
    }

    const hospitals = await query
      .orderBy("distance", "asc")
      .limit(filters?.limit ?? 20);

    return hospitals.map((h) => ({
      ...this.mapToResponse(h),
      distance: Math.round(h.distance), // Distance in meters
    }));
  }

  /**
   * Update hospital by ID
   */
  async update(
    id: number,
    data: UpdateHospitalDto
  ): Promise<HospitalResponse | null> {
    const updateData: any = { ...data };

    // Convert location if provided
    if (data.location) {
      updateData.location = db.raw(
        `ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography`,
        [data.location.longitude, data.location.latitude]
      );
    }

    const [hospital] = await db(this.table)
      .where({ id })
      .update(updateData)
      .returning([
        "*",
        db.raw("ST_Y(location::geometry) as latitude"),
        db.raw("ST_X(location::geometry) as longitude"),
      ]);

    return hospital ? this.mapToResponse(hospital) : null;
  }

  /**
   * Delete hospital by ID
   */
  async delete(id: number): Promise<boolean> {
    const deleted = await db(this.table).where({ id }).delete();
    return deleted > 0;
  }

  /**
   * Count total hospitals (for pagination)
   */
  async count(filters?: { type?: string; status?: string }): Promise<number> {
    let query = db(this.table).count("* as count");

    if (filters?.type) {
      query = query.where({ type: filters.type });
    }

    if (filters?.status) {
      query = query.where({ status: filters.status });
    }

    const result = await query.first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Map database row to API response
   * Parses PostGIS geometry to lat/lng coordinates
   */
  private mapToResponse(row: any): HospitalResponse {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      location: {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
      },
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}

export const hospitalRepository = new HospitalRepository();
