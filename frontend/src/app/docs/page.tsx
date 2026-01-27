"use client";

import { useRef, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { docsContent } from "./content";
import DocsSidebar from "@/components/DocsSidebar";

export default function DocsPage() {
  const { language } = useLanguage();
  // Ensure we get the correct categories array
  const categories = docsContent[language as keyof typeof docsContent] || docsContent.fr;
  
  // State for active section
  const [activeId, setActiveId] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // ScrollSpy implementation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        root: containerRef.current,
        // Adjust rootMargin to trigger when section enters the top part of the view
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0
      }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [categories]);

  return (
    <div ref={containerRef} className="h-[calc(100vh-72px)] overflow-y-auto bg-background text-on-background scroll-smooth">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="lg:flex lg:gap-10">
                {/* Sidebar Navigation */}
                <DocsSidebar categories={categories} activeId={activeId} />

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 mt-8 lg:mt-0">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-10">
                            {language === 'fr' ? 'Documentation' : 'Documentation'}
                        </h1>

                        <div className="space-y-20">
                            {categories.map((category, catIdx) => (
                                <div key={catIdx}>
                                    {/* Category Title Separator */}
                                    <div className="flex items-center gap-4 mb-10">
                                      <h2 className="text-2xl font-black text-secondary uppercase tracking-widest shrink-0">
                                        {category.title}
                                      </h2>
                                      <div className="h-px bg-outline-variant/30 w-full"></div>
                                    </div>

                                    <div className="space-y-16 pl-2 border-l border-outline-variant/10">
                                        {category.sections.map((section) => (
                                            <section key={section.id} id={section.id} className="scroll-mt-28 pl-6 relative">
                                                {/* Section connector line functionality (visual only) */}
                                                <div className="absolute left-[-1px] top-8 w-4 h-px bg-primary/30"></div>
                                                
                                                <div className="group relative">
                                                    <h2 className="text-3xl font-bold text-on-surface mb-6 flex items-center gap-3 pb-4 border-b border-outline-variant/50">
                                                        <span className="text-primary">#</span>
                                                        {section.title}
                                                    </h2>
                                                    
                                                    {section.content && (
                                                        <p className="text-lg leading-8 text-on-surface-variant mb-6">
                                                            {section.content}
                                                        </p>
                                                    )}

                                                    {/* Code Block Visualization */}
                                                    {section.code && (
                                                        <div className="my-6 relative rounded-xl bg-[#1e1e1e] p-4 shadow-lg overflow-hidden ring-1 ring-white/10">
                                                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                                                                <div className="flex gap-2">
                                                                    <div className="w-3 h-3 rounded-full bg-red-500"/>
                                                                    <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                                                                    <div className="w-3 h-3 rounded-full bg-green-500"/>
                                                                </div>
                                                                <span className="text-xs text-gray-400 font-mono">structure</span>
                                                            </div>
                                                            <pre className="overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed">
                                                                <code>{section.code}</code>
                                                            </pre>
                                                        </div>
                                                    )}

                                                    {/* List Items */}
                                                    {section.items && (
                                                        <ul className="space-y-3 mb-6">
                                                            {section.items.map((item, i) => (
                                                                <li key={i} className="flex items-start gap-3 text-on-surface-variant">
                                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"/>
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}

                                                    {/* Subsections */}
                                                    {section.subsections && (
                                                        <div className="grid grid-cols-1 gap-6 mt-8">
                                                            {section.subsections.map((sub) => (
                                                                <div 
                                                                    key={sub.id} 
                                                                    id={sub.id}
                                                                    className="scroll-mt-32 rounded-2xl bg-surface-container p-6 border border-outline-variant/40 hover:border-primary/30 transition-colors"
                                                                >
                                                                    <h3 className="text-xl font-semibold text-primary mb-3">
                                                                        {sub.title}
                                                                    </h3>
                                                                    <p className="text-on-surface-variant leading-relaxed">
                                                                        {sub.content}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="mt-20 pt-10 border-t border-outline-variant/30 text-center text-on-surface-variant/60">
                        <p>&copy; {new Date().getFullYear()} Hospital Map Project - MedLocator</p>
                    </div>
                </main>
            </div>
        </div>
    </div>
  );
}
