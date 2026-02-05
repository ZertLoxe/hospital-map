import { type Translations } from "@/contexts/LanguageContext";

// Types
export interface MedicalFacility {
    id: string;
    name: string;
    type: FacilityTypeKey | 'other';
    lat: number;
    lng: number;
    distance?: number;
    phone?: string;
    address?: string;
    website?: string;
    openingHours?: string;
    wheelchair?: string;
    emergency?: boolean;
    specialty?: string;
}

// Hospital from database type
export interface DatabaseHospital {
    id: string | number;
    name: string;
    type: string;
    status: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

// Overpass API element type
export interface OverpassElement {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number }; // For way elements
    tags?: Record<string, string>;
}

// Facility type mapping - internal keys for UI filtering
export const FACILITY_TYPE_KEYS = ["hospital", "clinic", "doctor", "pharmacy", "laboratory"] as const;
export type FacilityTypeKey = typeof FACILITY_TYPE_KEYS[number];

export const FACILITY_TYPE_MAP: Record<FacilityTypeKey, string[]> = {
    "hospital": ["hospital"],
    "clinic": ["clinic"],
    "doctor": ["doctors", "dentist"],
    "pharmacy": ["pharmacy"],
    "laboratory": ["laboratory", "medical_laboratory"],
};

// Type-guard for FacilityTypeKey and safe label helper
export const isFacilityTypeKey = (val: unknown): val is FacilityTypeKey => {
    return FACILITY_TYPE_KEYS.includes(val as FacilityTypeKey);
};

export const getFacilityTypeLabel = (
    t: Translations,
    rawType: FacilityTypeKey | 'other' | string | undefined
): string => {
    return isFacilityTypeKey(rawType) ? t.facilityTypes[rawType] : (rawType ?? '');
};

export const getHospitalTypeLabel = (t: Translations, type: string) => {
    const map: Record<string, string> = {
        "Générale": t.details?.general || "Générale",
        "Spécialisée": t.details?.specialized || "Spécialisée",
        "Clinique Multidisciplinaire": t.details?.multidisciplinary || "Clinique Multidisciplinaire",
        "Clinique d’Oncologie": t.details?.oncology || "Clinique d’Oncologie",
        "Clinique de Beauté et d’Esthétique": t.details?.beauty || "Clinique de Beauté et d’Esthétique",
        "Clinique Néphrologique": t.details?.nephrology || "Clinique Néphrologique",
        "Clinique d’Ophtalmologie": t.details?.ophthalmology || "Clinique d’Ophtalmologie",
        "Universitaire": t.details?.university || "Universitaire",
    };
    return map[type] || type;
};

export const SPECIALTY_MAPPING: Record<string, string> = {
    'general': 'Médecine Générale',
    'general_practice': 'Médecine Générale',
    'cardiology': 'Cardiologie',
    'pediatrics': 'Pédiatrie',
    'paediatrics': 'Pédiatrie',
    'gynaecology': 'Gynécologie',
    'gynecology': 'Gynécologie',
    'dermatology': 'Dermatologie',
    'ophthalmology': 'Ophtalmologie',
    'neurology': 'Neurologie',
    'psychiatry': 'Psychiatrie',
    'dentist': 'Dentiste',
    'orthodontics': 'Orthodontie',
    'surgery': 'Chirurgie',
    'radiology': 'Radiologie',
    'physiotherapy': 'Kinésithérapie',
    "ent": "ORL",
    "otolaryngology": "ORL",
    "gastroenterology": "Gastro-entérologie",
    "urology": "Urologie",
    "nephrology": "Néphrologie",
    "pulmonology": "Pneumologie",
    "rheumatology": "Rhumatologie",
    "oncology": "Oncologie",
    "psychotherapy": 'Psychothérapie',
    "podiatry": "Podologie",
    "analysis": "Analyses Médicales",
};

export const normalizeSpecialty = (raw: string): string => {
    const clean = raw.toLowerCase().trim();
    if (SPECIALTY_MAPPING[clean]) return SPECIALTY_MAPPING[clean];
    return clean.charAt(0).toUpperCase() + clean.slice(1);
};
