/**
 * Simplified Hospital Repository
 * Uses basic lat/lng columns - no PostGIS
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
   */
  async create(data: CreateHospitalDto): Promise<HospitalResponse> {
    const { name, type = "General", status = "Active", location } = data;

    const [hospital] = await db(this.table)
      .insert({
        name,
        type,
        status,
        lat: location.latitude,
        lng: location.longitude,
      })
      .returning("*");

    return this.mapToResponse(hospital);
  }

  /**
   * Find hospital by ID
   */
  async findById(id: number): Promise<HospitalResponse | null> {
    const hospital = await db(this.table).where({ id }).first();
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
    let query = db(this.table).select("*");

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
   * Uses simple bounding box approximation
   */
  async findNearby(
    location: Coordinate,
    radiusMeters: number,
    filters?: { type?: string; status?: string; limit?: number }
  ): Promise<Array<HospitalResponse & { distance: number }>> {
    // Approximate degrees per km (rough but works for nearby searches)
    const radiusKm = radiusMeters / 1000;
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(location.latitude * Math.PI / 180));

    let query = db(this.table)
      .select("*")
      .whereBetween("lat", [location.latitude - latDelta, location.latitude + latDelta])
      .whereBetween("lng", [location.longitude - lngDelta, location.longitude + lngDelta]);

    if (filters?.type) {
      query = query.where({ type: filters.type });
    }

    if (filters?.status) {
      query = query.where({ status: filters.status });
    }

    const hospitals = await query.limit(filters?.limit ?? 20);

    return hospitals.map((h) => ({
      ...this.mapToResponse(h),
      distance: this.calculateDistance(location, { latitude: h.lat, longitude: h.lng }),
    }));
  }

  /**
   * Update hospital by ID
   */
  async update(id: number, data: UpdateHospitalDto): Promise<HospitalResponse | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name) updateData.name = data.name;
    if (data.type) updateData.type = data.type;
    if (data.status) updateData.status = data.status;
    if (data.location) {
      updateData.lat = data.location.latitude;
      updateData.lng = data.location.longitude;
    }

    const [hospital] = await db(this.table)
      .where({ id })
      .update(updateData)
      .returning("*");

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
   * Count total hospitals
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
   */
  private mapToResponse(row: Record<string, unknown>): HospitalResponse {
    return {
      id: row.id as number,
      name: row.name as string,
      type: row.type as string,
      status: row.status as string,
      location: {
        latitude: parseFloat(row.lat as string),
        longitude: parseFloat(row.lng as string),
      },
      created_at: (row.created_at as Date)?.toISOString() || new Date().toISOString(),
      updated_at: (row.updated_at as Date)?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(from: Coordinate, to: Coordinate): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (to.latitude - from.latitude) * Math.PI / 180;
    const dLng = (to.longitude - from.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(from.latitude * Math.PI / 180) *
        Math.cos(to.latitude * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }
}

export const hospitalRepository = new HospitalRepository();
