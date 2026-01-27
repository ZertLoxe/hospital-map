"use client";

import { useState } from "react";
import { DocCategory } from "@/app/docs/content";

export default function DocsSidebar({ categories, activeId }: { categories: DocCategory[], activeId?: string }) {
  // State to track expanded categories (by index)
  // Default all open
  const [openCategories, setOpenCategories] = useState<number[]>(
    categories.map((_, i) => i)
  );

  const toggleCategory = (index: number) => {
    setOpenCategories((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        // Use scrollIntoView which works better with container overflow
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="w-64 shrink-0 hidden lg:block h-[calc(100vh-100px)] sticky top-0 overflow-y-auto pr-2 border-r border-outline-variant/30 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-outline-variant/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
      <nav className="space-y-8">
        {categories.map((category, idx) => (
          <div key={idx} className="space-y-3">
            <button
              onClick={() => toggleCategory(idx)}
              className="flex items-center justify-between w-full text-left font-bold text-primary hover:text-primary-container transition-colors uppercase tracking-wider text-xs"
            >
              <span>{category.title}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  openCategories.includes(idx) ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <div className="w-full h-px bg-outline-variant/30"></div>

            {openCategories.includes(idx) && (
              <ul className="space-y-1 border-l-2 border-outline-variant/30 ml-1">
                {category.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      onClick={(e) => scrollToSection(e, section.id)}
                      className={`block pl-4 py-1 text-sm border-l-2 -ml-[2px] transition-all ${
                        activeId === section.id 
                          ? "text-primary border-primary font-medium" 
                          : "text-on-surface-variant border-transparent hover:text-primary hover:border-primary/50"
                      }`}
                    >
                      {section.title}
                    </a>
                    {/* Render subsections links if any */}
                    {section.subsections && (
                        <ul className="ml-4 mt-1 space-y-1">
                            {section.subsections.map(sub => (
                                <li key={sub.id}>
                                    <a 
                                        href={`#${sub.id}`}
                                        onClick={(e) => scrollToSection(e, sub.id)}
                                        className={`block text-xs transition-colors ${
                                          activeId === sub.id 
                                          ? "text-primary font-medium"
                                          : "text-on-surface-variant/70 hover:text-primary"
                                        }`}
                                    >
                                        {sub.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
