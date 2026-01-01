/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get the CSS class for the results panel width based on open/expanded state
 * @param isOpen - Whether the panel is open
 * @param isExpanded - Whether the panel is expanded to full width
 * @returns CSS class string
 */
export function getPanelWidthClass(isOpen: boolean, isExpanded: boolean): string {
  if (!isOpen) return 'w-0 opacity-0 overflow-hidden';
  return isExpanded ? 'w-full' : 'w-96';
}
