import { calculateDistance } from './distance';

describe('calculateDistance', () => {
  it('should return 0 for the same point', () => {
    const distance = calculateDistance(33.5731, -7.5898, 33.5731, -7.5898);
    expect(distance).toBe(0);
  });

  it('should calculate distance between Casablanca and Rabat correctly', () => {
    // Casablanca: 33.5731, -7.5898
    // Rabat: 34.0209, -6.8416
    const distance = calculateDistance(33.5731, -7.5898, 34.0209, -6.8416);
    // Expected distance is approximately 85-90 km
    expect(distance).toBeGreaterThan(80);
    expect(distance).toBeLessThan(100);
  });

  it('should calculate distance between two nearby points', () => {
    // Two points about 1km apart
    const distance = calculateDistance(33.5731, -7.5898, 33.5821, -7.5898);
    expect(distance).toBeGreaterThan(0.5);
    expect(distance).toBeLessThan(2);
  });

  it('should be symmetric (same distance A->B as B->A)', () => {
    const distanceAB = calculateDistance(33.5731, -7.5898, 34.0209, -6.8416);
    const distanceBA = calculateDistance(34.0209, -6.8416, 33.5731, -7.5898);
    expect(distanceAB).toBeCloseTo(distanceBA, 10);
  });

  it('should handle negative coordinates', () => {
    const distance = calculateDistance(-33.9249, 18.4241, -34.0522, 18.4686);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(20);
  });

  it('should calculate long distances correctly', () => {
    // Casablanca to Paris (approximately 1900 km)
    const distance = calculateDistance(33.5731, -7.5898, 48.8566, 2.3522);
    expect(distance).toBeGreaterThan(1800);
    expect(distance).toBeLessThan(2000);
  });
});
