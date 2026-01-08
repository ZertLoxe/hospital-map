/**
 * Simplified Zod validation schemas for Hospital entity
 * Matches the simple database structure
 */

import { z } from "zod";

// ============================================================================
// Base Types - Simple strings, no complex ENUMs
// ============================================================================

export const HospitalTypeSchema = z.string().default("General");
export const HospitalStatusSchema = z.string().default("Active");

// ============================================================================
// Location Schema
// ============================================================================

export const CoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Create hospital request
 */
export const CreateHospitalSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  type: HospitalTypeSchema.optional(),
  status: HospitalStatusSchema.optional(),
  location: CoordinateSchema,
});

/**
 * Update hospital request (partial)
 */
export const UpdateHospitalSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  type: HospitalTypeSchema.optional(),
  status: HospitalStatusSchema.optional(),
  location: CoordinateSchema.optional(),
});

/**
 * Hospital ID param
 */
export const HospitalIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ============================================================================
// Query Schema
// ============================================================================

export const HospitalQuerySchema = z.object({
  // Location search
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().max(100000).optional(),

  // Filters
  type: z.string().optional(),
  status: z.string().optional(),

  // Pagination
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const HospitalResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  location: CoordinateSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const HospitalWithDistanceSchema = HospitalResponseSchema.extend({
  distance: z.number().nonnegative(),
});

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
// TypeScript Types
// ============================================================================

export type HospitalType = z.infer<typeof HospitalTypeSchema>;
export type HospitalStatus = z.infer<typeof HospitalStatusSchema>;
export type Coordinate = z.infer<typeof CoordinateSchema>;

export type CreateHospitalDto = z.infer<typeof CreateHospitalSchema>;
export type UpdateHospitalDto = z.infer<typeof UpdateHospitalSchema>;
export type HospitalIdParam = z.infer<typeof HospitalIdParamSchema>;
export type HospitalQuery = z.infer<typeof HospitalQuerySchema>;

export type HospitalResponse = z.infer<typeof HospitalResponseSchema>;
export type HospitalWithDistance = z.infer<typeof HospitalWithDistanceSchema>;
export type HospitalListResponse = z.infer<typeof HospitalListResponseSchema>;
