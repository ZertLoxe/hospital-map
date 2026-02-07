import { FacilityTypeKey, MedicalFacility } from "@/types/hospital";
import { calculateDistance } from "@/lib/utils";
import type { Translations } from "@/contexts/LanguageContext";

// Google Places API type mapping
const GOOGLE_PLACES_TYPE_MAP: Record<FacilityTypeKey, string[]> = {
    hospital: ['hospital'],
    clinic: ['hospital', 'doctor', 'physiotherapist', 'health'],
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
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const nameLower = normalize(name);
    const addressLower = normalize(address);
    const combinedText = `${nameLower} ${addressLower}`;

    // STEP 1: Check for OBVIOUS non-medical Google types first
    const OBVIOUS_NON_MEDICAL = [
        'place_of_worship', 'mosque', 'church', 'synagogue', 'temple',
        'restaurant', 'cafe', 'bar', 'meal_delivery', 'meal_takeaway',
        'school', 'university', 'library', 'stadium', 'park'
    ];
    
    if (types.some(type => OBVIOUS_NON_MEDICAL.includes(type))) {
        return 'other';
    }

    // STEP 2: Check for OBVIOUS non-medical keywords in NAME or ADDRESS
    const NON_MEDICAL_KEYWORDS = [
        'mosquee', 'mosque', 'masjid', 'masjed', 'zawiya', 'zaouia', 'taouba', 'touba', 'jamaa', 'جامع',
        'eglise', 'church', 'synagogue', 'temple',
        'restaurant', 'pizzeria', 'snack', 'cafe', 'coffee'
    ];
    
    // If name or address contains a non-medical keyword, mark as 'other' UNLESS it also contains a medical keyword
    if (NON_MEDICAL_KEYWORDS.some(k => combinedText.includes(k))) {
        // Exception: If it's explicitly named a pharmacy or clinic despite the location keyword (e.g. "Pharmacie de la Mosquée")
        const MEDICAL_OVERRIDE = ['pharmacie', 'pharmacy', 'clinique', 'clinic', 'laboratoire', 'laboratory', 'docteur', 'doctor', 'medical', 'sante'];
        if (!MEDICAL_OVERRIDE.some(m => nameLower.includes(m))) {
            return 'other';
        }
    }
    
    // STEP 3: POSITIVE MEDICAL IDENTIFICATION (trust Google's medical tags)
    
    // Priority 1: CLINIC/CLINIQUE by name
    // Important: We check this FIRST because many private clinics are tagged as 'hospital' or 'doctor' by Google.
    if (nameLower.includes('clinique') || nameLower.includes('clinic') ||
        nameLower.includes('polyclinique') || 
        (nameLower.includes('centre') && (nameLower.includes('médical') || nameLower.includes('santé')))) {
        return 'clinic';
    }

    // Priority 2: Hospital (trust Google)
    if (types.includes('hospital')) return 'hospital';
    
    // Priority 3: Pharmacy - Trust Google but exclude drogueries
    if (types.includes('pharmacy') || types.includes('drugstore')) {
        // Only exclude if the NAME clearly indicates it's a hardware store (droguerie)
        if (nameLower.includes('droguerie') || nameLower.includes('quincaillerie')) {
            return 'other';
        }
        return 'pharmacy';
    }
    
    // Priority 4: Pharmacy by name (explicit pharmacy keywords)
    if (nameLower.includes('pharmacie') || nameLower.includes('pharmacy') || nameLower.includes('صيدلية')) {
        return 'pharmacy';
    }
    
    // Priority 5: Laboratory
    if (nameLower.includes('laboratoire') || nameLower.includes('laboratory') || 
        nameLower.includes('analyse') || nameLower.includes('lab ')) {
        return 'laboratory';
    }
    
    // Priority 6: Doctors/Dentists (trust Google)
    if (types.includes('doctor') || types.includes('dentist')) {
        // Only exclude if name suggests non-medical
        if (nameLower.includes('banque') || nameLower.includes('assurance') || 
            nameLower.includes('hôtel') || nameLower.includes('école')) {
            return 'other';
        }
        return 'doctor';
    }
    
    // Priority 7: health/physiotherapist (fallback to doctor)
    if (types.includes('health') || types.includes('physiotherapist')) {
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
    const results: MedicalFacility[] = [];

    data.results
        .filter((place: any) => {
            return place.geometry && place.geometry.location;
        })
        .forEach((place: any) => {
            const lat = place.geometry.location.lat;
            const lng = place.geometry.location.lng;
            const distance = calculateDistance(point.lat, point.lng, lat, lng);
            const types = place.types || [];
            const placeName = place.name || '';
            const placeAddress = place.vicinity || '';
            const placeType = parseGooglePlaceType(types, placeName, placeAddress);
            const specialty = determineSpecialty(types, placeName);

            // Fuzzy DUPLICATE DETECTION:
            // Check if we already have a similar facility within a very small radius (30 meters)
            const isDuplicate = results.some(existing => {
                const samePos = calculateDistance(existing.lat, existing.lng, lat, lng) < 0.03; // 30 meters
                if (samePos) {
                    const normalizeName = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/pharmacie|clinique|dr\.|doctor|medical/g, '').trim();
                    const n1 = normalizeName(existing.name);
                    const n2 = normalizeName(placeName);
                    // If names are very similar, or one is a subset of the other
                    return n1.includes(n2) || n2.includes(n1) || (n1.length > 3 && n2.length > 3 && (n1.startsWith(n2) || n2.startsWith(n1)));
                }
                return false;
            });

            if (isDuplicate) {
                console.log(`🔍 Skipping likely duplicate: "${placeName}" (Matched with existing result nearby)`);
                return;
            }

            results.push({
                id: place.place_id,
                name: placeName || t.results.unnamed,
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
            });
        });

    return results
        .filter((facility) => {
            if (allowedSet.size === 0) return true;
            return allowedSet.has(facility.type as FacilityTypeKey);
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}
