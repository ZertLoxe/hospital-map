"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("@/components/MapClient"), { ssr: false });

// --- Location Search Component from AddHospitalForm ---
// Map and search are provided by client-only `MapClient` component (dynamically loaded)

// --- Map Click Handler ---
// Note: `ChangeView` and other map helpers live inside the client component when needed.

// Interface for Hospital data
interface Hospital {
  id: string | number;
  name: string;
  type: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
  };
  created_at?: string;
  updated_at?: string;
}

export default function HospitalDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    status: "",
    lat: 0,
    lng: 0,
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5731, -7.5898]); // Default center

  // Fetch hospital data
  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const response = await fetch(`/api/hospitals/${id}`);
        if (!response.ok) {
          throw new Error("Hospital not found");
        }
        const data = await response.json();
        setHospital(data);
        setFormData({
            name: data.name,
            type: data.type,
            status: data.status,
            lat: data.location.latitude,
            lng: data.location.longitude,
        });
        setMapCenter([data.location.latitude, data.location.longitude]);
      } catch {
        toast.error("Error loading hospital details");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHospital();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/hospitals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Update failed");

      const updatedHospital = await response.json();
      setHospital(updatedHospital.data);
      setIsEditing(false);
      toast.success(t.edit?.success || "Mise à jour réussie");
    } catch (error) {
      console.error(error);
      toast.error(t.edit?.error || "Erreur de mise à jour");
    }
  };

  const updateLocation = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, lat, lng }));
    setMapCenter([lat, lng]);
  };

  const handleDelete = async () => {
    if (!confirm(t.delete?.confirm || "Êtes-vous sûr de vouloir supprimer cet établissement ?")) return;
    
    try {
      const response = await fetch(`/api/hospitals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      toast.success(t.delete?.success || "Suppression réussie");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error(t.delete?.error || "Erreur de suppression");
    }
  };

  // Marker/rendering icons handled inside client map component to avoid server imports

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!hospital) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto rounded-lg shadow-lg bg-surface border border-muted overflow-hidden">
        
          <div className="bg-primary/5 p-6 border-b border-muted flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">
                {isEditing ? (t.edit?.title || "Modifier l'établissement") : hospital.name}
            </h1>
            <div className="flex gap-2">
                {!isEditing && (
                    <>
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            {t.details?.edit || "Modifier"}
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="bg-error text-on-primary px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            {t.details?.delete || "Supprimer"}
                        </button>
                    </>
                )}
            </div>
          </div>

          <div className="p-6">
            {isEditing ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* LEFT: INTERACTIVE MAP (Similar to Add Page) */}
                    <div className="w-full h-80 lg:h-full relative rounded-xl overflow-hidden border border-muted shadow-sm">
                      <MapClient
                        center={mapCenter}
                        zoom={15}
                        className="h-full w-full z-0"
                        showSearch
                        onSelectLocation={(loc) => updateLocation(loc.lat, loc.lng)}
                        onMapClick={(lat, lng) => updateLocation(lat, lng)}
                        markers={[{ position: [formData.lat, formData.lng], popup: t.addHospital?.futureLocation || "Nouvel emplacement" }]}
                      />

                      <div className="absolute bottom-4 left-4 right-4 bg-surface/80 backdrop-blur-sm rounded-lg p-2 z-1000 text-center text-xs text-muted-foreground border border-muted shadow-sm">
                        {t.addHospital?.searchOrClick || "Cliquez sur la carte"}
                      </div>
                    </div>

                    {/* RIGHT: FORM */}
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">{t.form?.hospitalName || "Nom de l'établissement"}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">{t.form?.type || "Type"}</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    <option value="Générale">{t.details?.general || "Générale"}</option>
                                    <option value="Spécialisée">{t.details?.specialized || "Spécialisée"}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">{t.form?.status || "Statut"}</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    <option value="Active">{t.details?.active || "Actif"}</option>
                                    <option value="Étude">{t.details?.study || "En Étude"}</option>
                                    <option value="Construction">{t.details?.construction || "En Construction"}</option>
                                </select>
                            </div>
                             {/* COORDINATES (Read-onlyish but editable) */}
                             <div className={`p-3 rounded-lg border transition-all ${formData.lat ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-muted'}`}>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">{t.addHospital?.coordinates || "Coordonnées"}</span>
                                <div className="grid grid-cols-2 gap-2">
                                     <div>
                                        <label className="block text-xs text-muted-foreground mb-1">LAT</label>
                                        <input
                                            type="number"
                                            step="any"
                                            name="lat"
                                            value={formData.lat}
                                            onChange={handleChange}
                                            className="w-full px-2 py-1 text-sm border border-muted rounded bg-background"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1">LNG</label>
                                        <input
                                            type="number"
                                            step="any"
                                            name="lng"
                                            value={formData.lng}
                                            onChange={handleChange}
                                            className="w-full px-2 py-1 text-sm border border-muted rounded bg-background"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 border border-muted rounded-lg hover:bg-muted transition-colors text-foreground cursor-pointer"
                            >
                                {t.details?.cancel || "Annuler"}
                            </button>
                            <button
                                type="submit"
                                className="bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                            >
                                {t.details?.save || "Enregistrer"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="bg-surface-variant p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t.details?.info || "Informations"}</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-muted pb-2 last:border-0">
                                    <span className="text-muted-foreground">{t.form?.type || "Type"}</span>
                                    <span className="font-medium text-foreground">{hospital.type}</span>
                                </div>
                                <div className="flex justify-between border-b border-muted pb-2 last:border-0">
                                    <span className="text-muted-foreground">{t.form?.status || "Statut"}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        hospital.status === 'Active' ? 'bg-green-100 text-green-800' :
                                        hospital.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {hospital.status}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-muted pb-2 last:border-0">
                                    <span className="text-muted-foreground">ID</span>
                                    <span className="font-mono text-sm text-foreground">{hospital.id}</span>
                                </div>
                                <div className="flex justify-between border-b border-muted pb-2 last:border-0">
                                    <span className="text-muted-foreground">{t.details?.created || "Créé le"}</span>
                                    <span className="text-sm text-foreground">{new Date(hospital.created_at || "").toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                         <div className="bg-surface-variant p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t.details?.location || "Localisation"}</h3>
                            <div className="space-y-3">
                                 <div className="flex justify-between border-b border-muted pb-2 last:border-0">
                                    <span className="text-muted-foreground">Latitude</span>
                                    <span className="font-mono text-sm text-foreground">{hospital.location.latitude}</span>
                                </div>
                                <div className="flex justify-between border-b border-muted pb-2 last:border-0">
                                    <span className="text-muted-foreground">Longitude</span>
                                    <span className="font-mono text-sm text-foreground">{hospital.location.longitude}</span>
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="h-[400px] rounded-lg overflow-hidden border border-muted z-0">
                      <MapClient
                        center={[hospital.location.latitude, hospital.location.longitude]}
                        zoom={15}
                        className="w-full h-full"
                        markers={[{ position: [hospital.location.latitude, hospital.location.longitude], popup: <strong>{hospital.name}</strong> }]}
                      />
                    </div>
                </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-muted">
                <button
                    onClick={() => router.push("/search")}
                    className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    {t.details?.back || "Retour à la carte"}
                </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
