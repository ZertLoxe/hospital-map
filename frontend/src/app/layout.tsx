import type { Metadata } from "next";
import { geistSans, geistMono } from "./fonts";
import { Toaster } from "sonner";
import "./globals.css";
import Navbar from "@/components/navbar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "MedLocator",
  description: "Système de localisation d'hôpitaux",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Prevent language mismatch between server and client */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var lang = localStorage.getItem('language') || 'fr';
                  document.documentElement.lang = lang;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        <ThemeProvider>
          <LanguageProvider>
            <Navbar />
            <Toaster
              position="top-right"
              richColors
              closeButton
              style={{ marginRight: '60px' }}
            />
            {children}
          </LanguageProvider>
        </ThemeProvider>


      </body>
    </html>
  );
}