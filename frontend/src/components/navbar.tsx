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
    
    <nav className="flex items-center justify-between p-5 bg-surface text-on-surface ">
      {/* Logo or Brand Name */}
      <div className="text-3xl font-bold p-2 px-8">
        <Link href="/">MedLocator</Link>
      </div>

      {/* Navigation Tools (toggles/button) */}
      <div className="flex gap-7 px-8">
        <Image
          className="cursor-pointer"
          src="/translate.svg"
          alt="translate logo logo"
          width={32}
          height={32}
          priority
        />
        <Image
          className="cursor-pointer"
          src="/themes.svg"
          alt="translate logo logo"
          width={32}
          height={32}
          priority
           onClick={toggleTheme}
        />
        <Link href="/navigate" className="hover:text-gray-300">
          <button className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-secondary transition cursor-pointer">
            Navigate
          </button>
        </Link>
      </div>
    </nav>
  );
}
