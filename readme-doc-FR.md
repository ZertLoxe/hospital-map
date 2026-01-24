# Hospital Map - Localisateur d'Établissements Médicaux

## Vue d'ensemble

Hospital Map (MedLocator) est une application web full-stack conçue pour aider les utilisateurs à localiser et gérer les établissements médicaux dans leur région. L'application permet aux utilisateurs de rechercher des hôpitaux, cliniques, pharmacies, laboratoires et cabinets médicaux à l'aide d'une interface cartographique interactive. Elle intègre des données de l'API Overpass d'OpenStreetMap pour les établissements médicaux réels et maintient sa propre base de données pour les cliniques et hôpitaux ajoutés par les utilisateurs.

**Objectif** : Fournir une plateforme centralisée pour découvrir les établissements médicaux à proximité en fonction de la géolocalisation, du filtrage par type et de la recherche basée sur la distance.

**Objectifs clés** :
- Permettre la recherche en temps réel d'établissements médicaux près de n'importe quel emplacement
- Permettre aux utilisateurs d'ajouter et de gérer les informations sur les hôpitaux/cliniques
- Fournir un support multilingue (Français/Anglais)
- Offrir une visualisation cartographique interactive avec rayon de recherche
- Afficher des informations complètes sur les établissements, y compris les coordonnées et les heures d'ouverture

## Fonctionnalités

### Fonctionnalités principales
- **Recherche cartographique interactive** : Rechercher des établissements médicaux dans un rayon personnalisable (1-50 km)
- **Types d'établissements** : Filtrer par hôpitaux, cliniques, pharmacies, laboratoires et cabinets médicaux
- **Données en temps réel** : Intégration avec l'API Overpass d'OpenStreetMap pour des informations à jour sur les établissements
- **Ajouter des établissements personnalisés** : Les utilisateurs peuvent ajouter de nouveaux hôpitaux/cliniques avec validation
- **Recherche par géolocalisation** : Rechercher en cliquant sur la carte ou en saisissant des noms de lieux
- **Calcul de distance** : Calculer et afficher la distance depuis le point de référence
- **Informations détaillées** : Consulter les numéros de téléphone, adresses, heures d'ouverture et informations d'accessibilité
- **Support multilingue** : Basculer entre les interfaces françaises et anglaises
- **Thème clair/sombre** : Capacité de changement de thème
- **Filtrage des résultats** : Filtrer les résultats de recherche par nom, spécialité, type ou adresse
- **Fonctionnalité d'exportation** : Exporter les résultats de recherche au format CSV
- **Design responsive** : Interface adaptée aux mobiles avec barres latérales rétractables

### Gestion des établissements médicaux
- **Opérations CRUD** : Créer, Lire, Mettre à jour et Supprimer les enregistrements d'hôpitaux/cliniques
- **Suivi du statut** : Suivre le statut de l'établissement (Actif, En construction, En étude)
- **Classification par type** : Plusieurs types d'établissements (Général, Spécialisé, Oncologie, Néphrologie, etc.)
- **Stockage basé sur les coordonnées** : Stocker la latitude/longitude précise pour chaque établissement

## Stack technologique

### Frontend
- **Framework** : Next.js 16 (React 19)
- **Langage** : TypeScript
- **Stylisation** : Tailwind CSS 4
- **Bibliothèques de cartographie** :
  - Leaflet 1.9.4
  - react-leaflet 5.0.0
  - leaflet-geosearch 4.2.2
- **Validation** : Zod 4.2.1
- **Gestion de formulaires** : React Hook Form avec @hookform/resolvers
- **Animations** : GSAP 3.14.2, react-type-animation
- **Composants UI** : Sonner (notifications toast)
- **Gestion des thèmes** : next-themes 0.4.6

### Backend
- **Runtime** : Node.js 25
- **Framework** : Express 5.2.1
- **Langage** : TypeScript
- **Base de données** : PostgreSQL 15 (Alpine)
- **ORM** : Knex.js 3.1.0
- **Validation** : Zod 4.1.13
- **Sécurité** : 
  - Helmet 8.1.0 (sécurité des en-têtes HTTP)
  - CORS 2.8.5
- **Journalisation** : Morgan 1.10.1
- **Environnement** : dotenv 17.2.3

### DevOps & Infrastructure
- **Conteneurisation** : Docker & Docker Compose
- **Développement** : 
  - Nodemon (rechargement à chaud du backend)
  - ts-node (exécution TypeScript)
- **Migrations de base de données** : Knex CLI
- **Linting** : ESLint avec support TypeScript

### APIs externes
- **API Overpass d'OpenStreetMap** : Données d'établissements médicaux en temps réel
- **Points de terminaison multiples** :
  - overpass-api.de
  - overpass.kumi.systems
  - maps.mail.ru/osm/tools/overpass

## Structure du projet

```
hospital-map/
│
├── backend/                          # Serveur API Express.js
│   ├── src/
│   │   ├── server.ts                # Point d'entrée principal de l'application
│   │   ├── db.ts                    # Connexion à la base de données Knex
│   │   ├── data-source.ts           # Configuration de la base de données
│   │   ├── knex/
│   │   │   └── migrations/          # Migrations de schéma de base de données
│   │   │       └── 20260106000000_create_hospitals_simple.cjs
│   │   ├── repositories/            # Couche d'accès aux données
│   │   │   └── hospital.repository.ts
│   │   ├── schemas/                 # Définitions de types TypeScript
│   │   │   └── hospital.schema.ts
│   │   ├── lib/                     # Utilitaires partagés
│   │   │   └── validations.ts       # Schémas de validation Zod
│   │   └── utils/                   # Fonctions utilitaires
│   │       └── distance.js
│   ├── knexfile.cjs                 # Configuration Knex
│   ├── Dockerfile                   # Configuration du conteneur backend
│   ├── package.json                 # Dépendances backend
│   └── tsconfig.json                # Configuration TypeScript
│
├── frontend/                         # Application Next.js
│   ├── src/
│   │   ├── app/                     # Pages du routeur App de Next.js
│   │   │   ├── page.tsx             # Page d'accueil (section hero)
│   │   │   ├── layout.tsx           # Layout racine avec providers
│   │   │   ├── globals.css          # Styles globaux
│   │   │   ├── add-hospital/        # Page d'ajout d'établissement
│   │   │   ├── search/              # Page de recherche
│   │   │   ├── hospital/[id]/       # Page de détails d'établissement
│   │   │   └── api/                 # Gestionnaires de routes API (proxy)
│   │   │       ├── hospitals/       # Points de terminaison CRUD pour hôpitaux
│   │   │       └── add/hospitals/   # Point de terminaison de création d'hôpital
│   │   ├── components/              # Composants React
│   │   │   ├── HeroSection.tsx      # Hero de la page d'accueil
│   │   │   ├── MapClient.tsx        # Composant de carte réutilisable
│   │   │   ├── AddHospitalForm.tsx  # Formulaire d'ajout d'hôpital
│   │   │   ├── SearchMap.tsx        # Interface de recherche principale
│   │   │   ├── navbar.tsx           # Barre de navigation
│   │   │   └── search-map/          # Sous-composants de recherche
│   │   │       ├── SearchSidebar.tsx    # Panneau de recherche gauche
│   │   │       └── ResultsPanel.tsx     # Panneau de résultats droit
│   │   ├── contexts/                # Providers de contexte React
│   │   │   ├── LanguageContext.tsx  # Gestion i18n
│   │   │   └── ThemeContext.tsx     # Changement de thème
│   │   ├── lib/                     # Utilitaires frontend
│   │   │   ├── overpass.ts          # Intégration API Overpass
│   │   │   ├── utils.ts             # Fonctions d'aide
│   │   │   └── validations.ts       # Schémas de validation de formulaires
│   │   ├── locales/                 # Fichiers de traduction
│   │   │   ├── en.json              # Traductions anglaises
│   │   │   └── fr.json              # Traductions françaises
│   │   └── types/                   # Définitions de types TypeScript
│   │       └── hospital.ts          # Définitions de types d'établissements
│   ├── public/                      # Ressources statiques
│   │   └── clinic-hero.png          # Image de la section hero
│   ├── Dockerfile                   # Configuration du conteneur frontend
│   ├── package.json                 # Dépendances frontend
│   ├── next.config.ts               # Configuration Next.js
│   ├── tailwind.config.ts           # Configuration Tailwind CSS
│   └── tsconfig.json                # Configuration TypeScript
│
├── docker-compose.yaml              # Orchestration multi-conteneurs
├── readme-doc-ENG.md                # Documentation en anglais
├── readme-doc-FR.md                 # Ce fichier de documentation
└── readme-steps.md                  # Guide de configuration étape par étape
```

### Responsabilités des répertoires

**Backend (`/backend`)** :
- Gère toutes les opérations de base de données pour les établissements ajoutés par les utilisateurs
- Fournit des points de terminaison d'API RESTful pour les opérations CRUD sur les hôpitaux
- Gère les migrations et le schéma de la base de données
- Implémente la validation des entrées et la sanitisation des données
- Configure les middlewares de sécurité (CORS, Helmet)

**Frontend (`/frontend`)** :
- Rend l'interface utilisateur avec le rendu côté serveur de Next.js
- Gère le routage côté client et l'état
- Intègre les cartes Leaflet pour la visualisation
- Gère la communication API avec le backend et l'API Overpass
- Implémente l'internationalisation et le changement de thème
- Fournit la validation des formulaires et les retours utilisateur

## Architecture

### Architecture système

L'application suit une **architecture trois tiers** :

```
┌─────────────────────────────────────────────────┐
│                Couche Client                    │
│  (Navigateur - Application React Next.js)      │
│  - Composants UI                                │
│  - Gestion d'état (React Hooks/Context)        │
│  - Visualisation cartographique (Leaflet)      │
└────────────┬────────────────────────────────────┘
             │
             │ API HTTP/REST
             │
┌────────────▼────────────────────────────────────┐
│             Couche Application                  │
│          (API Backend Express.js)               │
│  - Validation des requêtes (Zod)               │
│  - Logique métier (Repositories)               │
│  - Intégration API externe (Overpass)          │
└────────────┬────────────────────────────────────┘
             │
             │ Requêtes SQL (Knex)
             │
┌────────────▼────────────────────────────────────┐
│              Couche Données                     │
│         (Base de données PostgreSQL)            │
│  - Stockage des enregistrements d'hôpitaux     │
│  - Données de coordonnées géospatiales         │
└─────────────────────────────────────────────────┘
```

### Patrons de conception

1. **Patron Repository** : 
   - La classe `HospitalRepository` encapsule toutes les opérations de base de données
   - Fournit une couche d'abstraction entre la logique métier et l'accès aux données
   - Situé dans `backend/src/repositories/hospital.repository.ts`

2. **Couche de validation** :
   - Les schémas Zod valident les données côté frontend et backend
   - Garantit la sécurité des types et la validation à l'exécution
   - Règles de validation cohérentes dans toute la pile

3. **Patron Proxy API** :
   - Les routes API de Next.js agissent comme proxy vers les services backend
   - Gère CORS et le transfert de requêtes
   - Situé dans `frontend/src/app/api/`

4. **Patron Context Provider** :
   - Contexte React pour l'état global (Langue, Thème)
   - Évite le prop drilling
   - Utilise `useSyncExternalStore` pour la synchronisation localStorage

5. **Composition de composants** :
   - Composant `MapClient` réutilisable pour différentes vues de carte
   - Interface de recherche modulaire avec `SearchSidebar` et `ResultsPanel`
   - Imports dynamiques pour les composants côté client uniquement (Leaflet)

### Schéma de base de données

**Table hospitals** :
```sql
CREATE TABLE hospitals (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(50) NOT NULL DEFAULT 'General',
  status          VARCHAR(50) NOT NULL DEFAULT 'Active',
  lat             DECIMAL(10,7) NOT NULL,
  lng             DECIMAL(11,7) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_hospitals_location ON hospitals(lat, lng);
CREATE INDEX idx_hospitals_type ON hospitals(type);
CREATE INDEX idx_hospitals_status ON hospitals(status);
```

**Description des champs** :
- `id` : Clé primaire auto-incrémentée
- `name` : Nom de l'hôpital/clinique (3-100 caractères)
- `type` : Type d'établissement (Générale, Spécialisée, Clinique Multidisciplinaire, etc.)
- `status` : Statut opérationnel (Active, En construction, En étude)
- `lat/lng` : Coordonnées géographiques (degrés décimaux)
- `created_at/updated_at` : Horodatages d'audit

## Installation et configuration

### Prérequis

- **Docker Desktop** (recommandé) ou :
  - Node.js 20+ 
  - PostgreSQL 15+
  - npm ou yarn
- **Git** pour cloner le dépôt
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)

### Configuration de l'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Configuration de la base de données
POSTGRES_USER=hospital_user
POSTGRES_PASSWORD=mot_de_passe_securise_ici
DATABASE_URL=postgresql://hospital_user:mot_de_passe_securise_ici@db:5432/hospital_db

# Configuration de l'application
NODE_ENV=development
PORT=5000

# Configuration du frontend
BACKEND_URL=http://backend:5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Étapes d'installation

#### Option 1 : Docker (Recommandé)

1. **Cloner le dépôt** :
   ```bash
   git clone <url-du-depot>
   cd hospital-map
   ```

2. **Créer le fichier d'environnement** :
   ```bash
   # Copier .env.example vers .env et configurer
   cp .env.example .env
   ```

3. **Démarrer tous les services** :
   ```bash
   docker-compose up --build
   ```

4. **Accéder à l'application** :
   - Frontend : http://localhost:3000
   - API Backend : http://localhost:5000
   - Vérification de santé : http://localhost:5000/health

5. **Arrêter les services** :
   ```bash
   docker-compose down
   ```

#### Option 2 : Développement local

**Configuration du Backend** :
```bash
cd backend
npm install
npm run knex:migrate    # Exécuter les migrations de base de données
npm run dev             # Démarrer le serveur de développement
```

**Configuration du Frontend** :
```bash
cd frontend
npm install
npm run dev             # Démarrer le serveur de développement Next.js
```

### Migration de base de données

L'application utilise Knex.js pour les migrations de base de données :

```bash
# Exécuter les migrations
npm run knex:migrate

# Annuler la dernière migration
npm run knex:rollback

# Créer une nouvelle migration
npm run knex:make nom_de_la_migration
```

Les migrations sont automatiquement exécutées au démarrage du conteneur via le script `entrypoint` dans `docker-compose.yaml`.

## Configuration

### Configuration du Backend

**knexfile.cjs** :
```javascript
module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
  migrations: {
    directory: "./src/knex/migrations",
    extension: "cjs"
  }
};
```

**Configuration CORS** (`server.ts`) :
- Origines autorisées : `http://localhost:3000`, `http://127.0.0.1:3000`, `http://192.168.1.16:3000`
- Méthodes autorisées : GET, POST, PUT, DELETE, OPTIONS
- Credentials : Activés

### Configuration du Frontend

**next.config.ts** :
```typescript
const nextConfig = {
  // Optimisation d'image
  images: {
    domains: ['openstreetmap.org']
  },
  // Variables d'environnement
  env: {
    BACKEND_URL: process.env.BACKEND_URL
  }
};
```

**Configuration Tailwind** :
- Palette de couleurs personnalisée pour le thème médical
- Tokens inspirés de Material Design 3
- Support du mode sombre via variables CSS

### Variables d'environnement

| Variable | Description | Défaut | Obligatoire |
|----------|-------------|--------|-------------|
| `POSTGRES_USER` | Nom d'utilisateur de la base de données | hospital_user | Oui |
| `POSTGRES_PASSWORD` | Mot de passe de la base de données | - | Oui |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | - | Oui |
| `PORT` | Port du serveur backend | 5000 | Non |
| `NODE_ENV` | Mode d'environnement | development | Non |
| `BACKEND_URL` | URL de l'API backend (pour le frontend) | http://backend:5000 | Oui |

## Utilisation

### Flux de travail de base

#### 1. Recherche d'établissements médicaux

1. Naviguer vers la page d'accueil
2. Cliquer sur le bouton **"Rechercher"** (visible uniquement si la base de données contient des établissements)
3. Sélectionner un point de référence (hôpital ou emplacement sur la carte)
4. Choisir le rayon de recherche (1-50 km)
5. Filtrer optionnellement par type d'établissement (hôpitaux, cliniques, pharmacies, etc.)
6. Cliquer sur le bouton **"Rechercher"**
7. Visualiser les résultats sur la carte et dans la barre latérale
8. Filtrer les résultats par nom, type ou spécialité
9. Cliquer sur les marqueurs pour des informations détaillées
10. Cliquer sur **"Obtenir l'itinéraire"** pour ouvrir dans une application de carte externe

#### 2. Ajouter un nouvel hôpital/clinique

1. Naviguer vers la page d'accueil
2. Cliquer sur le bouton **"Ajouter une clinique"**
3. Cliquer sur la carte pour sélectionner l'emplacement (ou utiliser la barre de recherche)
4. Remplir le formulaire :
   - **Nom** : Nom de l'hôpital/clinique (3-50 caractères)
   - **Type** : Sélectionner dans la liste déroulante (Générale, Spécialisée, etc.)
   - **Statut** : Active, En construction, ou En étude
5. Le marqueur se met à jour en temps réel lorsque vous cliquez sur la carte
6. Cliquer sur **"Soumettre"** pour enregistrer
7. Recevoir une notification toast de confirmation
8. Redirection vers la page de recherche

#### 3. Visualisation des détails d'un établissement

1. Depuis les résultats de recherche, cliquer sur une carte d'établissement ou un marqueur de carte
2. Visualiser les informations complètes :
   - Nom, type et distance
   - Numéro de téléphone (si disponible)
   - Adresse (si disponible)
   - Heures d'ouverture (si disponibles)
   - Accessibilité fauteuil roulant
   - Indicateur de services d'urgence
3. Cliquer sur **"Obtenir l'itinéraire"** pour la navigation
4. Retour à la recherche avec le bouton retour

#### 4. Changement de langue

1. Cliquer sur le bouton de changement de langue dans la barre de navigation
2. Bascule entre le français (FR) et l'anglais (EN)
3. Tout le texte de l'interface se met à jour immédiatement
4. La préférence est sauvegardée dans localStorage

## Documentation de l'API

### URL de base
- **Production** : `http://localhost:5000`
- **Docker** : `http://backend:5000`

### Points de terminaison

#### Vérification de santé
```http
GET /health
```

**Réponse** :
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2026-01-24T10:30:00.000Z"
}
```

---

#### Créer un hôpital
```http
POST /api/add/hospitals
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "name": "Clinique Casablanca",
  "type": "Générale",
  "status": "Active",
  "lat": 33.5731,
  "lng": -7.5898
}
```

**Réponse** (201 Créé) :
```json
{
  "success": true,
  "message": "Hôpital créé avec succès",
  "data": {
    "id": 1,
    "name": "Clinique Casablanca",
    "type": "Générale",
    "status": "Active",
    "location": {
      "latitude": 33.5731,
      "longitude": -7.5898
    },
    "created_at": "2026-01-24T10:30:00.000Z",
    "updated_at": "2026-01-24T10:30:00.000Z"
  }
}
```

**Erreurs de validation** (400) :
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "field": "name",
      "message": "Le nom de l'hôpital doit contenir au moins 3 caractères."
    }
  ]
}
```

---

#### Obtenir tous les hôpitaux
```http
GET /api/hospitals?type=Générale&status=Active&limit=20&offset=0
```

**Paramètres de requête** :
- `type` (optionnel) : Filtrer par type d'établissement
- `status` (optionnel) : Filtrer par statut opérationnel
- `limit` (optionnel) : Résultats par page (défaut : 20)
- `offset` (optionnel) : Décalage de pagination (défaut : 0)

**Réponse** (200) :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Clinique Casablanca",
      "type": "Générale",
      "status": "Active",
      "location": {
        "latitude": 33.5731,
        "longitude": -7.5898
      },
      "created_at": "2026-01-24T10:30:00.000Z",
      "updated_at": "2026-01-24T10:30:00.000Z"
    }
  ]
}
```

---

#### Obtenir un hôpital par ID
```http
GET /api/hospitals/:id
```

**Réponse** (200) :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Clinique Casablanca",
    "type": "Générale",
    "status": "Active",
    "location": {
      "latitude": 33.5731,
      "longitude": -7.5898
    },
    "created_at": "2026-01-24T10:30:00.000Z",
    "updated_at": "2026-01-24T10:30:00.000Z"
  }
}
```

**Non trouvé** (404) :
```json
{
  "error": "Hospital not found"
}
```

---

#### Mettre à jour un hôpital
```http
PUT /api/hospitals/:id
Content-Type: application/json
```

**Corps de la requête** (tous les champs sont optionnels) :
```json
{
  "name": "Nouveau nom d'hôpital",
  "type": "Spécialisée",
  "status": "En construction",
  "lat": 33.5800,
  "lng": -7.5900
}
```

**Réponse** (200) :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Nouveau nom d'hôpital",
    "type": "Spécialisée",
    "status": "En construction",
    "location": {
      "latitude": 33.5800,
      "longitude": -7.5900
    },
    "created_at": "2026-01-24T10:30:00.000Z",
    "updated_at": "2026-01-24T11:00:00.000Z"
  }
}
```

---

#### Supprimer un hôpital
```http
DELETE /api/hospitals/:id
```

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Hospital deleted successfully"
}
```

---

#### Obtenir le nombre d'hôpitaux
```http
GET /api/hospitals/count?type=Générale&status=Active
```

**Paramètres de requête** :
- `type` (optionnel) : Filtrer par type d'établissement
- `status` (optionnel) : Filtrer par statut opérationnel

**Réponse** (200) :
```json
{
  "count": 42
}
```

### Réponses d'erreur

Tous les points de terminaison peuvent retourner les réponses d'erreur suivantes :

**400 Mauvaise requête** :
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [...]
}
```

**404 Non trouvé** :
```json
{
  "error": "Hospital not found"
}
```

**500 Erreur serveur interne** :
```json
{
  "error": "Failed to process request"
}
```

## Flux de données

### 1. Flux de recherche d'hôpitaux

```
Action utilisateur → Composant Frontend → Sources de données multiples → Résultats fusionnés → Affichage

Flux détaillé :
1. L'utilisateur sélectionne un point de référence et des paramètres de recherche (SearchSidebar)
2. Le frontend effectue des requêtes parallèles :
   a. Récupérer les hôpitaux ajoutés par les utilisateurs depuis l'API backend
      GET /api/hospitals → HospitalRepository → PostgreSQL
   b. Interroger OpenStreetMap via l'API Overpass
      POST https://overpass-api.de/api/interpreter
3. Le backend traite la requête de base de données :
   - Filtrer par type/statut si spécifié
   - Retourner tous les enregistrements correspondants avec coordonnées
4. L'API Overpass retourne les établissements OSM :
   - Analyser les balises d'agrément (hôpital, clinique, pharmacie, etc.)
   - Extraire les métadonnées (téléphone, adresse, heures)
   - Calculer les coordonnées à partir des nœuds/chemins
5. Le frontend fusionne les deux ensembles de données :
   - Calculer les distances depuis le point de référence (formule de Haversine)
   - Appliquer les filtres (type, rayon, filtres rapides)
   - Trier par distance
   - Dédupliquer si nécessaire
6. Afficher les résultats :
   - Rendre les marqueurs sur la carte Leaflet
   - Afficher la liste paginée dans ResultsPanel
   - Activer le filtrage et le tri
```

### 2. Flux d'ajout d'hôpital

```
Saisie utilisateur → Validation → Requête API → Base de données → Confirmation

Flux détaillé :
1. L'utilisateur remplit AddHospitalForm :
   - Cliquer sur la carte pour définir les coordonnées
   - Saisir le nom, sélectionner le type/statut
   - Le formulaire valide au flou (React Hook Form + Zod)
2. Validation frontend (hospitalSchema) :
   - Nom : 3-50 caractères
   - Type : Doit être l'une des options prédéfinies
   - Statut : Active/En construction/En étude
   - Coordonnées : Numéros lat/lng valides
3. La soumission déclenche une requête POST :
   POST /api/add/hospitals
   {
     "name": "...",
     "type": "...",
     "status": "...",
     "lat": 33.5731,
     "lng": -7.5898
   }
4. Le backend reçoit et valide :
   - Le middleware Express analyse le JSON
   - hospitalSchema.safeParse() valide les données
   - Retourne 400 si invalide avec erreurs spécifiques aux champs
5. HospitalRepository.create() :
   - Transformer les données (objet location)
   - Insérer dans PostgreSQL via Knex
   - Retourner l'enregistrement créé avec ID et horodatages
6. Le frontend reçoit la réponse :
   - Afficher un toast de succès (Sonner)
   - Rediriger vers la page /search
   - Le nouvel hôpital apparaît dans les résultats de recherche
```

### 3. Intégration de données OSM en temps réel

```
Requête de recherche → Constructeur de requête Overpass → Appel API → Analyseur de réponse → Mise à jour UI

Flux détaillé :
1. Construire la requête Overpass QL basée sur :
   - Coordonnées du point de référence
   - Rayon de recherche (converti en mètres)
   - Types d'établissements sélectionnés
2. Construire la chaîne de requête :
   [out:json][timeout:30];
   (
     node["amenity"~"hospital|clinic"](around:5000,33.5731,-7.5898);
     way["amenity"~"hospital|clinic"](around:5000,33.5731,-7.5898);
   );
   out center;
3. Exécuter avec logique de nouvelle tentative :
   - Essayer le point de terminaison principal (overpass-api.de)
   - Basculer vers les miroirs en cas de timeout/erreur
   - Timeout de 30 secondes par tentative
   - 3 tentatives totales
4. Analyser la réponse JSON Overpass :
   - Extraire les nœuds (points uniques)
   - Extraire les chemins (bâtiments) avec calcul du centre
   - Lire les balises (nom, téléphone, adresse, heures, etc.)
   - Normaliser les noms de spécialités
5. Transformer en objets MedicalFacility :
   - Mapper les balises d'agrément aux types internes
   - Calculer la distance depuis la référence
   - Formater pour l'affichage
6. Fusionner avec les résultats de la base de données et rendre
```

### 4. Changement de thème et de langue

```
Basculement utilisateur → Mise à jour du contexte → localStorage → Re-rendu

Flux de langue :
1. L'utilisateur clique sur le bouton de changement de langue dans la barre de navigation
2. LanguageContext.toggleLanguage() est appelé
3. La nouvelle langue est sauvegardée dans localStorage
4. L'événement de stockage personnalisé est dispatché
5. useSyncExternalStore déclenche un re-rendu
6. Tous les composants utilisant useLanguage() obtiennent de nouvelles traductions
7. L'attribut lang du document est mis à jour

Flux de thème :
1. L'utilisateur clique sur le bouton de changement de thème
2. ThemeContext met à jour l'état du thème
3. Les variables CSS changent (--primary, --surface, etc.)
4. La préférence est sauvegardée dans localStorage
5. Les composants se re-rendent avec les nouveaux styles
```

## Tests

### Tests backend

Le backend inclut une couverture de tests pour les utilitaires critiques :

```bash
cd backend
npm test
```

**Zones de couverture** :
- Fonctions de calcul de distance (formule de Haversine)
- Schémas de validation
- Méthodes du repository

**Fichiers de test** :
- `src/utils/distance.test.ts` (si existe)
- Rapports de couverture : `backend/coverage/lcov-report/index.html`

### Tests frontend

```bash
cd frontend
npm test
```

**Zones de couverture** :
- Fonctions utilitaires (`lib/utils.ts`)
- Schémas de validation (`lib/validations.ts`)

**Fichiers de test** :
- Rapports de couverture : `frontend/coverage/lcov-report/index.html`

### Liste de contrôle des tests manuels

- [ ] La page d'accueil se charge avec la section hero
- [ ] La navigation entre les pages fonctionne
- [ ] Le formulaire d'ajout d'hôpital valide correctement les entrées
- [ ] Le clic sur la carte met à jour les coordonnées
- [ ] La recherche de lieu trouve des emplacements
- [ ] La recherche avec rayon retourne des résultats
- [ ] Les filtres de type fonctionnent correctement
- [ ] Les résultats peuvent être filtrés et triés
- [ ] Les calculs de distance sont précis
- [ ] Le changement de langue change le texte
- [ ] Le changement de thème modifie les couleurs
- [ ] La mise en page responsive mobile fonctionne
- [ ] L'exportation CSV télécharge le fichier
- [ ] L'API retourne les codes d'état appropriés
- [ ] Les toasts d'erreur s'affichent correctement

### Tests d'API

Utilisez des outils comme Postman, Thunder Client ou cURL :

```bash
# Vérification de santé
curl http://localhost:5000/health

# Obtenir tous les hôpitaux
curl http://localhost:5000/api/hospitals

# Créer un hôpital
curl -X POST http://localhost:5000/api/add/hospitals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hôpital de test",
    "type": "Générale",
    "status": "Active",
    "lat": 33.5731,
    "lng": -7.5898
  }'

# Obtenir le nombre d'hôpitaux
curl http://localhost:5000/api/hospitals/count
```

## Déploiement

### Build de production Docker

1. **Mettre à jour les variables d'environnement** :
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://prod_user:prod_pass@db:5432/hospital_db
   ```

2. **Construire des images optimisées** :
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

3. **Exécuter en mode production** :
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Options de déploiement cloud

**Plateformes recommandées** :
1. **Vercel** (Frontend) : 
   - Déploiement automatique Next.js
   - CDN réseau edge
   - Configuration zéro

2. **Railway/Render** (Backend + Base de données) :
   - Base de données PostgreSQL gérée
   - Hébergement Node.js avec auto-scaling
   - Gestion des variables d'environnement

3. **AWS/GCP/Azure** :
   - ECS/EKS pour les conteneurs Docker
   - RDS pour PostgreSQL
   - CloudFront/CDN pour le frontend

### Liste de contrôle de production

- [ ] Mettre à jour les origines CORS vers le domaine de production
- [ ] Définir des mots de passe de base de données forts
- [ ] Activer les certificats HTTPS/SSL
- [ ] Configurer les variables d'environnement de production
- [ ] Configurer les sauvegardes de base de données
- [ ] Configurer la journalisation et la surveillance
- [ ] Optimiser les images Docker (builds multi-étapes)
- [ ] Configurer le pipeline CI/CD
- [ ] Configurer la limitation de débit
- [ ] Activer le suivi des erreurs (Sentry, etc.)
- [ ] Configurer la surveillance de la vérification de santé
- [ ] Configurer les migrations de base de données automatisées

### Configuration spécifique à l'environnement

**Développement** :
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://hospital_user:password@localhost:5432/hospital_db
BACKEND_URL=http://localhost:5000
```

**Production** :
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://prod_user:secure_password@prod-db-host:5432/hospital_db
BACKEND_URL=https://api.votredomaine.com
NEXT_PUBLIC_API_URL=https://api.votredomaine.com
```

## Considérations de sécurité

### Mesures de sécurité implémentées

1. **Helmet.js** : Sécurise les en-têtes HTTP
   - Content Security Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy

2. **Configuration CORS** : Restreint l'accès API aux origines approuvées

3. **Validation des entrées** : 
   - Les schémas Zod valident toutes les entrées utilisateur
   - Prévention de l'injection SQL via des requêtes paramétrées (Knex)
   - Protection XSS grâce à l'échappement intégré de React

4. **Variables d'environnement** : Les informations sensibles stockées dans `.env` (non commitées)

5. **Constructeur de requêtes SQL** : Knex.js prévient l'injection SQL avec des instructions préparées

6. **TypeScript** : La sécurité des types réduit les erreurs d'exécution

### Meilleures pratiques de sécurité

**Ajouts recommandés** :

1. **Authentification et autorisation** :
   - Implémenter l'authentification basée sur JWT
   - Ajouter des rôles utilisateur (admin, utilisateur, invité)
   - Protéger les points de terminaison d'écriture (POST, PUT, DELETE)

2. **Limitation de débit** :
   ```javascript
   import rateLimit from 'express-rate-limit';
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limiter chaque IP à 100 requêtes par windowMs
   });
   app.use('/api/', limiter);
   ```

3. **Sécurité de la base de données** :
   - Utiliser un utilisateur de base de données en lecture seule pour les requêtes
   - Implémenter la sécurité au niveau des lignes (RLS)
   - Sauvegardes régulières de la base de données
   - Chiffrer les données sensibles au repos

4. **Sécurité de l'API** :
   - Ajouter l'authentification par clé API pour les requêtes Overpass
   - Implémenter la signature de requêtes
   - Ajouter la protection CSRF pour les opérations changeant l'état

5. **Surveillance et journalisation** :
   - Journaliser toutes les tentatives d'authentification
   - Surveiller les modèles suspects
   - Configurer des alertes pour les erreurs/violations

6. **HTTPS** : Toujours utiliser SSL/TLS en production

7. **Sécurité des dépendances** :
   ```bash
   npm audit
   npm audit fix
   ```

### Limitations de sécurité connues

- **Pas d'authentification** : Actuellement, n'importe qui peut ajouter/modifier/supprimer des hôpitaux
- **Pas de limitation de débit** : Les points de terminaison API ne sont pas protégés contre les abus
- **Pas de sanitisation des entrées** : S'appuie uniquement sur la validation Zod
- **Pas de HTTPS** : Le développement s'exécute sur HTTP (doit être activé en production)
- **Wildcards CORS** : Le développement autorise plusieurs origines sans validation stricte

## Limitations

### Limitations techniques actuelles

1. **Requêtes géospatiales** : 
   - Utilise l'approximation par boîte englobante au lieu d'une indexation spatiale appropriée
   - Pas de PostGIS pour des calculs de distance précis
   - Calcul de distance dans la couche application (pas en base de données)

2. **Évolutivité** :
   - Pas de pagination pour les grands ensembles de résultats d'Overpass
   - Pas de mécanisme de mise en cache pour les recherches fréquentes
   - Les appels API synchrones peuvent bloquer sous forte charge

3. **Précision des données** :
   - S'appuie sur la qualité des données OpenStreetMap
   - Les hôpitaux ajoutés par les utilisateurs manquent de vérification
   - Pas de détection de doublons entre les sources de données

4. **Support hors ligne** : 
   - Nécessite une connexion Internet pour les tuiles de carte
   - Pas de mise en cache de carte hors ligne
   - Pas de fonctionnalité PWA

5. **Limitations de recherche** :
   - Rayon maximum : 50 km (limitation de l'API Overpass)
   - Pas de filtrage avancé (heures, évaluations, services)
   - Pas de recherche floue ou de tolérance aux fautes de frappe

6. **UI/UX** :
   - Pas de comptes utilisateur ou de recherches sauvegardées
   - Pas d'avis ou d'évaluations d'établissements
   - Fonctionnalités d'accessibilité limitées
   - Pas d'application mobile (web uniquement)

7. **Tests** :
   - Couverture de test incomplète
   - Pas de tests d'intégration
   - Pas de tests de bout en bout
   - Tests manuels uniquement

### Problèmes connus et dette technique

- **Fichiers vides** : `backend/src/utils/distance.js` existe mais est vide
- **Systèmes de modules mixtes** : Le backend utilise CommonJS pour Knex, ESM pour TypeScript
- **Traductions codées en dur** : Certains textes non externalisés dans les fichiers de locale
- **Pas de limites d'erreur** : Les erreurs React peuvent faire planter toute l'application
- **Migrations de base de données** : Pas de données de seed ou de configuration initiale
- **Persistance des volumes Docker** : Les volumes de développement peuvent conserver des node_modules obsolètes

### Améliorations futures

**Haute priorité** :
- [ ] Ajouter l'authentification et la gestion des utilisateurs
- [ ] Implémenter des requêtes géospatiales appropriées (PostGIS)
- [ ] Ajouter une suite de tests complète
- [ ] Configurer le pipeline CI/CD
- [ ] Implémenter la mise en cache (Redis)

**Priorité moyenne** :
- [ ] Ajouter un système de vérification des établissements
- [ ] Implémenter les avis et évaluations des utilisateurs
- [ ] Ajouter des filtres de recherche avancés
- [ ] Améliorer la réactivité mobile
- [ ] Ajouter le support hors ligne (PWA)

**Basse priorité** :
- [ ] Ajouter des photos d'établissements
- [ ] Implémenter des mises à jour en temps réel (WebSockets)
- [ ] Ajouter un tableau de bord d'analyse
- [ ] Support multi-régions
- [ ] Applications mobiles natives

## Contribution

### Flux de travail de développement

1. **Forker le dépôt**
2. **Créer une branche de fonctionnalité** :
   ```bash
   git checkout -b feature/nom-de-votre-fonctionnalite
   ```
3. **Effectuer des modifications avec des messages de commit clairs** :
   ```bash
   git commit -m "feat: ajouter le filtrage par type d'hôpital"
   ```
4. **Tester vos modifications en profondeur**
5. **Pousser vers votre fork** :
   ```bash
   git push origin feature/nom-de-votre-fonctionnalite
   ```
6. **Ouvrir une Pull Request**

### Conventions de codage

**TypeScript/JavaScript** :
- Utiliser TypeScript pour la sécurité des types
- Suivre les règles ESLint (configurées dans le projet)
- Utiliser des composants fonctionnels avec hooks (React)
- Préférer `const` à `let`, éviter `var`
- Utiliser async/await plutôt que les promesses

**Conventions de nommage** :
- Composants : PascalCase (`HeroSection.tsx`)
- Fonctions : camelCase (`updateLocation()`)
- Constantes : UPPER_SNAKE_CASE (`FACILITY_TYPE_MAP`)
- Fichiers : kebab-case pour les routes, PascalCase pour les composants

**Style de code** :
- Indentation de 2 espaces
- Points-virgules requis
- Guillemets simples pour les chaînes
- Virgules finales dans les objets/tableaux

### Directives de structure de projet

- Placer les routes API dans `frontend/src/app/api/`
- Ajouter de nouveaux composants dans `frontend/src/components/`
- Logique backend dans `backend/src/repositories/`
- Types partagés dans les répertoires respectifs `schemas/` ou `types/`
- Traductions dans `frontend/src/locales/`

## Licence

Cette documentation de projet ne spécifie pas de licence. Veuillez consulter les mainteneurs du projet pour obtenir des informations sur la licence.

---

**Version de la documentation** : 1.0.0  
**Dernière mise à jour** : 24 janvier 2026  
**Maintenu par** : Équipe de développement Hospital Map
