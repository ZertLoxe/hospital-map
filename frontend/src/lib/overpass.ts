import { FacilityTypeKey, MedicalFacility } from "@/types/hospital";
import { calculateDistance } from "@/lib/utils";
import type { Translations } from "@/contexts/LanguageContext";

// Google Places API type mapping
const GOOGLE_PLACES_TYPE_MAP: Record<FacilityTypeKey, string[]> = {
    hospital: ['hospital'],
    clinic: ['health', 'physiotherapist'],
    doctor: ['doctor', 'dentist'],
    pharmacy: ['pharmacy'],
    laboratory: ['health'],
};

// Fetch Google Places with retry logic
export async function fetchGooglePlacesWithRetry(
    lat: number,
    lng: number,
    radiusMeters: number,
    types: FacilityTypeKey[],
    maxRetries: number = 3
): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const typesQuery = buildGooglePlacesTypes(types);
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const url = `/api/places?location=${lat},${lng}&radius=${radiusMeters}&type=${typesQuery}`;
            const response = await fetch(url, {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return { success: true, data };
            }

            if (response.status >= 500 && attempt < maxRetries - 1) {
                console.warn(`Server error ${response.status}, retrying...`);
                continue;
            }

            const errorText = await response.text();
            return { success: false, error: `API error (${response.status}): ${errorText.slice(0, 100)}` };
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.warn(`Request timeout, trying again...`);
                continue;
            }
            console.warn(`Error:`, err);
            if (attempt === maxRetries - 1) {
                return { success: false, error: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}` };
            }
        }
    }
    return { success: false, error: "Google Places API request failed after retries." };
}

// Build Google Places type query string
export function buildGooglePlacesTypes(types: FacilityTypeKey[]): string {
    if (types.length === 0) {
        return 'hospital|doctor|pharmacy|health';
    }
    
    const googleTypes = new Set<string>();
    types.forEach(type => {
        const mappedTypes = GOOGLE_PLACES_TYPE_MAP[type];
        if (mappedTypes) {
            mappedTypes.forEach(t => googleTypes.add(t));
        }
    });
    
    return Array.from(googleTypes).join('|');
}

// Parse Google Places type to our FacilityTypeKey
export function parseGooglePlaceType(types: string[]): FacilityTypeKey | 'other' {
    if (types.includes('hospital')) return 'hospital';
    if (types.includes('doctor') || types.includes('dentist')) return 'doctor';
    if (types.includes('pharmacy')) return 'pharmacy';
    if (types.includes('health') || types.includes('physiotherapist')) {
        // We'll default health to clinic unless we can determine it's a lab
        return 'clinic';
    }
    return 'other';
}

// Determine specialty from Google Places data
function determineSpecialty(types: string[], name: string): string | undefined {
    const nameLower = name.toLowerCase();
    
    if (types.includes('dentist') || nameLower.includes('dentist') || nameLower.includes('dental')) {
        return 'Dentiste';
    }
    if (types.includes('physiotherapist') || nameLower.includes('physioth') || nameLower.includes('kinésithérapie')) {
        return 'Kinésithérapie';
    }
    if (nameLower.includes('laboratoire') || nameLower.includes('laboratory') || nameLower.includes('analyse')) {
        return 'Analyses Médicales';
    }
    if (nameLower.includes('podologue') || nameLower.includes('podiatrist')) {
        return 'Podologie';
    }
    if (nameLower.includes('psycho')) {
        return 'Psychothérapie';
    }
    
    return undefined;
}

export function parseGooglePlacesResponse(
    data: { results: any[] },
    point: { lat: number; lng: number },
    t: Translations
): MedicalFacility[] {
    if (!data.results) return [];

    return data.results
        .filter((place: any) => {
            return place.geometry && place.geometry.location;
        })
        .map((place: any) => {
            const lat = place.geometry.location.lat;
            const lng = place.geometry.location.lng;
            const distance = calculateDistance(point.lat, point.lng, lat, lng);
            const types = place.types || [];
            const placeType = parseGooglePlaceType(types);
            const specialty = determineSpecialty(types, place.name || '');

            return {
                id: place.place_id,
                name: place.name || t.results.unnamed,
                type: placeType,
                lat,
                lng,
                distance,
                phone: place.formatted_phone_number || undefined,
                address: place.vicinity || undefined,
                website: place.website || undefined,
                openingHours: place.opening_hours?.weekday_text?.join(', ') || undefined,
                wheelchair: place.wheelchair_accessible_entrance ? 'yes' : undefined,
                emergency: types.includes('emergency') || place.name?.toLowerCase().includes('urgence'),
                specialty,
            };
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}
