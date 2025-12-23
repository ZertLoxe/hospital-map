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

type HospitalFormValues = {
  name: string;
  type: "Générale" | "Spécialisée";
  status: "active" | "en_construction" | "en_étude";
  lat: number;
  lng: number;
};



// Handles location search in the map
function LocationSearch({ onSelectLocation }: { onSelectLocation: (location: { lat: number; lng: number; label: string }) => void }) {
  const [query, setQuery] = useState('');
  const provider = new OpenStreetMapProvider();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const results = await provider.search({ query });
      if (results.length > 0) {
        const firstResult = results[0];
        onSelectLocation({ lat: firstResult.y, lng: firstResult.x, label: firstResult.label });
      } else {
        toast.error("Emplacement non trouvé");
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  return (
    <form onSubmit={handleSearch} className="absolute top-4 left-12 bg-white rounded-lg shadow-xl z-[1000] border border-gray-300 overflow-hidden flex">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="p-3 w-64 text-gray-700 placeholder-gray-400 text-sm focus:outline-none"
        placeholder="Rechercher une adresse..."
      />
      <button type="submit" className="bg-primary text-white px-4 py-2 text-sm font-bold">OK</button>
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
      const response = await fetch("http://localhost:5000/api/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error();
      
      toast.success("Hôpital enregistré !");
      router.push("/search");
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full min-h-screen bg-surface-variant flex items-center justify-center p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl h-[85vh] bg-surface rounded-2xl shadow-2xl overflow-hidden border border-gray-100 mt-15">
        
        {/* LEFT: INTERACTIVE MAP */}
        <div className="w-full h-[300px] lg:h-full relative">
          <LocationSearch onSelectLocation={(loc) => updateLocation(loc.lat, loc.lng)} />
          
          <MapContainer center={mapCenter} zoom={13} className="h-full w-full z-0">
            <ChangeView center={mapCenter} />
            <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />
            
            <MapClickHandler onMapClick={(lat, lng) => updateLocation(lat, lng)} />

            {markerPosition && (
              <Marker position={markerPosition}>
                <Popup>Emplacement du futur hôpital</Popup>
              </Marker>
            )}
          </MapContainer>

          <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg p-2 z-[1000] text-center text-xs text-gray-600 border border-gray-200 shadow-sm">
            Faites une recherche ou cliquez directement sur la carte
          </div>
        </div>

        {/* RIGHT: DATA FORM */}
        <div className="w-full h-full bg-white p-8 lg:p-12 overflow-y-auto flex flex-col">
          <header className="mb-10 text-center lg:text-left">
           <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              <TypeAnimation
                sequence={[
                  'Ajouter un Nouvel Hôpital',
                ]}
                wrapper="span"
                speed={50}
                repeat={1}
                cursor={false}
              />
            </h1>
            <p className="text-gray-500 mt-2 text-sm italic">
              Définissez la position stratégique de votre Hôpital.
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 flex-grow">
            {/* NAME */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Nom d&apos;Hôpital</label>
              <input
                {...register("name")}
                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Ex: Hôpital Central de Casablanca"
              />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
            </div>

            {/* TYPE */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Spécialisation</label>
              <select
                {...register("type")}
                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
              required
              >
                <option value="" disabled >Choisir une option</option>
                <option value="Générale">Hôpital Général (Toutes spécialités)</option>
                <option value="Spécialisée">Clinique Spécialisée</option>
              </select>
            </div>

            {/* STATUS */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Statut</label>
              <select
                {...register("status")}
                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
              required
              >
                <option value="" disabled >Choisir une option</option>
                <option value="active">Active</option>
                <option value="en_construction">En Construction</option>
                <option value="en_étude">En Étude</option>
              </select>
            </div>    
              
            {/* COORDINATES DISPLAY */}
            <div className={`p-6 rounded-2xl border-2 transition-all ${lat ? 'bg-primary/5 border-primary/20' : 'bg-gray-50 border-dashed border-gray-300'}`}>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Coordonnées Géographiques</span>
              <div className="flex justify-between items-center">
                <div className="font-mono text-sm space-y-1">
                  <p><span className="text-gray-400">LAT:</span> {lat ? lat.toFixed(6) : "---"}</p>
                  <p><span className="text-gray-400">LNG:</span> {lng ? lng.toFixed(6) : "---"}</p>
                </div>
                {lat ? (
                   <div className="bg-primary text-white p-2 rounded-full">✓</div>
                ) : (
                   <div className="animate-pulse bg-gray-200 w-8 h-8 rounded-full"></div>
                )}
              </div>
              {errors.lat && <p className="text-xs text-red-500 mt-3">{errors.lat.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest text-white transition-all shadow-xl ${
                isSubmitting ? "bg-gray-300" : "bg-primary hover:scale-[1.02] active:scale-95 shadow-primary/20"
              }`}
            >
              {isSubmitting ? "Traitement..." : "Confirmer l'Emplacement"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}