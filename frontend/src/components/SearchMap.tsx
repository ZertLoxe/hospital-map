"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { toast } from "sonner";
import { calculateDistance, getPanelWidthClass } from "@/lib/utils";

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
  id: string;
  name: string;
  type: string;
  status: string;
  lat: number;
  lng: number;
  phone?: string;
  address?: string;
  rating?: number;
  is24h: boolean;
}

// Overpass API element type
interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

// Overpass API type mapping
const FACILITY_TYPE_MAP: Record<string, string[]> = {
  "Hopital": ["hospital"],
  "Clinique privée": ["clinic"],
  "Cabinet médical": ["doctors"],
  "Pharmacie": ["pharmacy"],
  "Laboratoire": ["laboratory", "medical_laboratory"],
  "Dentiste": ["dentist"],
};

// Build Overpass API query
function buildOverpassQuery(lat: number, lng: number, radiusMeters: number, types: string[]): string {
  // Map selected types to OSM amenity values
  let amenities: string[] = [];
  
  if (types.length === 0) {
    // If no types selected, search for all medical facilities
    amenities = ["hospital", "clinic", "doctors", "pharmacy", "laboratory", "medical_laboratory", "dentist"];
  } else {
    types.forEach(type => {
      const osmTypes = FACILITY_TYPE_MAP[type];
      if (osmTypes) {
        amenities.push(...osmTypes);
      }
    });
  }
  
  // Build Overpass QL query
  const amenityQuery = amenities.map(a => `node["amenity"="${a}"](around:${radiusMeters},${lat},${lng});`).join("\n");
  const healthcareQuery = amenities.includes("laboratory") || amenities.includes("medical_laboratory") 
    ? `node["healthcare"="laboratory"](around:${radiusMeters},${lat},${lng});` 
    : "";
  
  const query = `
    [out:json][timeout:25];
    (
      ${amenityQuery}
      ${healthcareQuery}
    );
    out body;
    >;
    out skel qt;
  `;
  
  return query;
}

// Parse OSM amenity type to French display name
function parseAmenityType(amenity: string, healthcare?: string): string {
  if (healthcare === "laboratory") return "Laboratoire";
  
  switch (amenity) {
    case "hospital": return "Hopital";
    case "clinic": return "Clinique privée";
    case "doctors": return "Cabinet médical";
    case "pharmacy": return "Pharmacie";
    case "laboratory":
    case "medical_laboratory": return "Laboratoire";
    case "dentist": return "Dentiste";
    default: return amenity || "Établissement médical";
  }
}

// Component to update map view
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
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
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  onSearch: () => void;
  isLoading?: boolean;
  isLoadingHospitals?: boolean;
}>) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const facilityTypes = ["Hopital", "Clinique privée", "Cabinet médical", "Pharmacie", "Laboratoire", "Dentiste"];

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

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
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
        className="absolute left-0 top-1/2 -translate-y-1/2 z-1001 bg-white p-2 rounded-r-lg shadow-lg border border-l-0 border-gray-200 hover:bg-gray-50 transition-all"
      >
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Sidebar Panel */}
      <div className={`absolute left-0 top-0 h-full bg-white shadow-xl z-1000 transition-all duration-300 ${isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
        <div className="p-6 h-full overflow-y-auto">
          


          {/* Hospital Selection Dropdown with Live Search */}
          <div className="mb-4">
            <label htmlFor="hospitalSelect"  className="text-sm font-medium text-foreground mb-2 block">Point de référence</label>
            <div className="relative">
              {/* Dropdown Button */}
              <button
                id="hospitalSelect"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer text-left flex items-center justify-between"
              >
                <span className={selectedHospital ? "text-foreground" : "text-gray-500"}>
                  {isLoadingHospitals 
                    ? "Chargement..." 
                    : selectedHospital 
                      ? selectedHospital.name 
                      : "Choisir un hopital"}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={hospitalSearchQuery}
                        onChange={(e) => setHospitalSearchQuery(e.target.value)}
                        placeholder="Choisir un hôpital, clinique, centre de santé..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Hospital List */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredHospitals.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        {isLoadingHospitals ? "Chargement des établissements..." : "Aucun établissement trouvé"}
                      </div>
                    ) : (
                      filteredHospitals.map((hospital) => (
                        <button
                          key={hospital.id}
                          onClick={() => handleHospitalSelect(hospital.id)}
                          className={`w-full p-3 text-left hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedHospitalId === hospital.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                          }`}
                        >
                          <div className="font-medium text-sm">{hospital.name}</div>
                          <div className="text-xs text-gray-500">{hospital.type}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {!selectedHospital && !isLoadingHospitals && databaseHospitals.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">Sélectionnez un établissement comme point de départ</p>
            )}
          </div>

          {/* Search Radius Slider */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground">
              Rayon de recherche : <span className="text-primary font-bold">{searchRadius} km</span>
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
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>

          {/* Facility Type Filters */}
          <fieldset className="mb-6">
            <legend className="text-sm font-medium text-foreground mb-3 block">Types d&apos;établissements</legend>
            <div className="grid grid-cols-1 gap-2">
              {facilityTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm text-foreground">{type}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedTypes.length === 0 ? "Tous les types seront recherchés" : `${selectedTypes.length} type(s) sélectionné(s)`}
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
                Recherche en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher
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
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = results.slice(startIndex, startIndex + itemsPerPage);

  const exportToCSV = () => {
    const headers = ["Nom", "Type", "Distance (km)", "Téléphone", "Adresse", "Site Web", "Horaires"];
    const rows = results.map(f => [
      f.name || "Sans nom",
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
    link.download = "etablissements_medicaux.csv";
    link.click();
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Fermer le panneau des résultats' : 'Ouvrir le panneau des résultats'}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-1001 bg-white p-2 rounded-l-lg shadow-lg border border-r-0 border-gray-200 hover:bg-gray-50 transition-all"
      >
        <svg className={`w-4 h-4 transition-transform ${isOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Results Panel */}
      <div className={`absolute right-0 top-0 h-full bg-white shadow-xl z-1000 transition-all duration-300 flex flex-col ${getPanelWidthClass(isOpen, isExpanded)}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-bold text-foreground">
            Résultats ({results.length})
          </h3>
          <button
            onClick={onExpandToggle}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" : "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"} />
            </svg>
            {isExpanded ? 'Réduire' : 'Étendre'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isExpanded ? (
            // Expanded Table View
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="pb-2 font-medium">Nom</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Distance</th>
                    <th className="pb-2 font-medium">Téléphone</th>
                    <th className="pb-2 font-medium">Adresse</th>
                    <th className="pb-2 font-medium">Horaires</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((facility) => (
                    <tr key={facility.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium">{facility.name || "Sans nom"}</td>
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
                          Itinéraire
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
                <div key={facility.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary/50 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-foreground text-sm">{facility.name || "Sans nom"}</h4>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs whitespace-nowrap">
                      {facility.type}
                    </span>
                  </div>
                  <p className="text-xs text-primary font-semibold mb-2">📍 {facility.distance?.toFixed(2)} km</p>
                  {facility.address && (
                    <p className="text-xs text-gray-500 mb-1">📮 {facility.address}</p>
                  )}
                  {facility.phone && (
                    <p className="text-xs text-gray-500 mb-1">📞 {facility.phone}</p>
                  )}
                  {facility.openingHours && (
                    <p className="text-xs text-gray-500 mb-2">🕐 {facility.openingHours}</p>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Obtenir l&apos;itinéraire →
                  </a>
                </div>
              ))}
              {paginatedResults.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p>Lancez une recherche pour voir les établissements</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        {results.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            {isExpanded && (
              <>
                <span className="text-sm text-gray-600">
                  {Math.min(startIndex + 1, results.length)}-{Math.min(startIndex + itemsPerPage, results.length)} sur {results.length}
                </span>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90"
                >
                  Exporter CSV
                </button>
              </>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
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
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Database hospitals state
  const [databaseHospitals, setDatabaseHospitals] = useState<DatabaseHospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState("");
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  
  const [searchRadius, setSearchRadius] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  const [referencePoint, setReferencePoint] = useState<{ lat: number; lng: number } | null>(null);
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/hospitals`);
        if (!response.ok) {
          throw new Error("Failed to fetch hospitals");
        }
        const data = await response.json();
        setDatabaseHospitals(data);
      } catch (error) {
        console.error("Error fetching hospitals:", error);
        toast.error("Impossible de charger les établissements");
      } finally {
        setIsLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  // Update reference point when a hospital is selected
  useEffect(() => {
    if (selectedHospitalId) {
      const hospital = databaseHospitals.find(h => h.id === selectedHospitalId);
      if (hospital) {
        const lat = Number(hospital.lat);
        const lng = Number(hospital.lng);
        setReferencePoint({ lat, lng });
        setMapCenter([lat, lng]);
        toast.success(`Point de référence: ${hospital.name}`);
      }
    }
  }, [selectedHospitalId, databaseHospitals]);

  // Search for medical facilities using Overpass API
  const handleSearch = async () => {
    setIsLoading(true);
    
    try {
      const point = referencePoint;
      
      if (!point) {
        toast.error("Veuillez sélectionner un établissement comme point de référence");
        setIsLoading(false);
        return;
      }

      // Convert radius to meters
      const radiusMeters = searchRadius * 1000;
      
      // Build and execute Overpass query
      const query = buildOverpassQuery(point.lat, point.lng, radiusMeters, selectedTypes);
      
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      
      if (!response.ok) {
        throw new Error("Overpass API request failed");
      }
      
      const data = await response.json();
      
      // Parse results
      const facilities: MedicalFacility[] = data.elements
        .filter((el: OverpassElement) => el.type === "node" && el.tags)
        .map((el: OverpassElement) => {
          const tags = el.tags!;
          const distance = calculateDistance(point.lat, point.lng, el.lat, el.lon);
          
          return {
            id: String(el.id),
            name: tags.name || tags["name:fr"] || tags["name:ar"] || null,
            type: parseAmenityType(tags.amenity, tags.healthcare),
            lat: el.lat,
            lng: el.lon,
            distance,
            phone: tags.phone || tags["contact:phone"] || null,
            address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
              .filter(Boolean)
              .join(", ") || null,
            website: tags.website || tags["contact:website"] || null,
            openingHours: tags.opening_hours || null,
            wheelchair: tags.wheelchair || null,
            emergency: tags.emergency === "yes",
          };
        })
        .sort((a: MedicalFacility, b: MedicalFacility) => (a.distance || 0) - (b.distance || 0));
      
      setSearchResults(facilities);
      setCurrentPage(1);
      
      if (facilities.length === 0) {
        toast.info("Aucun établissement trouvé dans cette zone");
      } else {
        toast.success(`${facilities.length} établissement(s) trouvé(s) sur OpenStreetMap`);
      }
      
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Erreur lors de la recherche. Réessayez.");
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

  // Different colors for different facility types
  const getMarkerColor = (type: string) => {
    switch (type) {
      case "Hopital": return "#dc2626"; // red
      case "Clinique privée": return "#ea580c"; // orange
      case "Cabinet médical": return "#16a34a"; // green
      case "Pharmacie": return "#2563eb"; // blue
      case "Laboratoire": return "#7c3aed"; // purple
      case "Dentiste": return "#0891b2"; // cyan
      default: return "#6b7280"; // gray
    }
  };

  const referenceIcon = createIcon('#006877');

  return (
    <div className="relative w-full h-[calc(100vh-80px)] bg-surface-variant">
      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <ChangeView center={mapCenter} zoom={13} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Reference Point Marker */}
        {referencePoint && (
          <>
            <Marker position={[referencePoint.lat, referencePoint.lng]} icon={referenceIcon}>
              <Popup>
                <strong>📍 Point de référence</strong>
                <br />
                Votre position de recherche
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
            icon={createIcon(getMarkerColor(facility.type))}
          >
            <Popup>
              <div className="text-sm min-w-48">
                <h4 className="font-bold text-base mb-1">{facility.name || "Sans nom"}</h4>
                <p className="text-primary font-medium mb-2">{facility.type}</p>
                <p className="text-gray-600 mb-1">📍 {facility.distance?.toFixed(2)} km</p>
                {facility.address && <p className="text-gray-600 mb-1">📮 {facility.address}</p>}
                {facility.phone && <p className="text-gray-600 mb-1">📞 {facility.phone}</p>}
                {facility.openingHours && <p className="text-gray-600 mb-2">🕐 {facility.openingHours}</p>}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Obtenir l&apos;itinéraire →
                </a>
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
