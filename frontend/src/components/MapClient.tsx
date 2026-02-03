"use client";
import React, { useState } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type MarkerItem = {
  position: [number, number];
  popup?: React.ReactNode;
  color?: string;
};

const containerStyle = {
  width: '100%',
  height: '100%'
};

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

export default function MapClient({
  center,
  zoom = 13,
  markers = [],
  onMapClick,
  showSearch = false,
  onSelectLocation,
  className,
}: {
  center: [number, number];
  zoom?: number;
  markers?: MarkerItem[];
  onMapClick?: (lat: number, lng: number) => void;
  showSearch?: boolean;
  onSelectLocation?: (location: { lat: number; lng: number; label: string }) => void;
  className?: string;
}) {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  if (loadError) {
    return <div className="flex items-center justify-center h-full">Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">Loading Maps...</div>;
  }

  const onLoad = (map: google.maps.Map) => {
    setMapInstance(map);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng && onMapClick) {
      onMapClick(e.latLng.lat(), e.latLng.lng());
    }
  };

  return (
    <div className={`relative ${className || ""}`}>
      {showSearch && onSelectLocation && (
        <LocationSearch 
          onSelectLocation={onSelectLocation} 
          placeholder={"Rechercher..."} 
          mapInstance={mapInstance}
        />
      )}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: center[0], lng: center[1] }}
        zoom={zoom}
        onLoad={onLoad}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {markers.map((m, i) => (
          <MarkerF
            key={i}
            position={{ lat: m.position[0], lng: m.position[1] }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: m.color || '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            }}
            onClick={() => setActiveMarker(i)}
          >
            {activeMarker === i && m.popup && (
              <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                <div>{m.popup}</div>
              </InfoWindowF>
            )}
          </MarkerF>
        ))}
      </GoogleMap>
    </div>
  );
}
