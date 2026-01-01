"use client";

import dynamic from "next/dynamic";

// Import SearchMap dynamically to prevent SSR errors with Leaflet
const SearchMap = dynamic(() => import("@/components/SearchMap"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-gray-500">
      Chargement de la carte...
    </div>
  ),
});

export default function SearchPage() {
  return (
    <main className="min-h-screen">
      <SearchMap />
    </main>
  );
}
