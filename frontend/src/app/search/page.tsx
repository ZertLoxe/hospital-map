"use client";

import dynamic from "next/dynamic";

// Import SearchMap dynamically to prevent SSR errors with Leaflet
const SearchMap = dynamic(() => import("@/components/SearchMap"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-surface text-muted-foreground">
      Chargement de la carte...
    </div>
  ),
});

export default function SearchPage() {
  return <SearchMap />;
}
