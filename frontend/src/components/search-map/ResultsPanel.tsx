import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPanelWidthClass } from "@/lib/utils";
import {
    MedicalFacility,
    FacilityTypeKey,
    getFacilityTypeLabel
} from "@/types/hospital";

export type QuickFilterType = 'all' | 'hospital' | 'clinic' | 'doctor' | 'pharmacy' | 'laboratory';

interface ResultsPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    isExpanded: boolean;
    onExpandToggle: () => void;
    results: MedicalFacility[]; // Raw results (kept if needed, but we use filtered mostly)
    filteredResults: MedicalFacility[]; // The filtered list to display
    currentPage: number;
    setCurrentPage: (page: number) => void;
    itemsPerPage: number;

    // Lifted State Props
    quickFilter: QuickFilterType;
    setQuickFilter: (f: QuickFilterType) => void;
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    selectedSpecialty: string;
    setSelectedSpecialty: (s: string) => void;

    // Computed Props
    availableSpecialties: string[];
    showSpecialtyDropdown: boolean;
    filterOptions: readonly string[];
}

export default function ResultsPanel({
    isOpen,
    onToggle,
    isExpanded,
    onExpandToggle,
    filteredResults,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    quickFilter,
    setQuickFilter,
    searchQuery,
    setSearchQuery,
    selectedSpecialty,
    setSelectedSpecialty,
    availableSpecialties,
    showSpecialtyDropdown,
    filterOptions,
}: Readonly<ResultsPanelProps>) {
    const { t } = useLanguage();

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

    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

    // Reset page when filter changes - now driven by props change
    useEffect(() => {
        setCurrentPage(1);
    }, [quickFilter, searchQuery, selectedSpecialty, setCurrentPage]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);

    const exportToCSV = () => {
        const headers = [t.results.name, t.results.type, `${t.results.distance} (km)`, t.results.phone, t.results.address, "Site Web", t.results.hours];
        const rows = filteredResults.map(f => [
            f.name || t.results.unnamed,
            getFacilityTypeLabel(t, f.type) || f.type,
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
            <button type="button"
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
                        {t.results.title} ({filteredResults.length})
                    </h3>
                    <button type="button"
                        onClick={onExpandToggle}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" : "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"} />
                        </svg>
                        {isExpanded ? t.results.reduce : t.results.expand}
                    </button>
                </div>
                {/* Text Search */}
                <div className="p-6 pb-2 bg-surface">
                    <div className="relative group">
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.resultsPlaceholder || "Rechercher par nom, spécialité ou adresse..."}
                            className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-muted rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all shadow-sm placeholder:text-muted-foreground/70 text-foreground"
                        />
                    </div>
                </div>
                {/* Quick Filters */}
                <div className="px-6 py-4 border-b border-muted bg-surface flex flex-wrap gap-2 sticky top-0 z-10 backdrop-blur-sm items-center">
                    {/* Helper to render filter buttons */}
                    {filterOptions.map((filterType) => (
                        <button
                            key={filterType}
                            type="button"
                            onClick={() => setQuickFilter(filterType as any)}
                            className={`px-4 py-2 rounded-full border text-xs font-medium transition-colors whitespace-nowrap ${quickFilter === filterType
                                ? 'bg-primary/10 text-primary border-primary'
                                : 'bg-surface text-gray-600 border-muted hover:border-primary hover:bg-primary/5 hover:text-primary'
                                }`}
                        >
                            {t.search.quickFilters[filterType as keyof typeof t.search.quickFilters] || filterType}
                        </button>
                    ))}

                    {showSpecialtyDropdown && (
                        <div className="ml-auto">
                            <select
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value)}
                                className="px-5 py-4 bg-surface-container text-primary font-bold border border-muted rounded-lg text-sm focus:ring-primary/20 outline-none cursor-pointer"
                            >
                                <option value="all">Toutes les spécialités</option>
                                {availableSpecialties.map(specialty => (
                                    <option key={specialty} value={specialty}>
                                        {specialty}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-surface">
                    {isExpanded ? (
                        // Expanded Table View
                        <div className="bg-surface rounded-xl shadow-sm border border-muted overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-variant/30 border-b border-muted">
                                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.results.name}</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.results.type}</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.results.distance}</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.results.phone}</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.results.address}</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spécialité</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.results.hours}</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.results.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/30">
                                    {paginatedResults.map((facility) => (
                                        <tr key={facility.id} className="hover:bg-surface-variant/20 transition-colors">
                                            <td className="px-6 py-5 font-medium text-foreground">{facility.name || t.results.unnamed}</td>
                                            <td className="px-6 py-5">
                                                <span className={getTypeBadgeClasses(facility.type)}>
                                                    {getFacilityTypeLabel(t, facility.type) || facility.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-muted-foreground">{facility.distance?.toFixed(2)} km</td>
                                            <td className="px-6 py-5 text-sm text-muted-foreground whitespace-nowrap">{facility.phone || "-"}</td>
                                            <td className="px-6 py-5 text-sm text-muted-foreground max-w-xs">{facility.address || "-"}</td>
                                            <td className="px-6 py-5 text-sm text-foreground font-medium">{facility.specialty || "-"}</td>
                                            <td className="px-6 py-5 text-sm text-muted-foreground max-w-xs">{facility.openingHours || "-"}</td>
                                            <td className="px-6 py-5">
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-semibold text-primary hover:text-primary/80"
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
                                        <span className={getTypeBadgeClasses(facility.type)}>
                                            {getFacilityTypeLabel(t, facility.type) || facility.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-primary font-semibold mb-2">📍 {facility.distance?.toFixed(2)} km</p>
                                    {facility.address ? (
                                        <p className="text-[11px] text-muted-foreground mb-1 italic">🏠 {facility.address}</p>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground/50 mb-1">{t.results.addressNotProvided}</p>
                                    )}
                                    {facility.specialty && (
                                        <p className="text-xs text-secondary font-medium mb-1">⚕️ {facility.specialty}</p>
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
                {filteredResults.length > 0 && (
                    <div className="p-4 border-t border-muted flex items-center justify-between">
                        {isExpanded && (
                            <>
                                <span className="text-sm text-muted-foreground">
                                    {Math.min(startIndex + 1, filteredResults.length)}-{Math.min(startIndex + itemsPerPage, filteredResults.length)} {t.results.of} {filteredResults.length}
                                </span>
                                <button type="button"
                                    onClick={exportToCSV}
                                    className="ml-4 px-4 py-2 bg-primary text-on-primary text-sm cursor-pointer font-medium rounded-lg hover:bg-primary/90"
                                >
                                    {t.results.exportCSV}
                                </button>
                            </>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <button type="button"
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t.results.previous}
                            </button>
                            <button type="button"
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
