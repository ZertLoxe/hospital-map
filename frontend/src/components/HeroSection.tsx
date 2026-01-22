"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
    const { t } = useLanguage();
    const [hasHospitals, setHasHospitals] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const containerRef = useRef<HTMLElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
            
            tl.fromTo(textRef.current, 
                { y: 50, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 1 }
            )
            .fromTo(buttonsRef.current, 
                { y: 20, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.8 }, 
                "-=0.6"
            )
            .fromTo(imageRef.current, 
                { scale: 1.1, autoAlpha: 0 },
                { scale: 1, autoAlpha: 1, duration: 1.5, ease: "power2.out" }, 
                "-=1"
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

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
        <section ref={containerRef} className="w-full h-[calc(100vh-72px)] px-4 lg:px-8 flex items-center justify-center bg-background">
          <div className="w-full max-w-8xl grid grid-cols-1 sm:grid-cols-2  items-center px-8">
            {/* LEFT COLUMN: Text Content */}
            
            <div ref={textRef} className="flex flex-col gap-6 max-w-2xl invisible">
                <h1 className="text-6xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                {t.hero.findThe} <br />
                <span className="text-primary">
                    {t.hero.medicalFacilities} <br />
                </span>{" "}
                {t.hero.nearYou}
                </h1>

                {/* Buttons Group */}
                <div ref={buttonsRef} className="flex flex-row gap-4 mt-4 invisible">
                
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
            <div ref={imageRef} className="relative w-full sm:h-[50%] h-[70%] aspect-square lg:h-[70%] rounded-[2.5rem] overflow-hidden shadow-lg invisible">
            <Image
                src="/clinic-hero.png" 
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
