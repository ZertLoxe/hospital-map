import { hospitalSchema } from './validations';

describe('hospitalSchema', () => {
  describe('name validation', () => {
    it('should accept valid name', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Central',
        type: 'Générale',
        status: 'active',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 3 characters', () => {
      const result = hospitalSchema.safeParse({
        name: 'Ho',
        type: 'Générale',
        status: 'active',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 50 characters', () => {
      const result = hospitalSchema.safeParse({
        name: 'A'.repeat(51),
        type: 'Générale',
        status: 'active',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('type validation', () => {
    it('should accept Générale type', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'Générale',
        status: 'active',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(true);
    });

    it('should accept Spécialisée type', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'Spécialisée',
        status: 'active',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'InvalidType',
        status: 'active',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('status validation', () => {
    it('should accept active status', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'Générale',
        status: 'active',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(true);
    });

    it('should accept en_construction status', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'Générale',
        status: 'en_construction',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(true);
    });

    it('should accept en_étude status', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'Générale',
        status: 'en_étude',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'Générale',
        status: 'invalid',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('coordinates validation', () => {
    it('should accept valid coordinates', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'Générale',
        status: 'active',
        lat: 33.5731,
        lng: -7.5898,
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing lat', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'Générale',
        status: 'active',
        lng: -7.5898,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing lng', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'Générale',
        status: 'active',
        lat: 33.5731,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-number coordinates', () => {
      const result = hospitalSchema.safeParse({
        name: 'Hôpital Test',
        type: 'Générale',
        status: 'active',
        lat: 'not a number',
        lng: -7.5898,
      });
      expect(result.success).toBe(false);
    });
  });
});
