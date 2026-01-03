/**
 * Production-ready Zod validation schemas for Hospital entity
 * 
 * Aligns with database constraints in migration: 20260102180000_create_hospitals.cjs
 * All validations enforce database-level constraints at the application layer.
 */

import { z } from "zod";

// ============================================================================
// Base Type Definitions (Match Database ENUMs)
// ============================================================================

/**
 * Hospital type enum - synchronized with database ENUM hospital_type
 */
export const HospitalTypeSchema = z.enum(["Générale", "Spécialisée"]);

/**
 * Hospital status enum - synchronized with database ENUM hospital_status
 */
export const HospitalStatusSchema = z.enum(["Active", "En construction", "En étude"]);

// ============================================================================
// Geospatial Schemas (WGS84 / SRID 4326)
// ============================================================================

/**
 * WGS84 coordinate validation (SRID 4326)
 * Used for PostGIS GEOGRAPHY(POINT, 4326) column
 */
export const CoordinateSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict();

// ============================================================================
// Request DTOs (API Input)
// ============================================================================

/**
 * Create hospital request schema
 * Enforces DB constraints: name VARCHAR(50) NOT NULL, location NOT NULL
 */
export const CreateHospitalSchema = z
  .object({
    name: z.string().min(1).max(50).trim(),
    type: HospitalTypeSchema.default("Générale"),
    status: HospitalStatusSchema.default("Active"),
    location: CoordinateSchema,
  })
  .strict();

/**
 * Update hospital request schema (partial updates)
 * All fields optional except id (provided via route params)
 */
export const UpdateHospitalSchema = z
  .object({
    name: z.string().min(1).max(50).trim().optional(),
    type: HospitalTypeSchema.optional(),
    status: HospitalStatusSchema.optional(),
    location: CoordinateSchema.optional(),
  })
  .strict();

/**
 * Route parameter schema for hospital ID
 */
export const HospitalIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ============================================================================
// Query/Filter Schemas
// ============================================================================

/**
 * Hospital list query parameters
 * Supports filtering, pagination, and geospatial radius search
 */
export const HospitalQuerySchema = z
  .object({
    // Geospatial search params
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().positive().max(100000).optional(), // meters, max 100km
    
    // Filter params
    type: HospitalTypeSchema.optional(),
    status: HospitalStatusSchema.optional(),
    
    // Pagination params
    limit: z.coerce.number().int().positive().max(100).default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
  })
  .refine(
    (data) => {
      // If radius search is requested, require both lat and lng
      if (data.radius !== undefined) {
        return data.latitude !== undefined && data.longitude !== undefined;
      }
      return true;
    },
    {
      message: "Radius search requires both latitude and longitude",
    }
  );

// ============================================================================
// Database Schemas (Internal)
// ============================================================================

/**
 * Raw database row schema
 * Represents data as returned from Knex queries
 */
export const HospitalDbRowSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  type: HospitalTypeSchema,
  status: HospitalStatusSchema,
  location: z.string(), // PostGIS GEOGRAPHY serialized as WKB or GeoJSON
  created_at: z.date(),
  updated_at: z.date(),
});

// ============================================================================
// Response DTOs (API Output)
// ============================================================================

/**
 * Standard hospital response schema
 * Location parsed from PostGIS to lat/lng coordinates
 */
export const HospitalResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  type: HospitalTypeSchema,
  status: HospitalStatusSchema,
  location: CoordinateSchema,
  created_at: z.string().datetime(), // ISO 8601 format
  updated_at: z.string().datetime(),
});

/**
 * Hospital response with distance (for proximity search)
 */
export const HospitalWithDistanceSchema = HospitalResponseSchema.extend({
  distance: z.number().nonnegative(), // meters from search point
});

/**
 * Paginated hospital list response
 */
export const HospitalListResponseSchema = z.object({
  data: z.array(HospitalResponseSchema),
  pagination: z.object({
    total: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    hasMore: z.boolean(),
  }),
});

// ============================================================================
// TypeScript Type Exports
// ============================================================================

export type HospitalType = z.infer<typeof HospitalTypeSchema>;
export type HospitalStatus = z.infer<typeof HospitalStatusSchema>;
export type Coordinate = z.infer<typeof CoordinateSchema>;

export type CreateHospitalDto = z.infer<typeof CreateHospitalSchema>;
export type UpdateHospitalDto = z.infer<typeof UpdateHospitalSchema>;
export type HospitalIdParam = z.infer<typeof HospitalIdParamSchema>;
export type HospitalQuery = z.infer<typeof HospitalQuerySchema>;

export type HospitalDbRow = z.infer<typeof HospitalDbRowSchema>;
export type HospitalResponse = z.infer<typeof HospitalResponseSchema>;
export type HospitalWithDistance = z.infer<typeof HospitalWithDistanceSchema>;
export type HospitalListResponse = z.infer<typeof HospitalListResponseSchema>;
