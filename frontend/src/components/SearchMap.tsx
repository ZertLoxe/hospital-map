"use client";
import { useState, useEffect, useMemo } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, CircleF } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DatabaseHospital,
  MedicalFacility,
  FacilityTypeKey,
  getFacilityTypeLabel
} from "@/types/hospital";
import { fetchGooglePlacesWithRetry, parseGooglePlacesResponse } from "@/lib/overpass";
import SearchSidebar from "./search-map/SearchSidebar";
import ResultsPanel, { QuickFilterType } from "./search-map/ResultsPanel";

const containerStyle = {
  width: '100%',
  height: '100%'
};

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
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const itemsPerPage = 8;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

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
      // Convert radius to meters for Google Places API
      const radiusMeters = searchRadius * 1000;
      
      toast.info(t.toast.searchInProgress);
      const result = await fetchGooglePlacesWithRetry(
        point.lat, 
        point.lng, 
        radiusMeters, 
        selectedTypes
      );

      if (!result.success) {
        throw new Error(result.error || "Google Places API request failed");
      }

      const facilities = parseGooglePlacesResponse(result.data as any, point, t);

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
  // Effect to update map bounds when radius changes
  useEffect(() => {
    if (mapInstance && referencePoint && searchRadius > 0) {
      const bounds = new google.maps.LatLngBounds();
      const center = new google.maps.LatLng(referencePoint.lat, referencePoint.lng);
      const radiusMeters = searchRadius * 1000;
      
      // Calculate bounds from center and radius
      const ne = google.maps.geometry.spherical.computeOffset(center, radiusMeters * Math.SQRT2, 45);
      const sw = google.maps.geometry.spherical.computeOffset(center, radiusMeters * Math.SQRT2, 225);
      
      bounds.extend(ne);
      bounds.extend(sw);
      mapInstance.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    } else if (mapInstance && !referencePoint) {
      mapInstance.setCenter({ lat: mapCenter[0], lng: mapCenter[1] });
      mapInstance.setZoom(13);
    }
  }, [mapInstance, referencePoint, searchRadius, mapCenter]);
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

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">Loading Maps...</div>;
  }

  return (
    <div className="relative w-full h-[calc(100vh-80px)] bg-surface-variant">
      {/* Map Container */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        mapContainerClassName="w-full h-full z-0"
        center={{ lat: mapCenter[0], lng: mapCenter[1] }}
        zoom={13}
        onLoad={(map: google.maps.Map) => setMapInstance(map)}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: false,
        }}
      >
        {/* Reference Point Marker */}
        {referencePoint && (
          <>
            <MarkerF 
              position={{ lat: referencePoint.lat, lng: referencePoint.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: getReferencePointColor(referencePoint.status),
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              }}
              onClick={() => setActiveMarker('reference')}
            >
              {activeMarker === 'reference' && (
                <InfoWindowF 
                  position={{ lat: referencePoint.lat, lng: referencePoint.lng }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="flex flex-col gap-2 min-w-50">
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
                </InfoWindowF>
              )}
            </MarkerF>
            <CircleF
              center={{ lat: referencePoint.lat, lng: referencePoint.lng }}
              radius={searchRadius * 1000}
              options={{
                strokeColor: '#006877',
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: '#006877',
                fillOpacity: 0.1,
              }}
            />
          </>
        )}
        {/* Result Markers - USING FILTERED RESULTS HERE */}
        {filteredResults.map((facility) => (
          <MarkerF
            key={facility.id}
            position={{ lat: facility.lat, lng: facility.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: getMarkerColor(),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            }}
            onClick={() => setActiveMarker(facility.id)}
          >
            {activeMarker === facility.id && (
              <InfoWindowF 
                position={{ lat: facility.lat, lng: facility.lng }}
                onCloseClick={() => setActiveMarker(null)}
              >
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
                    href={`https://www.google.com/maps/place/?q=place_id:${facility.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    🔍 View on Google Maps
                  </a>
                </div>
              </div>
              </InfoWindowF>
            )}
          </MarkerF>
        ))}
      </GoogleMap>
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