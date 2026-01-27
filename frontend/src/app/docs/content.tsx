export type DocSection = {
  id: string;
  title: string;
  content?: string;
  items?: string[];
  code?: string;
  subsections?: DocSection[];
};

export type DocCategory = {
  title: string;
  sections: DocSection[];
};

export const docsContent: Record<"fr" | "en", DocCategory[]> = {
  fr: [
    {
      title: "Général",
      sections: [
        {
          id: "overview",
          title: "Vue d'ensemble",
          content: `Hospital Map (MedLocator) est une application web full-stack conçue pour aider les utilisateurs à localiser et gérer les établissements médicaux dans leur région. L'application permet aux utilisateurs de rechercher des hôpitaux, cliniques, pharmacies, laboratoires et cabinets médicaux à l'aide d'une interface cartographique interactive.`
        },
        {
          id: "concept",
          title: "Concept & Utilisation",
          content: "L'application repose sur deux sources de données : l'API Overpass (OpenStreetMap) pour les données publiques en temps réel, et une base de données PostgreSQL locale pour les établissements gérés par les utilisateurs.",
          subsections: [
            {
              id: "search-flow",
              title: "1. Recherche d'établissements",
              content: "Naviguez vers la page d'accueil, cliquez sur 'Rechercher', choisissez un point de référence sur la carte ou utilisez votre position, définissez un rayon de recherche (1-50 km) et filtrez par type.",
            },
             {
              id: "add-flow",
              title: "2. Ajouter une clinique",
              content: "Utilisez le bouton 'Ajouter une clinique', sélectionnez l'emplacement précis sur la carte, remplissez les détails (nom, type, statut) et validez. L'établissement sera immédiatement disponible dans les recherches locales.",
            }
          ]
        }
      ]
    },
    {
      title: "Technique",
      sections: [
        {
          id: "stack",
          title: "Technologies Utilisées",
          content: "Une stack moderne et performante pour une expérience utilisateur fluide.",
          subsections: [
            {
              id: "frontend-tech",
              title: "Frontend",
              content: "Next.js 16 (React 19), TypeScript, Tailwind CSS 4, Leaflet (Cartographie), Zod (Validation), React Hook Form."
            },
            {
              id: "backend-tech",
              title: "Backend",
              content: "Node.js 25, Express 5.2.1, PostgreSQL 15, Knex.js (Query Builder)."
            },
            {
              id: "devops-tech",
              title: "DevOps",
              content: "Docker & Docker Compose pour l'orchestration des conteneurs."
            }
          ]
        },
        {
          id: "architecture",
          title: "Architecture Système",
          content: "L'application suit une architecture trois tiers classique robustifiée par des conteneurs Docker.",
          code: `┌─────────────────────────────────────────────────┐
│                Couche Client                    │
│  (Navigateur - Application React Next.js)       │
│  - Composants UI                                │
│  - Gestion d'état (React Hooks/Context)         │
│  - Visualisation cartographique (Leaflet)       │
└────────────┬────────────────────────────────────┘
             │ HTTP/REST
             ▼
┌────────────┴────────────────────────────────────┐
│             Couche Application                  │
│          (API Backend Express.js)               │
│  - Validation des requêtes (Zod)                │
│  - Logique métier (Repositories)                │
│  - Proxy API Overpass (OpenStreetMap)           │
└────────────┬────────────────────────────────────┘
             │ SQL
             ▼
┌────────────┴────────────────────────────────────┐
│              Couche Données                     │
│         (Base de données PostgreSQL)            │
│  - Stockage persistant des hôpitaux             │
│  - Indexation géospatiale                       │
└─────────────────────────────────────────────────┘`
        },
        {
          id: "structure",
          title: "Structure du Projet",
          content: "Organisation des dossiers et fichiers principaux du projet.",
          code: `hospital-map/
│
├── backend/                          # Serveur API Express.js
│   ├── src/
│   │   ├── server.ts                # Point d'entrée
│   │   ├── db.ts                    # Connexion DB
│   │   ├── repositories/            # Logique d'accès aux données
│   │   ├── schemas/                 # Types
│   │   └── utils/                   # Fonctions utilitaires
│   ├── knexfile.cjs                 # Config Knex
│   └── Dockerfile
│
├── frontend/                         # Application Next.js
│   ├── src/
│   │   ├── app/                     # Pages (App Router)
│   │   │   ├── page.tsx             # Accueil
│   │   │   ├── search/              # Recherche
│   │   │   ├── add-hospital/        # Ajout
│   │   │   └── api/                 # Route Handlers
│   │   ├── components/              # Composants React
│   │   ├── contexts/                # Gestion d'état global
│   │   └── lib/                     # Utilitaires & Validation
│   ├── public/                      # Assets statiques
│   └── Dockerfile
│
└── docker-compose.yaml              # Orchestration`
        }
      ]
    }
  ],
  en: [
    {
      title: "General",
      sections: [
        {
          id: "overview",
          title: "Overview",
          content: `Hospital Map (MedLocator) is a full-stack web application designed to help users locate and manage medical facilities in their area. The application enables users to search for hospitals, clinics, pharmacies, laboratories, and medical offices using an interactive map interface.`
        },
        {
          id: "concept",
          title: "Concept & Usage",
          content: "The application relies on two data sources: the Overpass API (OpenStreetMap) for real-time public data, and a local PostgreSQL database for user-managed facilities.",
          subsections: [
            {
              id: "search-flow",
              title: "1. Searching Facilities",
              content: "Navigate to home, click 'Search', choose a reference point on the map or use your location, set a search radius (1-50 km), and filter by type.",
            },
             {
              id: "add-flow",
              title: "2. Adding a Clinic",
              content: "Use the 'Add Clinic' button, select the precise location on the map, fill in details (name, type, status), and submit. The facility becomes immediately available in local searches.",
            }
          ]
        }
      ]
    },
    {
      title: "Technical",
      sections: [
        {
          id: "stack",
          title: "Tech Stack",
          content: "A modern and performant stack for a smooth user experience.",
          subsections: [
            {
              id: "frontend-tech",
              title: "Frontend",
              content: "Next.js 16 (React 19), TypeScript, Tailwind CSS 4, Leaflet (Mapping), Zod (Validation), React Hook Form."
            },
            {
              id: "backend-tech",
              title: "Backend",
              content: "Node.js 25, Express 5.2.1, PostgreSQL 15, Knex.js (Query Builder)."
            },
            {
              id: "devops-tech",
              title: "DevOps",
              content: "Docker & Docker Compose for container orchestration."
            }
          ]
        },
        {
          id: "architecture",
          title: "System Architecture",
          content: "The application follows a classic three-tier architecture bolstered by Docker containers.",
          code: `┌─────────────────────────────────────────────────┐
│                   Client Layer                  │
│  (Browser - Next.js React Application)          │
│  - UI Components                                │
│  - State Management (React Hooks/Context)       │
│  - Map Visualization (Leaflet)                  │
└────────────┬────────────────────────────────────┘
             │ HTTP/REST
             ▼
┌────────────┴────────────────────────────────────┐
│              Application Layer                  │
│        (Express.js Backend API)                 │
│  - Request validation (Zod)                     │
│  - Business logic (Repositories)                │
│  - Overpass API Proxy (OpenStreetMap)           │
└────────────┬────────────────────────────────────┘
             │ SQL
             ▼
┌────────────┴────────────────────────────────────┐
│                 Data Layer                      │
│         (PostgreSQL Database)                   │
│  - Persistent hospital storage                  │
│  - Geospatial indexing                          │
└─────────────────────────────────────────────────┘`
        },
        {
          id: "structure",
          title: "Project Structure",
          content: "Organization of main project folders and files.",
          code: `hospital-map/
│
├── backend/                          # Express.js API server
│   ├── src/
│   │   ├── server.ts                # Entry point
│   │   ├── db.ts                    # DB Connection
│   │   ├── repositories/            # Data Access Logic
│   │   ├── schemas/                 # Types
│   │   └── utils/                   # Utility functions
│   ├── knexfile.cjs                 # Knex Config
│   └── Dockerfile
│
├── frontend/                         # Next.js Application
│   ├── src/
│   │   ├── app/                     # Pages (App Router)
│   │   │   ├── page.tsx             # Home
│   │   │   ├── search/              # Search
│   │   │   ├── add-hospital/        # Add
│   │   │   └── api/                 # Route Handlers
│   │   ├── components/              # React Components
│   │   ├── contexts/                # Global State
│   │   └── lib/                     # Utils & Validation
│   ├── public/                      # Static Assets
│   └── Dockerfile
│
└── docker-compose.yaml              # Orchestration`
        }
      ]
    }
  ]
};
