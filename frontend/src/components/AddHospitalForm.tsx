"use client";

import { TypeAnimation } from 'react-type-animation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { toast } from "sonner";

import { hospitalSchema } from "@/lib/validations";
import { useLanguage } from "@/contexts/LanguageContext";

const containerStyle = {
  width: '100%',
  height: '100%'
};

type HospitalFormValues = {
  name: string;
  type: "Générale" | "Spécialisée" | "Clinique Multidisciplinaire" | "Clinique d’Oncologie" | "Clinique de Beauté et d’Esthétique" | "Clinique Néphrologique" | "Clinique d’Ophtalmologie";
  status: "Active" | "En construction" | "En étude";
  lat: number;
  lng: number;
};

// Handles location search in the map
function LocationSearch({ 
  onSelectLocation, 
  placeholder,
  mapInstance 
}: { 
  onSelectLocation: (location: { lat: number; lng: number; label: string }) => void; 
  placeholder: string;
  mapInstance: google.maps.Map | null;
}) {
  const [query, setQuery] = useState('');
  const { t } = useLanguage();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !mapInstance) return;

    const service = new google.maps.places.PlacesService(mapInstance);
    const request = {
      query: query,
      fields: ['name', 'geometry'],
    };

    service.findPlaceFromQuery(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
        const place = results[0];
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          onSelectLocation({ 
            lat, 
            lng, 
            label: place.name || query 
          });
        }
      } else {
        toast.error(t.toast.locationNotFound);
      }
    });
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

// --- MAIN COMPONENT ---
export default function AddHospitalForm() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5731, -7.5898]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });
  
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

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading Maps...</div>;
  }

  return (
<section className="w-full h-[calc(100vh-72px)] bg-surface-variant flex items-center justify-center p-4">      <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl h-full bg-surface rounded-2xl shadow-2xl overflow-hidden border border-muted">        
        {/* LEFT: INTERACTIVE MAP */}
        <div className="w-full h-64 lg:h-full relative">
          <LocationSearch 
            onSelectLocation={(loc) => updateLocation(loc.lat, loc.lng)} 
            placeholder={t.search.placeholder}
            mapInstance={mapInstance}
          />
          
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: mapCenter[0], lng: mapCenter[1] }}
            zoom={13}
            onLoad={(map: google.maps.Map) => setMapInstance(map)}
            onClick={(e: google.maps.MapMouseEvent) => {
              if (e.latLng) {
                updateLocation(e.latLng.lat(), e.latLng.lng());
              }
            }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
            }}
          >

            {markerPosition && (
              <MarkerF 
                position={{ lat: markerPosition[0], lng: markerPosition[1] }}
                onClick={() => setShowInfo(true)}
              >
                {showInfo && (
                  <InfoWindowF onCloseClick={() => setShowInfo(false)}>
                    <div>{t.addHospital.futureLocation}</div>
                  </InfoWindowF>
                )}
              </MarkerF>
            )}
          </GoogleMap>

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
                  <span>{t.addHospital.processing || "Processing..."}</span>
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
