"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
    const { t } = useLanguage();
    const [hasHospitals, setHasHospitals] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/hospitals/count')
            .then(res => res.json())
            .then(data => {
                setHasHospitals(data.count > 0);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching hospital count:', error);
                setIsLoading(false);
            });
    }, []);

    return(
        <section className="w-full h-[calc(100vh-72px)] px-4 lg:px-8 flex items-center justify-center bg-background">
          <div className="w-full max-w-8xl grid grid-cols-1 sm:grid-cols-2  items-center px-8">
            {/* LEFT COLUMN: Text Content */}
            
            <div className="flex flex-col gap-6 max-w-2xl">
                <h1 className="text-6xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                {t.hero.findThe} <br />
                <span className="text-primary">
                    {t.hero.medicalFacilities} <br />
                </span>{" "}
                {t.hero.nearYou}
                </h1>

                {/* Buttons Group */}
                <div className="flex flex-row gap-4 mt-4">
                
                    {/* PRIMARY BUTTON - Only show if hospitals exist */}
                    {!isLoading && hasHospitals && (
                        <Link href="/search" className="w-full sm:w-auto">
                            <button className="w-full sm:px-4 px-8 py-4 bg-primary text-on-primary font-semibold rounded-xl hover:scale-105 lg:hover:scale-115 transition-all duration-200">
                            {t.hero.search}
                            </button>
                        </Link>
                    )}

                    {/* SECONDARY BUTTON */}
                    <Link href="/add-hospital" className="w-full sm:w-auto">
                        <button className="w-full sm:px-4 px-8 py-4 bg-primary-container text-on-primary-container font-semibold rounded-xl hover:scale-105 lg:hover:scale-115 transition-all duration-200">
                        {t.hero.addHospital}
                        </button>
                    </Link>
                </div>
            </div>

            {/*RIGHT SECTION: image */}
            <div className="relative w-full sm:h-[50%] h-[70%] aspect-square lg:h-[70%] rounded-[2.5rem] overflow-hidden shadow-lg">                <Image
                src="/hospital-hero.jpg" 
                alt={t.hero.imageAlt}
                fill
                className="object-cover scale-110"
                priority
                />
            </div>
          </div>
        </section>
    )
        
    
};
export default HeroSection;
