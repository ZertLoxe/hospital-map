import { FacilityTypeKey, MedicalFacility } from "@/types/hospital";
import { calculateDistance } from "@/lib/utils";
import type { Translations } from "@/contexts/LanguageContext";

// Google Places API type mapping
const GOOGLE_PLACES_TYPE_MAP: Record<FacilityTypeKey, string[]> = {
    hospital: ['hospital'],
    clinic: ['doctor', 'physiotherapist', 'health'],
    doctor: ['doctor', 'dentist'],
    pharmacy: ['pharmacy', 'drugstore'],
    laboratory: ['health'],
};

// Fetch Google Places with retry logic - makes multiple calls for different types and handles pagination
export async function fetchGooglePlacesWithRetry(
    lat: number,
    lng: number,
    radiusMeters: number,
    types: FacilityTypeKey[],
    maxRetries: number = 3
): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const googleTypesToSearch = getGoogleTypesToSearch(types);
    const allResults: any[] = [];
    const seenPlaceIds = new Set<string>();
    
    // Geographic boundary to strictly block Spanish results across the strait.
    // Tarifa (Spain) is at 36.01°N, Gibraltar at 36.14°N
    // Tanger Ville is at 35.77°N, Tanger Med port at 35.89°N
    // Setting to 35.92°N to be absolutely safe and block ALL Spanish territory
    const MOROCCO_NORTH_LIMIT = 35.92;

    for (const googleType of googleTypesToSearch) {
        let nextPageToken: string | null = null;
        let pageCount = 0;
        // Google Places API max limit is 3 pages (60 results) per query
        // We'll fetch all available pages with no artificial limit
        const maxPages = 10; // High enough to get all pages (Google stops at 3 anyway)

        do {
            let success = false;
            for (let attempt = 0; attempt < maxRetries && !success; attempt++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000);

                    let url = `/api/places?location=${lat},${lng}&radius=${radiusMeters}&type=${googleType}`;
                    if (nextPageToken) {
                        url = `/api/places?pagetoken=${nextPageToken}`;
                        // Google requires a short delay before the token becomes active
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }

                    const response = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        if (data.results && Array.isArray(data.results)) {
                            let addedCount = 0;
                            let filteredCount = 0;
                            data.results.forEach((place: any) => {
                                const pLat = place.geometry?.location?.lat;
                                
                                // Only process places with valid coordinates
                                if (!pLat || !place.place_id) {
                                    return; // Skip places without coordinates or ID
                                }
                                
                                // Skip duplicates
                                if (seenPlaceIds.has(place.place_id)) {
                                    return;
                                }
                                
                                // STRICT GEOGRAPHIC FILTER: Reject anything north of Morocco limit
                                if (pLat >= MOROCCO_NORTH_LIMIT) {
                                    filteredCount++;
                                    console.log(`🚫 Filtered out (Spain): ${place.name} at ${pLat.toFixed(4)}°N`);
                                    return;
                                }
                                
                                // Valid Moroccan facility
                                seenPlaceIds.add(place.place_id);
                                allResults.push(place);
                                addedCount++;
                            });
                            console.log(`[${googleType}] Page ${pageCount + 1}: ${addedCount} added, ${filteredCount} filtered (Spain), ${data.results.length} total in response`);
                        }
                        nextPageToken = data.next_page_token || null;
                        if (nextPageToken) {
                            console.log(`[${googleType}] Next page token available, will fetch page ${pageCount + 2}`);
                        } else {
                            console.log(`[${googleType}] No more pages available. Total fetched: ${pageCount + 1} pages`);
                        }
                        success = true;
                    } else if (response.status >= 500 && attempt < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                        continue;
                    } else {
                        break;
                    }
                } catch (err) {
                    if (attempt === maxRetries - 1) break;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            pageCount++;
        } while (nextPageToken && pageCount < maxPages);
        
        console.log(`[${googleType}] Completed: ${pageCount} pages fetched`);
    }
    
    console.log(`Total unique facilities found: ${allResults.length}`);
    
    if (allResults.length > 0 || googleTypesToSearch.length === 0) {
        return { success: true, data: { results: allResults, status: 'OK' } };
    }
    
    return { success: false, error: "No results found for the selected facility types." };
}

// Get list of Google Places types to search for based on selected facility types
function getGoogleTypesToSearch(types: FacilityTypeKey[]): string[] {
    if (types.length === 0) {
        // Search all medical-related types
        return ['hospital', 'doctor', 'dentist', 'pharmacy', 'physiotherapist', 'health'];
    }
    
    const googleTypes = new Set<string>();
    types.forEach(type => {
        const mappedTypes = GOOGLE_PLACES_TYPE_MAP[type];
        if (mappedTypes) {
            mappedTypes.forEach(t => googleTypes.add(t));
        }
    });
    
    return Array.from(googleTypes);
}

// Parse Google Places type to our FacilityTypeKey
export function parseGooglePlaceType(types: string[], name: string = '', address: string = ''): FacilityTypeKey | 'other' {
    const nameLower = name.toLowerCase();
    const addressLower = address.toLowerCase();
    const combinedText = `${nameLower} ${addressLower}`;

    // 1. HARD EXCLUSIONS - Definitely not medical
    const NON_MEDICAL_TYPES = [
        'place_of_worship', 'mosque', 'church', 'synagogue', 'temple',
        'restaurant', 'cafe', 'bar', 'food', 'meal_delivery', 'meal_takeaway',
        'store', 'clothing_store', 'grocery_or_supermarket', 'supermarket',
        'shopping_mall', 'bakery', 'bank', 'atm', 'gas_station',
        'car_repair', 'car_dealer', 'parking', 'lodging', 'hotel',
        'school', 'university', 'library', 'post_office', 'stadium'
    ];
    
    // Check if any Google type is definitely non-medical
    if (types.some(type => NON_MEDICAL_TYPES.includes(type))) {
        return 'other';
    }

    // 2. KEYWORD EXCLUSIONS (Both Name and Address-like fields)
    const EXCLUSION_KEYWORDS = [
        'mosquée', 'mosque', 'masjid', 'مسجد', 'zawiya', 'zaouïa',
        'église', 'church', 'synagogue', 'temple',
        'droguerie', 'drogrie', 'drogries', 'drogue', 'hardware', 'quincaillerie', 'visserie',
        'restaurant', 'café', 'pizzeria', 'snack', 'food', 'grill',
        'épicerie', 'supermarché', 'supermarket', 'market', 'marché',
        'banque', 'bank', 'assurance', 'insurance', 'école', 'school',
        'hôtel', 'hotel', 'café', 'complexe', 'résidence', 'residence'
    ];

    if (EXCLUSION_KEYWORDS.some(k => combinedText.includes(k))) {
        return 'other';
    }
    
    // 3. POSITIVE IDENTIFICATION
    // Priority 1: Hospital
    if (types.includes('hospital')) return 'hospital';
    
    // Priority 2: Pharmacy (Explicit Google type)
    if (types.includes('pharmacy') || types.includes('drugstore')) {
        // Double check it's not a hardware drug store (droguerie) mislabeled by Google
        if (combinedText.includes('drogue')) return 'other';
        return 'pharmacy';
    }
    
    // Priority 3: Check for pharmacy in name/address
    if (combinedText.includes('pharmacie') || combinedText.includes('pharmacy') || combinedText.includes('صيدلية')) {
        return 'pharmacy';
    }
    
    // Priority 4: Laboratory based on name
    if (nameLower.includes('laboratoire') || nameLower.includes('laboratory') || 
        combinedText.includes('analyse') || combinedText.includes('lab ')) {
        return 'laboratory';
    }
    
    // Priority 5: Doctors/dentists
    if (types.includes('doctor') || types.includes('dentist')) return 'doctor';
    
    // Priority 6: Clinic/medical office
    if (types.includes('health') || types.includes('physiotherapist')) {
        if (combinedText.includes('clinique') || combinedText.includes('clinic') ||
            combinedText.includes('centre') || combinedText.includes('center') ||
            combinedText.includes('polyclinique')) {
            return 'clinic';
        }
        return 'doctor';
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
    t: Translations,
    allowedTypes: FacilityTypeKey[] = []
): MedicalFacility[] {
    if (!data.results) return [];
    const allowedSet = new Set(allowedTypes);

    return data.results
        .filter((place: any) => {
            return place.geometry && place.geometry.location;
        })
        .map((place: any) => {
            const lat = place.geometry.location.lat;
            const lng = place.geometry.location.lng;
            const distance = calculateDistance(point.lat, point.lng, lat, lng);
            const types = place.types || [];
            const placeName = place.name || '';
            const placeAddress = place.vicinity || '';
            const placeType = parseGooglePlaceType(types, placeName, placeAddress);
            const specialty = determineSpecialty(types, placeName);

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
        .filter((facility) => {
            if (allowedSet.size === 0) return true;
            return allowedSet.has(facility.type as FacilityTypeKey);
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}
