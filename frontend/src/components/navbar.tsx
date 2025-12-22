// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    const toggleTheme = () => {
    const html = document.documentElement;
    html.setAttribute(
      "data-theme",
      html.getAttribute("data-theme") === "dark" ? "light" : "dark"
    );
  };

  return (
    
    <nav className="flex items-center justify-between p-3 bg-surface text-on-surface shadow-lg">
      {/* Logo or Brand Name */}
      <div className="flex text-3xl font-bold p-2 px-8">
        <Image
          className="cursor-pointer"
          src="/hospital.svg"
          alt="MedLocator Logo"
          width={38}
          height={38}
          priority
        />
        <Link href="/">MedLocator</Link>
      </div>

      {/* Navigation Tools (toggles/button) */}
      <div className="flex gap-7 px-8">
        {/* <Image
          className="cursor-pointer"
          src="/translate.svg"
          alt="translate logo logo"
          width={32}
          height={32}
          priority
        /> */}
       <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask id="mask0" maskUnits="userSpaceOnUse" x="0" y="0" width="38" height="38">
            <rect width="38" height="38" fill="#D9D9D9" className="text-on-surface"/>
          </mask>
          <g mask="url(#mask0)">
            <path
              d="M18.8416 34.8337L26.0458 15.8337H29.3708L36.5749 34.8337H33.2499L31.5478 30.0045H23.8687L22.1666 34.8337H18.8416ZM6.33325 30.0837L4.11659 27.867L12.1124 19.8712C11.1888 18.9475 10.351 17.892 9.59888 16.7045C8.84679 15.517 8.15409 14.1712 7.52075 12.667H10.8458C11.3735 13.6962 11.9013 14.5934 12.4291 15.3587C12.9569 16.1239 13.5902 16.8892 14.3291 17.6545C15.1999 16.7837 16.1037 15.5632 17.0405 13.993C17.9773 12.4229 18.6833 10.9253 19.1583 9.50033H1.58325V6.33366H12.6666V3.16699H15.8333V6.33366H26.9166V9.50033H22.3249C21.7708 11.4003 20.9395 13.3531 19.8312 15.3587C18.7228 17.3642 17.6277 18.8948 16.5458 19.9503L20.3458 23.8295L19.1583 27.0753L14.3291 22.1274L6.33325 30.0837ZM24.8583 27.2337H30.5583L27.7083 19.1587L24.8583 27.2337Z"
              fill="currentColor"
            />
          </g>
        </svg>
        {/* <Image
          className="cursor-pointer"
          src="/themes.svg"
          alt="translate logo logo"
          width={32}
          height={32}
          priority
           onClick={toggleTheme}
        /> */}
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={toggleTheme}>
          <mask id="mask0" maskUnits="userSpaceOnUse" x="0" y="0" width="38" height="38">
            <rect width="38" height="38" fill="#D9D9D9" className="text-on-surface"/>
          </mask>
          <g mask="url(#mask0)">
            <path
              d="M17.8917 35.7833L12.5875 30.5583H5.225V23.1958L0 17.8917L5.225 12.5875V5.225H12.5875L17.8917 0L23.1958 5.225H30.5583V12.5875L35.7833 17.8917L30.5583 23.1958V30.5583H23.1958L17.8917 35.7833ZM17.8917 25.8083C20.0819 25.8083 21.949 25.0365 23.4927 23.4927C25.0365 21.949 25.8083 20.0819 25.8083 17.8917C25.8083 15.7014 25.0365 13.8344 23.4927 12.2906C21.949 10.7469 20.0819 9.975 17.8917 9.975V25.8083ZM17.8917 31.35L21.85 27.3917H27.3917V21.85L31.35 17.8917L27.3917 13.9333V8.39167H21.85L17.8917 4.43333L13.9333 8.39167H8.39167V13.9333L4.43333 17.8917L8.39167 21.85V27.3917H13.9333L17.8917 31.35Z"
              fill="currentColor"
            />
          </g>
        </svg>
  
        <Link href="/navigate" className="hover:text-gray-300">
          <button className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-secondary transition cursor-pointer">
            Navigate
          </button>
        </Link>
      </div>
    </nav>
  );
}
