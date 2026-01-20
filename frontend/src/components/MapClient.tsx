"use client";
import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import 'leaflet-geosearch/dist/geosearch.css';
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type MarkerItem = {
  position: [number, number];
  popup?: React.ReactNode;
  color?: string;
};

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

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const createIcon = (color = '#2563eb') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

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
  return (
    <div className={`relative ${className || ""}`}>
      {showSearch && onSelectLocation && (
        <LocationSearch onSelectLocation={onSelectLocation} placeholder={"Rechercher..."} />
      )}
      <MapContainer center={center} zoom={zoom} className="h-full w-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <MapClickHandler onMapClick={onMapClick} />
        {markers.map((m, i) => (
          <Marker key={i} position={m.position} icon={createIcon(m.color)}>
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
