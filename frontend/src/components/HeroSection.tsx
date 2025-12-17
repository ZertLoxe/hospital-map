"use client";

import Image from "next/image";
import Link from "next/link";

const HeroSection = () => {
    return(
        <>
        <section className=" w-full lg:w-[90%] px-4  min-h-[calc(100dvh-80px)] grid grid-cols-1 sm:grid-cols-2  items-center">

            {/* LEFT COLUMN: Text Content */}
            
            <div className="flex flex-col gap-6 max-w-2xl">
                <h1 className="text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Trouvez les <br />
                <span className="text-primary">
                    établissements <br />
                    médicaux
                </span>{" "}
                les plus <br />
                proches de chez vous
                </h1>

                {/* Buttons Group */}
                <div className="flex flex-row gap-4 mt-4">
                
                    {/* PRIMARY BUTTON */}
                    <Link href="/search" className="w-full sm:w-auto">
                        <button className="w-full sm:px-4 px-8 py-4 bg-primary text-on-primary font-semibold rounded-xl hover:scale-105 lg:hover:scale-115 transition-all duration-200">
                        Rechercher
                        </button>
                    </Link>

                    {/* SECONDARY BUTTON */}
                    <Link href="/add-hospital" className="w-full sm:w-auto">
                        <button className="w-full sm:px-4 px-8 py-4 bg-primary-container text-on-primary-container font-semibold rounded-xl hover:scale-105 lg:hover:scale-115 transition-all duration-200">
                        Ajouter Hôpital
                        </button>
                    </Link>
                </div>
            </div>

            {/*RIGHT SECTION: image */}
            <div className="relative w-full sm:h-[50%] h-[70%] aspect-square lg:h-[70%] rounded-[2.5rem] overflow-hidden shadow-lg">
                <Image
                src="/hospital-hero.jpg" 
                alt="Modern Hospital Building"
                fill
                className="object-cover scale-110"
                priority
                />
            </div>
        </section>



</>
    )
        
    
};
export default HeroSection;