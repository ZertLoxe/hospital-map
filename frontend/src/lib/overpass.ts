import { FacilityTypeKey, FACILITY_TYPE_MAP, normalizeSpecialty, OverpassElement, MedicalFacility, FACILITY_TYPE_KEYS } from "@/types/hospital";
import { calculateDistance } from "@/lib/utils";
import type { Translations } from "@/contexts/LanguageContext";

// Overpass API endpoints (multiple mirrors for reliability)
const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// Fetch with retry logic across multiple endpoints
export async function fetchOverpassWithRetry(
    query: string,
    maxRetries: number = 3
): Promise<{ success: boolean; data?: unknown; error?: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return { success: true, data };
            }

            // If server error (5xx), try next endpoint
            if (response.status >= 500) {
                console.warn(`Endpoint ${endpoint} returned ${response.status}, trying next...`);
                continue;
            }

            // Client error, don't retry
            const errorText = await response.text();
            return { success: false, error: `API error (${response.status}): ${errorText.slice(0, 100)}` };
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.warn(`Timeout on ${endpoint}, trying next...`);
                continue;
            }
            console.warn(`Error on ${endpoint}:`, err);
            if (attempt === maxRetries - 1) {
                return { success: false, error: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}` };
            }
        }
    }
    return { success: false, error: "All Overpass API endpoints failed. Please try again later." };
}

// Build Overpass API query
export function buildOverpassQuery(lat: number, lng: number, radiusMeters: number, types: FacilityTypeKey[]): string {
    // Map selected types to OSM amenity values
    let amenities: string[] = [];
    if (types.length === 0) {
        // If no types selected, search for all medical facilities
        amenities = ["hospital", "clinic", "doctors", "dentist", "pharmacy", "laboratory", "medical_laboratory"];
    } else {
        types.forEach(type => {
            const osmTypes = FACILITY_TYPE_MAP[type];
            if (osmTypes) {
                amenities.push(...osmTypes);
            }
        });
    }
    // Build Overpass QL query - search for nodes and ways, output center coordinates
    const amenityQuery = amenities.map(a =>
        `node["amenity"="${a}"](around:${radiusMeters},${lat},${lng});
     way["amenity"="${a}"](around:${radiusMeters},${lat},${lng});`
    ).join("\n");
    const healthcareQuery = amenities.includes("laboratory") || amenities.includes("medical_laboratory")
        ? `node["healthcare"="laboratory"](around:${radiusMeters},${lat},${lng});
       way["healthcare"="laboratory"](around:${radiusMeters},${lat},${lng});`
        : "";
    const query = `
    [out:json][timeout:25];
    (
      ${amenityQuery}
      ${healthcareQuery}
    );
    out center;
  `;
    return query;
}

// Parse OSM amenity type to display name
export function parseAmenityType(amenity: string, healthcare?: string): FacilityTypeKey | 'other' {
    // Return a facility key (one of FacilityTypeKey) so UI can translate
    if (healthcare === "laboratory") return "laboratory";
    switch (amenity) {
        case "hospital": return "hospital";
        case "clinic": return "clinic";
        case "doctors":
        case "dentist": return "doctor";
        case "pharmacy": return "pharmacy";
        case "laboratory":
        case "medical_laboratory": return "laboratory";
        default: return "other";
    }
}

export function parseOverpassResponse(data: { elements: OverpassElement[] }, point: { lat: number; lng: number }, t: Translations): MedicalFacility[] {
    return data.elements
        .filter((el: OverpassElement) => {
            // Must have tags (amenity or healthcare)
            if (!el.tags) return false;
            // Must have coordinates (either direct lat/lon for nodes, or center for ways)
            const hasCoords = (el.lat !== undefined && el.lon !== undefined) || el.center;
            return hasCoords;
        })
        .map((el: OverpassElement) => {
            const tags = el.tags!;
            // Get coordinates - prefer direct lat/lon, fall back to center for ways
            const elLat = el.lat ?? el.center?.lat ?? 0;
            const elLon = el.lon ?? el.center?.lon ?? 0;
            const distance = calculateDistance(point.lat, point.lng, elLat, elLon);
            // Extract and normalize specialty
            let specialty = undefined;
            const rawSpecialty = tags["healthcare:speciality"] || tags["medical_specialty"];

            if (rawSpecialty) {
                // Handle multiple specialties (take the first one primarily, or you could store all)
                // For now, let's take the first one to simplify the UI
                const first = rawSpecialty.split(';')[0];
                specialty = normalizeSpecialty(first);
            } else if (tags.amenity === 'dentist') {
                specialty = 'Dentiste';
            } else if (tags.healthcare === 'physiotherapist') {
                specialty = 'Kinésithérapie';
            } else if (tags.healthcare === 'podiatrist') {
                specialty = 'Podologie';
            } else if (tags.healthcare === 'psychotherapist') {
                specialty = 'Psychothérapie';
            } else if (tags.healthcare === 'laboratory' || tags.healthcare === 'medical_laboratory') {
                specialty = 'Analyses Médicales';
            }
            return {
                id: String(el.id),
                // Search for name in multiple possible tags before giving a generic name
                name: tags.name || tags["name:fr"] || tags["name:ar"] || tags.brand || tags.operator || t.results.unnamed,
                type: parseAmenityType(tags.amenity, tags.healthcare),
                lat: elLat,
                lng: elLon,
                distance,
                phone: tags.phone || tags["contact:phone"] || undefined,
                address: tags["addr:street"]
                    ? `${tags["addr:housenumber"] || ''} ${tags["addr:street"]}${tags["addr:city"] ? ', ' + tags["addr:city"] : ''}`.trim()
                    : undefined,
                website: tags.website || tags["contact:website"],
                openingHours: tags.opening_hours,
                wheelchair: tags.wheelchair,
                emergency: tags.emergency === "yes",
                specialty: specialty,
            };
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}
