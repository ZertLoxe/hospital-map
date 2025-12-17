import Image from "next/image";
import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background">
      <HeroSection />
    </main>
  );
}
