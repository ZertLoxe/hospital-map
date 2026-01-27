"use client";

import { TypeAnimation } from 'react-type-animation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMap, Popup, useMapEvents } from "react-leaflet";
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { toast } from "sonner";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import 'leaflet-geosearch/dist/geosearch.css';
import { hospitalSchema } from "@/lib/validations";
import { useLanguage } from "@/contexts/LanguageContext";

type HospitalFormValues = {
  name: string;
  type: "Générale" | "Spécialisée" | "Clinique Multidisciplinaire" | "Clinique d’Oncologie" | "Clinique de Beauté et d’Esthétique" | "Clinique Néphrologique" | "Clinique d’Ophtalmologie";
  status: "Active" | "En construction" | "En étude";
  lat: number;
  lng: number;
};

// Handles location search in the map
function LocationSearch({ onSelectLocation, placeholder }: { onSelectLocation: (location: { lat: number; lng: number; label: string }) => void; placeholder: string }) {
  const [query, setQuery] = useState('');
  const provider = new OpenStreetMapProvider();
  const { t } = useLanguage();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const results = await provider.search({ query });
      if (results.length > 0) {
        const firstResult = results[0];
        onSelectLocation({ lat: firstResult.y, lng: firstResult.x, label: firstResult.label });
      } else {
        toast.error(t.toast.locationNotFound);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  return (
    <form onSubmit={handleSearch} className="absolute top-4 left-12 bg-surface rounded-lg shadow-xl z-1000 border border-muted overflow-hidden flex">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="p-3 w-64 text-foreground bg-surface placeholder-muted-foreground text-sm focus:outline-none"
        placeholder={placeholder}
      />
      <button type="submit" className="bg-primary text-on-primary px-4 py-2 text-sm font-bold">OK</button>
    </form>
  );
}

// Captures map click events and returns coordinates to the form
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Updates map center view when coordinates change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

// --- MAIN COMPONENT ---
export default function AddHospitalForm() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5731, -7.5898]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  
  // Form setup with validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HospitalFormValues>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: { type: "Générale"},
  });

  // Synchronizes marker position with form coordinates
  const updateLocation = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    setMapCenter([lat, lng]);
    setValue("lat", lat, { shouldValidate: true });
    setValue("lng", lng, { shouldValidate: true });
  };

  const lat = watch("lat");
  const lng = watch("lng");

  // Submits hospital data to backend API
  const onSubmit = async (data: HospitalFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/add/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error();
      
      toast.success(t.toast.hospitalSaved);
      router.push("/search");
    } catch {
      toast.error(t.toast.saveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
<section className="w-full h-[calc(100vh-72px)] bg-surface-variant flex items-center justify-center p-4">      <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl h-full bg-surface rounded-2xl shadow-2xl overflow-hidden border border-muted">        
        {/* LEFT: INTERACTIVE MAP */}
        <div className="w-full h-64 lg:h-full relative">
          <LocationSearch onSelectLocation={(loc) => updateLocation(loc.lat, loc.lng)} placeholder={t.search.placeholder} />
          
          <MapContainer center={mapCenter} zoom={13} className="h-full w-full z-0">
            <ChangeView center={mapCenter} />
            <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />
            
            <MapClickHandler onMapClick={(lat, lng) => updateLocation(lat, lng)} />

            {markerPosition && (
              <Marker position={markerPosition}>
                <Popup>{t.addHospital.futureLocation}</Popup>
              </Marker>
            )}
          </MapContainer>

          <div className="absolute bottom-4 left-4 right-4 bg-surface/80 backdrop-blur-sm rounded-lg p-2 z-1000 text-center text-xs text-muted-foreground border border-muted shadow-sm">
            {t.addHospital.searchOrClick}
          </div>
        </div>

        {/* RIGHT: DATA FORM */}
        <div className="w-full h-full bg-surface p-6 lg:p-8 overflow-y-auto flex flex-col">
          <header className="mb-6 text-center lg:text-left">
           <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              <TypeAnimation
                key={language}
                sequence={[
                  t.addHospital.title,
                ]}
                wrapper="span"
                speed={50}
                repeat={1}
                cursor={false}
              />
            </h1>
            <p className="text-muted-foreground mt-2 text-sm italic">
              {t.addHospital.subtitle}
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 grow">
            {/* NAME */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t.addHospital.hospitalName}</label>
              <input
                {...register("name")}
                className="w-full p-3 rounded-xl border border-muted bg-muted/50 text-foreground focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder={t.addHospital.namePlaceholder}
              />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
            </div>

            {/* TYPE */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t.addHospital.specialization}</label>
              <select
                {...register("type")}
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
              required
              >
                <option value="" disabled >{t.addHospital.chooseOption}</option>
                <option value="Générale">{t.addHospital.general}</option>
                <option value="Spécialisée">{t.addHospital.specialized}</option>
                <option value="Clinique Multidisciplinaire">{t.addHospital.multidisciplinary}</option>
                <option value="Clinique d’Oncologie">{t.addHospital.oncology}</option>
                <option value="Clinique de Beauté et d’Esthétique">{t.addHospital.beauty}</option>
                <option value="Clinique Néphrologique">{t.addHospital.nephrology}</option>
                <option value="Clinique d’Ophtalmologie">{t.addHospital.ophthalmology}</option>
              </select>
            </div>

            {/* STATUS */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t.addHospital.status}</label>
              <select
                {...register("status")}
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
              required
              >
                <option value="" disabled >{t.addHospital.chooseOption}</option>
                <option value="Active">{t.addHospital.active}</option>
                <option value="En construction">{t.addHospital.construction}</option>
                <option value="En étude">{t.addHospital.study}</option>
              </select>
            </div>    
              
            {/* COORDINATES DISPLAY */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${lat ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-dashed border-muted'}`}>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-3">{t.addHospital.coordinates}</span>
              <div className="flex justify-between items-center">
                <div className="font-mono text-sm space-y-1">
                  <p><span className="text-muted-foreground">LAT:</span> {lat ? lat.toFixed(6) : "---"}</p>
                  <p><span className="text-muted-foreground">LNG:</span> {lng ? lng.toFixed(6) : "---"}</p>
                </div>
                {lat ? (
                   <div className="bg-primary text-on-primary p-2 rounded-full">✓</div>
                ) : (
                   <div className="animate-pulse bg-muted w-8 h-8 rounded-full"></div>
                )}
              </div>
              {errors.lat && <p className="text-xs text-red-500 mt-3">{errors.lat.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-widest text-on-primary transition-all shadow-xl flex items-center justify-center gap-3 ${
                isSubmitting ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary hover:scale-[1.02] active:scale-95 shadow-primary/20"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t.addHospital.processing || t.addHospital.submitting}</span>
                </>
              ) : (
                t.addHospital.confirmLocation
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
