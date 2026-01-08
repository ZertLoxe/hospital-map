"use client";

import dynamic from "next/dynamic";

// We import our component dynamically to prevent Server-Side Rendering (SSR) errors
const AddHospitalForm = dynamic(() => import("@/components/AddHospitalForm"), {
  ssr: false, // This is the magic line
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-surface text-muted-foreground">
      Chargement de la carte...
    </div>
  ),
});

export default function AddHospitalPage() {
  return <AddHospitalForm />;
}