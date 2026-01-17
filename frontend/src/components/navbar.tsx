// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Navbar() {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="flex items-center justify-between p-3 bg-surface text-on-surface shadow-lg">
      {/* Logo or Brand Name */}
      <div className="flex text-3xl font-bold p-2 px-8">
        <svg 
          version="1.0" 
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 800" 
          className="text-primary w-8 h-8 md:w-9.5 md:h-9.5"
          fill="currentColor"
        >
          <g transform="translate(0, 700) scale(1,-1)">
            <path d="M275 631 c-72 -18 -123 -60 -150 -123 -24 -58 -19 -119 16 -201 40
              -95 161 -292 179 -292 18 0 139 197 179 292 46 108 38 197 -22 261 -46 50
              -139 79 -202 63z m134 -80 c69 -49 87 -150 37 -215 -34 -45 -74 -66 -126 -66
              -51 0 -92 21 -123 62 -32 43 -40 80 -27 127 29 108 151 155 239 92z"
            />
            <path d="M290 485 c0 -21 -5 -25 -30 -25 -28 0 -30 -3 -30 -34 0 -30 3 -35 28
              -38 19 -2 28 -9 30 -25 3 -18 10 -23 32 -23 22 0 29 5 32 23 2 16 11 23 31 25
              24 3 27 8 27 38 0 31 -2 34 -30 34 -25 0 -30 4 -30 25 0 21 -5 25 -30 25 -25
              0 -30 -4 -30 -25z"
            />
          </g>
        </svg>

        <Link href="/">{t.nav.brand}</Link>
      </div>

      {/* Navigation Tools (toggles/button) */}
      <div className="flex gap-7 px-8 items-center">
        {/* Language Toggle Button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
          aria-label={language === "fr" ? "Switch to English" : "Passer en Français"}
          title={language === "fr" ? "Switch to English" : "Passer en Français"}
        >
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18.8416 34.8337L26.0458 15.8337H29.3708L36.5749 34.8337H33.2499L31.5478 30.0045H23.8687L22.1666 34.8337H18.8416ZM6.33325 30.0837L4.11659 27.867L12.1124 19.8712C11.1888 18.9475 10.351 17.892 9.59888 16.7045C8.84679 15.517 8.15409 14.1712 7.52075 12.667H10.8458C11.3735 13.6962 11.9013 14.5934 12.4291 15.3587C12.9569 16.1239 13.5902 16.8892 14.3291 17.6545C15.1999 16.7837 16.1037 15.5632 17.0405 13.993C17.9773 12.4229 18.6833 10.9253 19.1583 9.50033H1.58325V6.33366H12.6666V3.16699H15.8333V6.33366H26.9166V9.50033H22.3249C21.7708 11.4003 20.9395 13.3531 19.8312 15.3587C18.7228 17.3642 17.6277 18.8948 16.5458 19.9503L20.3458 23.8295L19.1583 27.0753L14.3291 22.1274L6.33325 30.0837ZM24.8583 27.2337H30.5583L27.7083 19.1587L24.8583 27.2337Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-sm font-semibold">{language.toUpperCase()}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="cursor-pointer hover:text-primary transition-colors p-1"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            // Sun icon for dark mode (click to switch to light)
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
                fill="currentColor"
              />
              <path
                d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            // Moon icon for light mode (click to switch to dark)
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
