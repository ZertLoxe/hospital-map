import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    DatabaseHospital,
    FacilityTypeKey,
    FACILITY_TYPE_KEYS,
    getFacilityTypeLabel,
    getHospitalTypeLabel
} from "@/types/hospital";

interface SearchSidebarProps {
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
}

export default function SearchSidebar({
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
}: Readonly<SearchSidebarProps>) {
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
            <button type="button"
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
                            <button type="button"
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
                                                    className={`w-full flex items-center justify-between p-3 border-b border-muted/50 last:border-b-0 hover:bg-primary/5 transition-colors ${selectedHospitalId === String(hospital.id) ? 'bg-primary/10' : ''
                                                        }`}
                                                >
                                                    <button type="button"
                                                        onClick={() => handleHospitalSelect(String(hospital.id))}
                                                        className="flex-1 text-left"
                                                    >
                                                        <div className={`font-medium text-sm ${selectedHospitalId === String(hospital.id) ? 'text-primary' : 'text-foreground'}`}>{hospital.name}</div>
                                                        <div className="text-xs text-muted-foreground">{getHospitalTypeLabel(t, hospital.type)}</div>
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
                                    <span className="text-sm text-foreground">{getFacilityTypeLabel(t, typeKey)}</span>
                                </label>
                            ))}
                        </div>
                        <p className={`text-xs mt-2 ${selectedTypes.length === 0 ? 'text-amber-700 font-medium' : 'text-muted-foreground'}`}>
                            {selectedTypes.length === 0 ? t.search.selectAtLeastOne : `${selectedTypes.length} ${t.search.typesSelected}`}
                        </p>
                    </fieldset>
                    {/* Search Button */}
                    <button type="button"
                        onClick={onSearch}
                        disabled={isLoading || selectedTypes.length === 0}
                        className="w-full py-3 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                     {/* Map Legend */}
                        {/* <div className="mt-6 pt-6 border-t border-muted">
                            <h4 className="text-lg font-semibold text-muted-foreground uppercase mb-3 tracking-wider">{t.search.legend?.title || "Légende"}</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: '#16a34a' }}></span>
                                    <span className="text-sm text-foreground font-medium">{t.search.legend?.active || "Actif"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: '#ea580c' }}></span>
                                    <span className="text-sm text-foreground font-medium">{t.search.legend?.construction || "En Construction"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: '#6b7280' }}></span>
                                    <span className="text-sm text-foreground font-medium">{t.search.legend?.study || "En Étude"}</span>
                                </div>
                            </div>
                        </div> */}
                </div>

            </div>
        </>
    );
}
