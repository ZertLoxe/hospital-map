"use client";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { toast } from "sonner";
import { calculateDistance, getPanelWidthClass } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
// Types
interface MedicalFacility {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  distance?: number;
  phone?: string;
  address?: string;
  website?: string;
  openingHours?: string;
  wheelchair?: string;
  emergency?: boolean;
}
// Hospital from database type
interface DatabaseHospital {
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
interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number }; // For way elements
  tags?: Record<string, string>;
}
// Overpass API type mapping - keys are internal, values are OSM amenity types
const FACILITY_TYPE_KEYS = ["hospital", "clinic", "doctor", "pharmacy", "laboratory"] as const;
type FacilityTypeKey = typeof FACILITY_TYPE_KEYS[number];

const FACILITY_TYPE_MAP: Record<FacilityTypeKey, string[]> = {
  "hospital": ["hospital"],
  "clinic": ["clinic"],
  "doctor": ["doctors", "dentist"],
  "pharmacy": ["pharmacy"],
  "laboratory": ["laboratory", "medical_laboratory"],
};

// Overpass API endpoints (multiple mirrors for reliability)
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// Fetch with retry logic across multiple endpoints
async function fetchOverpassWithRetry(
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
function buildOverpassQuery(lat: number, lng: number, radiusMeters: number, types: FacilityTypeKey[]): string {
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
function parseAmenityType(amenity: string, healthcare?: string): string {
  if (healthcare === "laboratory") return "Laboratoire";
  switch (amenity) {
    case "hospital": return "Hôpital";
    case "clinic": return "Clinique privée";
    case "doctors":
    case "dentist": return "Cabinet médical";
    case "pharmacy": return "Pharmacie";
    case "laboratory":
    case "medical_laboratory": return "Laboratoire";
    default: return "Établissement médical";
  }
}
// Component to update map view
function ChangeView({ center, zoom = 13, radius = 0 }: { center: [number, number]; zoom?: number; radius?: number }) {
  const map = useMap();
  useEffect(() => {
    if (radius > 0) {
      const delta_lat = (radius * 1000) / 111000;
      const delta_lng = delta_lat / Math.cos(center[0] * Math.PI / 180);
      const bounds: [[number, number], [number, number]] = [
        [center[0] - delta_lat, center[1] - delta_lng],
        [center[0] + delta_lat, center[1] + delta_lng]
      ];
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, radius, map]);
  return null;
}
// Left Sidebar with search filters
function SearchSidebar({
  isOpen,
  onToggle,
  databaseHospitals,
  selectedHospitalId,
  setSelectedHospitalId,
  hospitalSearchQuery,
  setHospitalSearchQuery,
  searchRadius,
  setSearchRadius,
  selectedTypes,
  setSelectedTypes,
  onSearch,
  isLoading,
  isLoadingHospitals,
}: Readonly<{
  isOpen: boolean;
  onToggle: () => void;
  databaseHospitals: DatabaseHospital[];
  selectedHospitalId: string;
  setSelectedHospitalId: (id: string) => void;
  hospitalSearchQuery: string;
  setHospitalSearchQuery: (query: string) => void;
  searchRadius: number;
  setSearchRadius: (radius: number) => void;
  selectedTypes: FacilityTypeKey[];
  setSelectedTypes: (types: FacilityTypeKey[]) => void;
  onSearch: () => void;
  isLoading?: boolean;
  isLoadingHospitals?: boolean;
}>) {
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Filter hospitals based on search query
  const filteredHospitals = databaseHospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(hospitalSearchQuery.toLowerCase()) ||
    hospital.type.toLowerCase().includes(hospitalSearchQuery.toLowerCase())
  );
  // Get selected hospital name
  const selectedHospital = databaseHospitals.find(h => h.id === selectedHospitalId);
  const handleHospitalSelect = (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
    setIsDropdownOpen(false);
    setHospitalSearchQuery("");
  };
  const handleTypeToggle = (type: FacilityTypeKey) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(tk => tk !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Fermer le panneau de recherche' : 'Ouvrir le panneau de recherche'}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-1001 bg-surface p-2 rounded-r-lg shadow-lg border border-l-0 border-muted hover:bg-muted transition-all"
      >
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {/* Sidebar Panel */}
      <div className={`absolute left-0 top-0 h-full bg-surface shadow-xl z-1000 transition-all duration-300 ${isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
        <div className="p-6 h-full overflow-y-auto">
          {/* Hospital Selection Dropdown with Live Search */}
          <div className="mb-4">
            <label htmlFor="hospitalSelect" className="text-sm font-medium text-foreground mb-2 block">{t.search.title}</label>
            <div className="relative">
              {/* Dropdown Button */}
              <button
                id="hospitalSelect"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-3 border border-muted rounded-lg bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer text-left flex items-center justify-between"
              >
                <span className={selectedHospital ? "text-foreground" : "text-muted-foreground"}>
                  {isLoadingHospitals
                    ? t.search.loading
                    : selectedHospital
                      ? selectedHospital.name
                      : t.search.chooseHospital}
                </span>
                <svg
                  className={`w-5 h-5 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Dropdown Content */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-muted rounded-lg shadow-lg z-50 max-h-72 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-2 border-b border-muted">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={hospitalSearchQuery}
                        onChange={(e) => setHospitalSearchQuery(e.target.value)}
                        placeholder={t.search.placeholder}
                        className="w-full pl-9 pr-3 py-2 border border-muted rounded-lg bg-surface text-foreground focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  {/* Hospital List */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredHospitals.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        {isLoadingHospitals ? t.search.loadingFacilities : t.search.noResults}
                      </div>
                    ) : (
                      filteredHospitals.map((hospital) => (
                        <div
                          key={hospital.id}
                          className={`w-full flex items-center justify-between p-3 border-b border-muted/50 last:border-b-0 hover:bg-primary/5 transition-colors ${
                            selectedHospitalId === String(hospital.id) ? 'bg-primary/10' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleHospitalSelect(String(hospital.id))}
                            className="flex-1 text-left"
                          >
                            <div className={`font-medium text-sm ${selectedHospitalId === String(hospital.id) ? 'text-primary' : 'text-foreground'}`}>{hospital.name}</div>
                            <div className="text-xs text-muted-foreground">{hospital.type}</div>
                          </button>
                          
                          <a 
                            href={`/hospital/${hospital.id}`}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors bg-surface border border-muted rounded-full ml-2 shadow-sm"
                            title="Gérer l'établissement"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {!selectedHospital && !isLoadingHospitals && databaseHospitals.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{t.search.selectFacility}</p>
            )}
          </div>
          {/* Search Radius Slider */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground">
              {t.search.radius} : <span className="text-primary font-bold">{searchRadius} km</span>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              aria-label="Rayon de recherche en kilomètres"
              className="w-full mt-2 accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>
          {/* Facility Type Filters */}
          <fieldset className="mb-6">
            <legend className="text-sm font-medium text-foreground mb-3 block">{t.search.facilityTypes}</legend>
            <div className="grid grid-cols-1 gap-2">
              {FACILITY_TYPE_KEYS.map((typeKey) => (
                <label key={typeKey} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(typeKey)}
                    onChange={() => handleTypeToggle(typeKey)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm text-foreground">{t.facilityTypes[typeKey]}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedTypes.length === 0 ? t.search.allTypes : `${selectedTypes.length} ${t.search.typesSelected}`}
            </p>
          </fieldset>
          {/* Search Button */}
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.search.searching}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t.search.searchButton}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
// Right Results Panel
function ResultsPanel({
  isOpen,
  onToggle,
  isExpanded,
  onExpandToggle,
  results,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}: Readonly<{
  isOpen: boolean;
  onToggle: () => void;
  isExpanded: boolean;
  onExpandToggle: () => void;
  results: MedicalFacility[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
}>) {
  const { t } = useLanguage();
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = results.slice(startIndex, startIndex + itemsPerPage);
  const exportToCSV = () => {
    const headers = [t.results.name, t.results.type, `${t.results.distance} (km)`, t.results.phone, t.results.address, "Site Web", t.results.hours];
    const rows = results.map(f => [
      f.name || t.results.unnamed,
      f.type,
      f.distance?.toFixed(2) || "-",
      f.phone || "-",
      f.address || "-",
      f.website || "-",
      f.openingHours || "-"
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "medical_facilities.csv";
    link.click();
  };
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Fermer le panneau des résultats' : 'Ouvrir le panneau des résultats'}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-1001 bg-surface p-2 rounded-l-lg shadow-lg border border-r-0 border-muted hover:bg-muted transition-all"
      >
        <svg className={`w-4 h-4 transition-transform ${isOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {/* Results Panel */}
      <div className={`absolute right-0 top-0 h-full bg-surface shadow-xl z-1000 transition-all duration-300 flex flex-col ${getPanelWidthClass(isOpen, isExpanded)}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h3 className="font-bold text-foreground">
            {t.results.title} ({results.length})
          </h3>
          <button
            onClick={onExpandToggle}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" : "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"} />
            </svg>
            {isExpanded ? t.results.reduce : t.results.expand}
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isExpanded ? (
            // Expanded Table View
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-muted">
                    <th className="pb-2 font-medium">{t.results.name}</th>
                    <th className="pb-2 font-medium">{t.results.type}</th>
                    <th className="pb-2 font-medium">{t.results.distance}</th>
                    <th className="pb-2 font-medium">{t.results.phone}</th>
                    <th className="pb-2 font-medium">{t.results.address}</th>
                    <th className="pb-2 font-medium">{t.results.hours}</th>
                    <th className="pb-2 font-medium">{t.results.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((facility) => (
                    <tr key={facility.id} className="border-b border-muted/50 hover:bg-muted/50">
                      <td className="py-3 font-medium">{facility.name || t.results.unnamed}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                          {facility.type}
                        </span>
                      </td>
                      <td className="py-3">{facility.distance?.toFixed(2)} km</td>
                      <td className="py-3">{facility.phone || "-"}</td>
                      <td className="py-3 max-w-48 truncate">{facility.address || "-"}</td>
                      <td className="py-3 max-w-32 truncate text-xs">{facility.openingHours || "-"}</td>
                      <td className="py-3">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          {t.results.directionsShort}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Compact Card View
            <div className="space-y-3">
              {paginatedResults.map((facility) => (
                <div key={facility.id} className="p-4 border border-muted rounded-lg bg-surface hover:border-primary/50 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-foreground text-sm leading-tight">
                      {facility.name}
                      {facility.name === t.results.unnamed && (
                        <span className="text-orange-500 text-xs ml-1" title="Incomplete data">⚠️</span>
                      )}
                    </h4>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs whitespace-nowrap">
                      {facility.type}
                    </span>
                  </div>
                  <p className="text-xs text-primary font-semibold mb-2">📍 {facility.distance?.toFixed(2)} km</p>
                  {facility.address ? (
                    <p className="text-[11px] text-muted-foreground mb-1 italic">🏠 {facility.address}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 mb-1">{t.results.addressNotProvided}</p>
                  )}
                  {facility.phone ? (
                    <p className="text-[11px] text-muted-foreground mb-1">📞 {facility.phone}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 mb-1">{t.results.phoneNotProvided}</p>
                  )}
                  {facility.openingHours && (
                    <p className="text-xs text-muted-foreground mb-2">🕐 {facility.openingHours}</p>
                  )}
                  <div className="flex gap-3 mt-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      {t.results.directions}
                    </a>
                    <a
                      href={`https://www.openstreetmap.org/node/${facility.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-secondary hover:underline"
                    >
                      🔍 {t.results.verify}
                    </a>
                  </div>
                </div>
              ))}
              {paginatedResults.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p>{t.results.noResults}</p>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Footer with Pagination */}
        {results.length > 0 && (
          <div className="p-4 border-t border-muted flex items-center justify-between">
            {isExpanded && (
              <>
                <span className="text-sm text-muted-foreground">
                  {Math.min(startIndex + 1, results.length)}-{Math.min(startIndex + itemsPerPage, results.length)} {t.results.of} {results.length}
                </span>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90"
                >
                  {t.results.exportCSV}
                </button>
              </>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.results.previous}
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 bg-inverse-surface text-inverse-on-surface text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.results.next}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
// Main SearchMap Component
export default function SearchMap() {
  const { t } = useLanguage();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  // Database hospitals state
  const [databaseHospitals, setDatabaseHospitals] = useState<DatabaseHospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState("");
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [searchRadius, setSearchRadius] = useState(1); // Default to 1 km
  const [selectedTypes, setSelectedTypes] = useState<FacilityTypeKey[]>([]);
  const [referencePoint, setReferencePoint] = useState<{ lat: number; lng: number; status: string; id: string | number; name: string } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5731, -7.5898]);
  const [searchResults, setSearchResults] = useState<MedicalFacility[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 8;
  // Fetch hospitals from database on mount
  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoadingHospitals(true);
      try {
        // Use relative path - will be proxied through Next.js API routes
        const response = await fetch('/api/hospitals');
        if (!response.ok) {
          throw new Error("Failed to fetch hospitals");
        }
        const data = await response.json();
        setDatabaseHospitals(data);
      } catch (error) {
        console.error("Error fetching hospitals:", error);
        toast.error(t.toast.loadError);
      } finally {
        setIsLoadingHospitals(false);
      }
    };
    fetchHospitals();
  }, [t.toast.loadError]);
  // Update reference point when a hospital is selected
  useEffect(() => {
    if (selectedHospitalId) {
      const hospital = databaseHospitals.find(h => h.id == selectedHospitalId);
      if (hospital) {
        const lat = Number(hospital.location.latitude);
        const lng = Number(hospital.location.longitude);
        setReferencePoint({ lat, lng, status: hospital.status, id: hospital.id, name: hospital.name });
        setMapCenter([lat, lng]);
        toast.success(`${t.toast.referencePoint}: ${hospital.name}`);
      }
    }
  }, [selectedHospitalId, databaseHospitals, t]);
  // Search for medical facilities using Overpass API
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const point = referencePoint;
      if (!point) {
        toast.error(t.toast.selectFacility);
        setIsLoading(false);
        return;
      }
      // Convert radius to meters for Overpass API (Overpass expects meters)
      const radiusMeters = searchRadius * 1000;
      // Build and execute Overpass query
      const query = buildOverpassQuery(point.lat, point.lng, radiusMeters, selectedTypes);
      
      toast.info(t.toast.searchInProgress);
      const result = await fetchOverpassWithRetry(query);
      
      if (!result.success) {
        throw new Error(result.error || "Overpass API request failed");
      }
      
      const data = result.data as { elements: OverpassElement[] };
      // Parse results - filter elements that have tags and valid coordinates
      const facilities: MedicalFacility[] = data.elements
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
          };
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setSearchResults(facilities);
      setCurrentPage(1);
      if (facilities.length === 0) {
        toast.info(t.toast.noFacilitiesFound);
      } else {
        toast.success(`${facilities.length} ${t.toast.facilitiesFound}`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(t.toast.searchError);
    } finally {
      setIsLoading(false);
    }
  };
  // Create custom marker icons
  const createIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };
  // Different colors for different facility types (all blue for external facilities)
  const getMarkerColor = () => {
    return "#2563eb"; // blue for all facilities
  };

  // Get reference point color based on hospital status
  const getReferencePointColor = (status: string) => {
    switch (status) {
      case "Active": return "#16a34a"; // green
      case "En construction": return "#ea580c"; // orange
      case "En étude": return "#6b7280"; // gray
      default: return "#16a34a"; // green as default
    }
  };
  const referenceIcon = referencePoint ? createIcon(getReferencePointColor(referencePoint.status)) : createIcon('#16a34a');
  return (
    <div className="relative w-full h-[calc(100vh-80px)] bg-surface-variant">
      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <ChangeView center={mapCenter} zoom={13} radius={referencePoint ? searchRadius : 0} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {/* Reference Point Marker */}
        {referencePoint && (
          <>
            <Marker position={[referencePoint.lat, referencePoint.lng]} icon={referenceIcon}>
              <Popup>
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <strong>📍 {t.map.referencePoint}</strong>
                    </div>
                    <div className="text-sm font-medium border-b border-gray-200 pb-1 mb-1">{referencePoint.name}</div>
                  </div>
                  
                  <a 
                    href={`/hospital/${referencePoint.id}`} 
                    className="flex items-center justify-center gap-2 text-xs bg-primary text-white px-3 py-2 rounded hover:bg-primary/90 transition-colors w-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{t.map.manage || "Gérer cet établissement"}</span>
                  </a>

                  <div className="text-xs text-muted-foreground mt-1">
                    {t.map.yourSearchPosition}
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[referencePoint.lat, referencePoint.lng]}
              radius={searchRadius * 1000}
              pathOptions={{ color: '#006877', fillColor: '#006877', fillOpacity: 0.1, weight: 2 }}
            />
          </>
        )}
        {/* Result Markers */}
        {searchResults.map((facility) => (
          <Marker
            key={facility.id}
            position={[facility.lat, facility.lng]}
            icon={createIcon(getMarkerColor())}
          >
            <Popup>
              <div className="text-sm min-w-48">
                <h4 className="font-bold text-base mb-1">
                  {facility.name}
                  {facility.name === t.results.unnamed && (
                    <span className="text-orange-500 text-xs ml-1" title="Incomplete data">⚠️</span>
                  )}
                </h4>
                <p className="text-primary font-medium mb-2">{facility.type}</p>
                <p className="text-gray-600 mb-1">📍 {facility.distance?.toFixed(2)} km</p>
                {facility.address ? (
                  <p className="text-gray-600 mb-1">📮 {facility.address}</p>
                ) : (
                  <p className="text-gray-400 mb-1 italic">📮 {t.results.addressNotProvided}</p>
                )}
                {facility.phone && <p className="text-gray-600 mb-1">📞 {facility.phone}</p>}
                {facility.openingHours && <p className="text-gray-600 mb-2">🕐 {facility.openingHours}</p>}
                <div className="flex flex-col gap-1 mt-2 pt-2 border-t">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    🚗 {t.map.getDirections}
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/node/${facility.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    🔍 {t.map.verifyOnOSM}
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {/* Left Sidebar */}
      <SearchSidebar
        isOpen={leftSidebarOpen}
        onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
        databaseHospitals={databaseHospitals}
        selectedHospitalId={selectedHospitalId}
        setSelectedHospitalId={setSelectedHospitalId}
        hospitalSearchQuery={hospitalSearchQuery}
        setHospitalSearchQuery={setHospitalSearchQuery}
        searchRadius={searchRadius}
        setSearchRadius={setSearchRadius}
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        onSearch={handleSearch}
        isLoading={isLoading}
        isLoadingHospitals={isLoadingHospitals}
      />
      {/* Right Results Panel */}
      <ResultsPanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
        isExpanded={isExpanded}
        onExpandToggle={() => setIsExpanded(!isExpanded)}
        results={searchResults}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}