"use client";
import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DatabaseHospital,
  MedicalFacility,
  FacilityTypeKey,
  getFacilityTypeLabel
} from "@/types/hospital";
import { buildOverpassQuery, fetchOverpassWithRetry, parseOverpassResponse } from "@/lib/overpass";
import SearchSidebar from "./search-map/SearchSidebar";
import ResultsPanel, { QuickFilterType } from "./search-map/ResultsPanel"; // Import new type

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

  // --- LIFTED STATE FROM RESULTS PANEL ---
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // --- FILTERING LOGIC ---
  // Extract available specialties dynamically
  const availableSpecialties = useMemo(() => {
    const doctors = searchResults.filter(r => r.type === 'doctor');
    const specialties = new Set<string>();
    doctors.forEach(r => {
      if (r.specialty) specialties.add(r.specialty);
    });
    return Array.from(specialties).sort();
  }, [searchResults]);

  const showSpecialtyDropdown = searchResults.some(r => r.type === 'doctor') && quickFilter === 'doctor';

  // Dynamic filter list based on user selection
  const filterOptions = useMemo(() => {
    // If no types selected, show all default types
    if (selectedTypes.length === 0) return ['all', 'hospital', 'clinic', 'doctor', 'pharmacy', 'laboratory'] as const;
    return ['all', ...selectedTypes] as const;
  }, [selectedTypes]);

  // The Master Filtered List - Used by BOTH Map and ResultsPanel
  const filteredResults = useMemo(() => {
    return searchResults.filter(result => {
      // 1. Filter by text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = result.name?.toLowerCase().includes(query);
        const addressMatch = result.address?.toLowerCase().includes(query);
        const rawType = result.type;
        const typeLabel = getFacilityTypeLabel(t, rawType);
        const typeMatch = typeLabel.toLowerCase().includes(query) || (rawType?.toLowerCase().includes(query));

        if (!nameMatch && !addressMatch && !typeMatch) return false;
      }

      // 2. Filter by category
      if (quickFilter !== 'all' && result.type !== quickFilter) return false;

      // 3. Filter by Specialty (only affects doctors when a specialty is selected)
      if (selectedSpecialty !== 'all' && result.type === 'doctor') {
        return result.specialty === selectedSpecialty;
      }

      return true;
    });
  }, [searchResults, searchQuery, quickFilter, selectedSpecialty, t]);


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

      const facilities = parseOverpassResponse(result.data as any, point, t);

      setSearchResults(facilities);
      setCurrentPage(1);
      // Reset filters on new search to avoid confusion
      setQuickFilter('all');
      setSelectedSpecialty('all');
      setSearchQuery('');

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

  // Map facility type key to badge classes with dark mode support
  const getTypeBadgeClasses = (typeKey: FacilityTypeKey | 'other') => {
    switch (typeKey) {
      case "pharmacy":
        return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "doctor":
      case "clinic":
        return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "hospital":
        return "px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full whitespace-nowrap";
      case "laboratory":
        return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default:
        return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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
                    className="flex items-center justify-center gap-2 text-xs bg-primary text-on-primary px-3 py-2 rounded hover:bg-primary/90 transition-colors w-full"
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
        {/* Result Markers - USING FILTERED RESULTS HERE */}
        {filteredResults.map((facility) => (
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
                <p className="mb-2">
                  <span className={getTypeBadgeClasses(facility.type)}>{getFacilityTypeLabel(t, facility.type) || facility.type}</span>
                </p>
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
      {/* Right Results Panel - PASSING PROPS DOWN */}
      <ResultsPanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
        isExpanded={isExpanded}
        onExpandToggle={() => setIsExpanded(!isExpanded)}
        results={searchResults}
        filteredResults={filteredResults}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setQuickFilter={setQuickFilter}
        quickFilter={quickFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSpecialty={selectedSpecialty}
        setSelectedSpecialty={setSelectedSpecialty}
        availableSpecialties={availableSpecialties}
        showSpecialtyDropdown={showSpecialtyDropdown}
        filterOptions={filterOptions}
      />
    </div>
  );
}