# Hospital Map - Medical Facilities Locator

## Overview

Hospital Map (MedLocator) is a full-stack web application designed to help users locate and manage medical facilities in their area. The application enables users to search for hospitals, clinics, pharmacies, laboratories, and medical offices using an interactive map interface. It integrates data from OpenStreetMap's Overpass API for real-world medical facilities and maintains its own database for user-added clinics and hospitals.

**Purpose**: Provide a centralized platform for discovering nearby medical facilities based on geolocation, type filtering, and distance-based search.

**Key Goals**:
- Enable real-time search for medical facilities near any location
- Allow users to add and manage hospital/clinic information
- Provide multi-language support (French/English)
- Offer interactive map visualization with search radius
- Display comprehensive facility information including contact details and operating hours

## Features

### Core Functionality
- **Interactive Map Search**: Search for medical facilities within a customizable radius (1-50 km)
- **Facility Types**: Filter by hospitals, clinics, pharmacies, laboratories, and medical offices
- **Real-time Data**: Integration with OpenStreetMap Overpass API for up-to-date facility information
- **Add Custom Facilities**: Users can add new hospitals/clinics with validation
- **Geolocation Search**: Search by clicking on the map or entering location names
- **Distance Calculation**: Calculate and display distance from reference point
- **Detailed Information**: View phone numbers, addresses, operating hours, and accessibility info
- **Multi-language Support**: Switch between French and English interfaces
- **Dark/Light Theme**: Theme switching capability
- **Results Filtering**: Filter search results by name, specialty, type, or address
- **Export Functionality**: Export search results to CSV format
- **Responsive Design**: Mobile-friendly interface with collapsible sidebars

### Medical Facility Management
- **CRUD Operations**: Create, Read, Update, and Delete hospital/clinic records
- **Status Tracking**: Track facility status (Active, Under Construction, Under Study)
- **Type Classification**: Multiple facility types (General, Specialized, Oncology, Nephrology, etc.)
- **Coordinate-based Storage**: Store precise latitude/longitude for each facility

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Mapping Libraries**:
  - Leaflet 1.9.4
  - react-leaflet 5.0.0
  - leaflet-geosearch 4.2.2
- **Validation**: Zod 4.2.1
- **Form Management**: React Hook Form with @hookform/resolvers
- **Animations**: GSAP 3.14.2, react-type-animation
- **UI Components**: Sonner (toast notifications)
- **Theme Management**: next-themes 0.4.6

### Backend
- **Runtime**: Node.js 25
- **Framework**: Express 5.2.1
- **Language**: TypeScript
- **Database**: PostgreSQL 15 (Alpine)
- **ORM**: Knex.js 3.1.0
- **Validation**: Zod 4.1.13
- **Security**: 
  - Helmet 8.1.0 (HTTP headers security)
  - CORS 2.8.5
- **Logging**: Morgan 1.10.1
- **Environment**: dotenv 17.2.3

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: 
  - Nodemon (backend hot reload)
  - ts-node (TypeScript execution)
- **Database Migrations**: Knex CLI
- **Linting**: ESLint with TypeScript support

### External APIs
- **OpenStreetMap Overpass API**: Real-time medical facility data
- **Multiple Endpoints**:
  - overpass-api.de
  - overpass.kumi.systems
  - maps.mail.ru/osm/tools/overpass

## Project Structure

```
hospital-map/
│
├── backend/                          # Express.js API server
│   ├── src/
│   │   ├── server.ts                # Main application entry point
│   │   ├── db.ts                    # Knex database connection
│   │   ├── data-source.ts           # Database configuration
│   │   ├── knex/
│   │   │   └── migrations/          # Database schema migrations
│   │   │       └── 20260106000000_create_hospitals_simple.cjs
│   │   ├── repositories/            # Data access layer
│   │   │   └── hospital.repository.ts
│   │   ├── schemas/                 # TypeScript type definitions
│   │   │   └── hospital.schema.ts
│   │   ├── lib/                     # Shared utilities
│   │   │   └── validations.ts       # Zod validation schemas
│   │   └── utils/                   # Utility functions
│   │       └── distance.js
│   ├── knexfile.cjs                 # Knex configuration
│   ├── Dockerfile                   # Backend container configuration
│   ├── package.json                 # Backend dependencies
│   └── tsconfig.json                # TypeScript configuration
│
├── frontend/                         # Next.js application
│   ├── src/
│   │   ├── app/                     # Next.js App Router pages
│   │   │   ├── page.tsx             # Home page (Hero section)
│   │   │   ├── layout.tsx           # Root layout with providers
│   │   │   ├── globals.css          # Global styles
│   │   │   ├── add-hospital/        # Add facility page
│   │   │   ├── search/              # Search page
│   │   │   ├── hospital/[id]/       # Facility detail page
│   │   │   └── api/                 # API route handlers (proxy)
│   │   │       ├── hospitals/       # Hospital CRUD endpoints
│   │   │       └── add/hospitals/   # Hospital creation endpoint
│   │   ├── components/              # React components
│   │   │   ├── HeroSection.tsx      # Landing page hero
│   │   │   ├── MapClient.tsx        # Reusable map component
│   │   │   ├── AddHospitalForm.tsx  # Hospital addition form
│   │   │   ├── SearchMap.tsx        # Main search interface
│   │   │   ├── navbar.tsx           # Navigation bar
│   │   │   └── search-map/          # Search feature subcomponents
│   │   │       ├── SearchSidebar.tsx    # Left search panel
│   │   │       └── ResultsPanel.tsx     # Right results panel
│   │   ├── contexts/                # React Context providers
│   │   │   ├── LanguageContext.tsx  # i18n management
│   │   │   └── ThemeContext.tsx     # Theme switching
│   │   ├── lib/                     # Frontend utilities
│   │   │   ├── overpass.ts          # Overpass API integration
│   │   │   ├── utils.ts             # Helper functions
│   │   │   └── validations.ts       # Form validation schemas
│   │   ├── locales/                 # Translation files
│   │   │   ├── en.json              # English translations
│   │   │   └── fr.json              # French translations
│   │   └── types/                   # TypeScript type definitions
│   │       └── hospital.ts          # Facility type definitions
│   ├── public/                      # Static assets
│   │   └── clinic-hero.png          # Hero section image
│   ├── Dockerfile                   # Frontend container configuration
│   ├── package.json                 # Frontend dependencies
│   ├── next.config.ts               # Next.js configuration
│   ├── tailwind.config.ts           # Tailwind CSS configuration
│   └── tsconfig.json                # TypeScript configuration
│
├── docker-compose.yaml              # Multi-container orchestration
├── readme-doc.md                    # This documentation file
├── readme-doc-FR.md                 # Documentation In Frensh
└── readme-steps.md                  # Step-by-step setup guide
```

### Directory Responsibilities

**Backend (`/backend`)**:
- Handles all database operations for user-added facilities
- Provides RESTful API endpoints for hospital CRUD operations
- Manages database migrations and schema
- Implements input validation and data sanitization
- Configures security middleware (CORS, Helmet)

**Frontend (`/frontend`)**:
- Renders user interface with Next.js server-side rendering
- Manages client-side routing and state
- Integrates Leaflet maps for visualization
- Handles API communication with both backend and Overpass API
- Implements internationalization and theme switching
- Provides form validation and user feedback

## Architecture

### System Architecture

The application follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────┐
│                   Client Layer                  │
│  (Browser - Next.js React Application)         │
│  - UI Components                                │
│  - State Management (React Hooks/Context)      │
│  - Map Visualization (Leaflet)                 │
└────────────┬────────────────────────────────────┘
             │
             │ HTTP/REST API
             │
┌────────────▼────────────────────────────────────┐
│              Application Layer                  │
│        (Express.js Backend API)                 │
│  - Request validation (Zod)                    │
│  - Business logic (Repositories)               │
│  - External API integration (Overpass)         │
└────────────┬────────────────────────────────────┘
             │
             │ SQL Queries (Knex)
             │
┌────────────▼────────────────────────────────────┐
│                Data Layer                       │
│          (PostgreSQL Database)                  │
│  - Hospital records storage                    │
│  - Geospatial coordinate data                  │
└─────────────────────────────────────────────────┘
```

### Design Patterns

1. **Repository Pattern**: 
   - `HospitalRepository` class encapsulates all database operations
   - Provides abstraction layer between business logic and data access
   - Located in `backend/src/repositories/hospital.repository.ts`

2. **Validation Layer**:
   - Zod schemas validate data on both frontend and backend
   - Ensures type safety and runtime validation
   - Consistent validation rules across the stack

3. **API Proxy Pattern**:
   - Next.js API routes act as proxy to backend services
   - Handles CORS and request forwarding
   - Located in `frontend/src/app/api/`

4. **Context Provider Pattern**:
   - React Context for global state (Language, Theme)
   - Prevents prop drilling
   - Uses `useSyncExternalStore` for localStorage synchronization

5. **Component Composition**:
   - Reusable `MapClient` component for different map views
   - Modular search interface with `SearchSidebar` and `ResultsPanel`
   - Dynamic imports for client-only components (Leaflet)

### Database Schema

**hospitals table**:
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

-- Indexes
CREATE INDEX idx_hospitals_location ON hospitals(lat, lng);
CREATE INDEX idx_hospitals_type ON hospitals(type);
CREATE INDEX idx_hospitals_status ON hospitals(status);
```

**Field Descriptions**:
- `id`: Auto-incrementing primary key
- `name`: Hospital/clinic name (3-100 characters)
- `type`: Facility type (Générale, Spécialisée, Clinique Multidisciplinaire, etc.)
- `status`: Operational status (Active, En construction, En étude)
- `lat/lng`: Geographic coordinates (decimal degrees)
- `created_at/updated_at`: Audit timestamps

## Installation & Setup

### Prerequisites

- **Docker Desktop** (recommended) or:
  - Node.js 20+ 
  - PostgreSQL 15+
  - npm or yarn
- **Git** for cloning the repository
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Environment Configuration

Create a `.env` file in the project root:

```env
# Database Configuration
POSTGRES_USER=hospital_user
POSTGRES_PASSWORD=secure_password_here
DATABASE_URL=postgresql://hospital_user:secure_password_here@db:5432/hospital_db

# Application Configuration
NODE_ENV=development
PORT=5000

# Frontend Configuration
BACKEND_URL=http://backend:5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Installation Steps

#### Option 1: Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd hospital-map
   ```

2. **Create environment file**:
   ```bash
   # Copy .env.example to .env and configure
   cp .env.example .env
   ```

3. **Start all services**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

5. **Stop services**:
   ```bash
   docker-compose down
   ```

#### Option 2: Local Development

**Backend Setup**:
```bash
cd backend
npm install
npm run knex:migrate    # Run database migrations
npm run dev             # Start development server
```

**Frontend Setup**:
```bash
cd frontend
npm install
npm run dev             # Start Next.js dev server
```

### Database Migration

The application uses Knex.js for database migrations:

```bash
# Run migrations
npm run knex:migrate

# Rollback last migration
npm run knex:rollback

# Create new migration
npm run knex:make migration_name
```

Migrations are automatically run on container startup via the `entrypoint` script in `docker-compose.yaml`.

## Configuration

### Backend Configuration

**knexfile.cjs**:
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

**CORS Configuration** (`server.ts`):
- Allowed origins: `http://localhost:3000`, `http://127.0.0.1:3000`, `http://192.168.1.16:3000`
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Credentials: Enabled

### Frontend Configuration

**next.config.ts**:
```typescript
const nextConfig = {
  // Image optimization
  images: {
    domains: ['openstreetmap.org']
  },
  // Environment variables
  env: {
    BACKEND_URL: process.env.BACKEND_URL
  }
};
```

**Tailwind Configuration**:
- Custom color scheme for medical theme
- Material Design 3 inspired tokens
- Dark mode support via CSS variables

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_USER` | Database username | hospital_user | Yes |
| `POSTGRES_PASSWORD` | Database password | - | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `PORT` | Backend server port | 5000 | No |
| `NODE_ENV` | Environment mode | development | No |
| `BACKEND_URL` | Backend API URL (for frontend) | http://backend:5000 | Yes |

## Usage

### Basic Workflows

#### 1. Searching for Medical Facilities

1. Navigate to the homepage
2. Click **"Search"** button (only visible if database has facilities)
3. Select a reference point (hospital or location on map)
4. Choose search radius (1-50 km)
5. Optionally filter by facility type (hospitals, clinics, pharmacies, etc.)
6. Click **"Search"** button
7. View results on map and in sidebar
8. Filter results by name, type, or specialty
9. Click markers for detailed information
10. Click **"Get Directions"** to open in external map app

#### 2. Adding a New Hospital/Clinic

1. Navigate to homepage
2. Click **"Add Clinic"** button
3. Click on the map to select location (or use search bar)
4. Fill in the form:
   - **Name**: Hospital/clinic name (3-50 characters)
   - **Type**: Select from dropdown (Générale, Spécialisée, etc.)
   - **Status**: Active, En construction, or En étude
5. Marker updates in real-time as you click the map
6. Click **"Submit"** to save
7. Receive confirmation toast notification
8. Redirected to search page

#### 3. Viewing Facility Details

1. From search results, click on a facility card or map marker
2. View comprehensive information:
   - Name, type, and distance
   - Phone number (if available)
   - Address (if available)
   - Operating hours (if available)
   - Wheelchair accessibility
   - Emergency services indicator
3. Click **"Get Directions"** for navigation
4. Return to search with back button

#### 4. Language Switching

1. Click language toggle in navbar
2. Switches between French (FR) and English (EN)
3. All interface text updates immediately
4. Preference saved to localStorage

## API Documentation

### Base URL
- **Production**: `http://localhost:5000`
- **Docker**: `http://backend:5000`

### Endpoints

#### Health Check
```http
GET /health
```

**Response**:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2026-01-24T10:30:00.000Z"
}
```

---

#### Create Hospital
```http
POST /api/add/hospitals
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Clinique Casablanca",
  "type": "Générale",
  "status": "Active",
  "lat": 33.5731,
  "lng": -7.5898
}
```

**Response** (201 Created):
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

**Validation Errors** (400):
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

#### Get All Hospitals
```http
GET /api/hospitals?type=Générale&status=Active&limit=20&offset=0
```

**Query Parameters**:
- `type` (optional): Filter by facility type
- `status` (optional): Filter by operational status
- `limit` (optional): Results per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200):
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

#### Get Hospital by ID
```http
GET /api/hospitals/:id
```

**Response** (200):
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

**Not Found** (404):
```json
{
  "error": "Hospital not found"
}
```

---

#### Update Hospital
```http
PUT /api/hospitals/:id
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "name": "New Hospital Name",
  "type": "Spécialisée",
  "status": "En construction",
  "lat": 33.5800,
  "lng": -7.5900
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "New Hospital Name",
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

#### Delete Hospital
```http
DELETE /api/hospitals/:id
```

**Response** (200):
```json
{
  "success": true,
  "message": "Hospital deleted successfully"
}
```

---

#### Get Hospital Count
```http
GET /api/hospitals/count?type=Générale&status=Active
```

**Query Parameters**:
- `type` (optional): Filter by facility type
- `status` (optional): Filter by operational status

**Response** (200):
```json
{
  "count": 42
}
```

### Error Responses

All endpoints may return the following error responses:

**400 Bad Request**:
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [...]
}
```

**404 Not Found**:
```json
{
  "error": "Hospital not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to process request"
}
```

## Data Flow

### 1. Hospital Search Flow

```
User Action → Frontend Component → Multiple Data Sources → Merged Results → Display

Detailed Flow:
1. User selects reference point and search parameters (SearchSidebar)
2. Frontend makes parallel requests:
   a. Fetch user-added hospitals from backend API
      GET /api/hospitals → HospitalRepository → PostgreSQL
   b. Query OpenStreetMap via Overpass API
      POST https://overpass-api.de/api/interpreter
3. Backend processes database query:
   - Filter by type/status if specified
   - Return all matching records with coordinates
4. Overpass API returns OSM facilities:
   - Parse amenity tags (hospital, clinic, pharmacy, etc.)
   - Extract metadata (phone, address, hours)
   - Calculate coordinates from nodes/ways
5. Frontend merges both datasets:
   - Calculate distances from reference point (Haversine formula)
   - Apply filters (type, radius, quick filters)
   - Sort by distance
   - Deduplicate if necessary
6. Display results:
   - Render markers on Leaflet map
   - Show paginated list in ResultsPanel
   - Enable filtering and sorting
```

### 2. Add Hospital Flow

```
User Input → Validation → API Request → Database → Confirmation

Detailed Flow:
1. User fills AddHospitalForm:
   - Click map to set coordinates
   - Enter name, select type/status
   - Form validates on blur (React Hook Form + Zod)
2. Frontend validation (hospitalSchema):
   - Name: 3-50 characters
   - Type: Must be one of predefined options
   - Status: Active/En construction/En étude
   - Coordinates: Valid lat/lng numbers
3. Submit triggers POST request:
   POST /api/add/hospitals
   {
     "name": "...",
     "type": "...",
     "status": "...",
     "lat": 33.5731,
     "lng": -7.5898
   }
4. Backend receives and validates:
   - Express middleware parses JSON
   - hospitalSchema.safeParse() validates data
   - Returns 400 if invalid with field-specific errors
5. HospitalRepository.create():
   - Transform data (location object)
   - Insert into PostgreSQL via Knex
   - Return created record with ID and timestamps
6. Frontend receives response:
   - Show success toast (Sonner)
   - Redirect to /search page
   - New hospital appears in search results
```

### 3. Real-time OSM Data Integration

```
Search Request → Overpass Query Builder → API Call → Response Parser → UI Update

Detailed Flow:
1. Build Overpass QL query based on:
   - Reference point coordinates
   - Search radius (converted to meters)
   - Selected facility types
2. Construct query string:
   [out:json][timeout:30];
   (
     node["amenity"~"hospital|clinic"](around:5000,33.5731,-7.5898);
     way["amenity"~"hospital|clinic"](around:5000,33.5731,-7.5898);
   );
   out center;
3. Execute with retry logic:
   - Try primary endpoint (overpass-api.de)
   - Fallback to mirrors if timeout/error
   - 30-second timeout per attempt
   - 3 total retries
4. Parse Overpass JSON response:
   - Extract nodes (single points)
   - Extract ways (buildings) with center calculation
   - Read tags (name, phone, address, hours, etc.)
   - Normalize specialty names
5. Transform to MedicalFacility objects:
   - Map amenity tags to internal types
   - Calculate distance from reference
   - Format for display
6. Merge with database results and render
```

### 4. Theme & Language Switching

```
User Toggle → Context Update → localStorage → Re-render

Language Flow:
1. User clicks language toggle in navbar
2. LanguageContext.toggleLanguage() called
3. New language saved to localStorage
4. Custom storage event dispatched
5. useSyncExternalStore triggers re-render
6. All components using useLanguage() get new translations
7. Document lang attribute updated

Theme Flow:
1. User clicks theme toggle
2. ThemeContext updates theme state
3. CSS variables switch (--primary, --surface, etc.)
4. Preference saved to localStorage
5. Components re-render with new styles
```

## Testing

### Backend Testing

The backend includes test coverage for critical utilities:

```bash
cd backend
npm test
```

**Coverage Areas**:
- Distance calculation functions (Haversine formula)
- Validation schemas
- Repository methods

**Test Files**:
- `src/utils/distance.test.ts` (if exists)
- Coverage reports: `backend/coverage/lcov-report/index.html`

### Frontend Testing

```bash
cd frontend
npm test
```

**Coverage Areas**:
- Utility functions (`lib/utils.ts`)
- Validation schemas (`lib/validations.ts`)

**Test Files**:
- Coverage reports: `frontend/coverage/lcov-report/index.html`

### Manual Testing Checklist

- [ ] Homepage loads with hero section
- [ ] Navigation between pages works
- [ ] Add hospital form validates input correctly
- [ ] Map click updates coordinates
- [ ] Location search finds places
- [ ] Search with radius returns results
- [ ] Type filters work correctly
- [ ] Results can be filtered and sorted
- [ ] Distance calculations are accurate
- [ ] Language toggle switches text
- [ ] Theme toggle changes colors
- [ ] Mobile responsive layout works
- [ ] Export CSV downloads file
- [ ] API returns proper status codes
- [ ] Error toasts display correctly

### API Testing

Use tools like Postman, Thunder Client, or cURL:

```bash
# Health check
curl http://localhost:5000/health

# Get all hospitals
curl http://localhost:5000/api/hospitals

# Create hospital
curl -X POST http://localhost:5000/api/add/hospitals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Hospital",
    "type": "Générale",
    "status": "Active",
    "lat": 33.5731,
    "lng": -7.5898
  }'

# Get hospital count
curl http://localhost:5000/api/hospitals/count
```

## Deployment

### Docker Production Build

1. **Update environment variables**:
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://prod_user:prod_pass@db:5432/hospital_db
   ```

2. **Build optimized images**:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

3. **Run in production mode**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Cloud Deployment Options

**Recommended Platforms**:
1. **Vercel** (Frontend): 
   - Automatic Next.js deployment
   - Edge network CDN
   - Zero-config setup

2. **Railway/Render** (Backend + Database):
   - PostgreSQL managed database
   - Auto-scaling Node.js hosting
   - Environment variable management

3. **AWS/GCP/Azure**:
   - ECS/EKS for Docker containers
   - RDS for PostgreSQL
   - CloudFront/CDN for frontend

### Production Checklist

- [ ] Update CORS origins to production domain
- [ ] Set strong database passwords
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure production environment variables
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Optimize Docker images (multi-stage builds)
- [ ] Set up CI/CD pipeline
- [ ] Configure rate limiting
- [ ] Enable error tracking (Sentry, etc.)
- [ ] Set up health check monitoring
- [ ] Configure automated database migrations

### Environment-Specific Configuration

**Development**:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://hospital_user:password@localhost:5432/hospital_db
BACKEND_URL=http://localhost:5000
```

**Production**:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://prod_user:secure_password@prod-db-host:5432/hospital_db
BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Security Considerations

### Implemented Security Measures

1. **Helmet.js**: Secures HTTP headers
   - Content Security Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy

2. **CORS Configuration**: Restricts API access to approved origins

3. **Input Validation**: 
   - Zod schemas validate all user input
   - SQL injection prevention via parameterized queries (Knex)
   - XSS protection through React's built-in escaping

4. **Environment Variables**: Sensitive credentials stored in `.env` (not committed)

5. **SQL Query Builder**: Knex.js prevents SQL injection with prepared statements

6. **TypeScript**: Type safety reduces runtime errors

### Security Best Practices

**Recommended Additions**:

1. **Authentication & Authorization**:
   - Implement JWT-based authentication
   - Add user roles (admin, user, guest)
   - Protect write endpoints (POST, PUT, DELETE)

2. **Rate Limiting**:
   ```javascript
   import rateLimit from 'express-rate-limit';
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/api/', limiter);
   ```

3. **Database Security**:
   - Use read-only database user for queries
   - Implement row-level security (RLS)
   - Regular database backups
   - Encrypt sensitive data at rest

4. **API Security**:
   - Add API key authentication for Overpass requests
   - Implement request signing
   - Add CSRF protection for state-changing operations

5. **Monitoring & Logging**:
   - Log all authentication attempts
   - Monitor for suspicious patterns
   - Set up alerts for errors/breaches

6. **HTTPS**: Always use SSL/TLS in production

7. **Dependency Security**:
   ```bash
   npm audit
   npm audit fix
   ```

### Known Security Limitations

- **No Authentication**: Currently, anyone can add/modify/delete hospitals
- **No Rate Limiting**: API endpoints are not protected from abuse
- **No Input Sanitization**: Relies solely on Zod validation
- **No HTTPS**: Development runs on HTTP (must enable in production)
- **CORS Wildcards**: Development allows multiple origins without strict validation

## Limitations

### Current Technical Limitations

1. **Geospatial Queries**: 
   - Uses bounding box approximation instead of proper spatial indexing
   - No PostGIS for accurate distance calculations
   - Distance calculation in application layer (not database)

2. **Scalability**:
   - No pagination for large result sets from Overpass
   - No caching mechanism for frequent searches
   - Synchronous API calls may block under high load

3. **Data Accuracy**:
   - Relies on OpenStreetMap data quality
   - User-added hospitals lack verification
   - No duplicate detection across data sources

4. **Offline Support**: 
   - Requires internet connection for map tiles
   - No offline map caching
   - No PWA functionality

5. **Search Limitations**:
   - Maximum radius: 50 km (Overpass API limitation)
   - No advanced filtering (hours, ratings, services)
   - No fuzzy search or typo tolerance

6. **UI/UX**:
   - No user accounts or saved searches
   - No facility reviews or ratings
   - Limited accessibility features
   - No mobile app (web only)

7. **Testing**:
   - Incomplete test coverage
   - No integration tests
   - No end-to-end tests
   - Manual testing only

### Known Issues & Technical Debt

- **Empty Files**: `backend/src/utils/distance.js` exists but is empty
- **Mixed Module Systems**: Backend uses CommonJS for Knex, ESM for TypeScript
- **Hardcoded Translations**: Some text not externalized to locale files
- **No Error Boundaries**: React errors may crash entire app
- **Database Migrations**: No seed data or initial setup
- **Docker Volume Persistence**: Development volumes may retain stale node_modules

### Future Improvements

**High Priority**:
- [ ] Add authentication and user management
- [ ] Implement proper geospatial queries (PostGIS)
- [ ] Add comprehensive test suite
- [ ] Set up CI/CD pipeline
- [ ] Implement caching (Redis)

**Medium Priority**:
- [ ] Add facility verification system
- [ ] Implement user reviews and ratings
- [ ] Add advanced search filters
- [ ] Improve mobile responsiveness
- [ ] Add offline support (PWA)

**Low Priority**:
- [ ] Add facility photos
- [ ] Implement real-time updates (WebSockets)
- [ ] Add analytics dashboard
- [ ] Multi-region support
- [ ] Native mobile apps

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make changes with clear commit messages**:
   ```bash
   git commit -m "feat: add hospital type filtering"
   ```
4. **Test your changes thoroughly**
5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request**

### Coding Conventions

**TypeScript/JavaScript**:
- Use TypeScript for type safety
- Follow ESLint rules (configured in project)
- Use functional components with hooks (React)
- Prefer `const` over `let`, avoid `var`
- Use async/await over promises

**Naming Conventions**:
- Components: PascalCase (`HeroSection.tsx`)
- Functions: camelCase (`updateLocation()`)
- Constants: UPPER_SNAKE_CASE (`FACILITY_TYPE_MAP`)
- Files: kebab-case for routes, PascalCase for components

**Code Style**:
- 2-space indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in objects/arrays

### Project Structure Guidelines

- Place API routes in `frontend/src/app/api/`
- Add new components in `frontend/src/components/`
- Backend logic in `backend/src/repositories/`
- Shared types in respective `schemas/` or `types/` directories
- Translations in `frontend/src/locales/`

## License

This project documentation does not specify a license. Please consult with the project maintainers for licensing information.

---

**Documentation Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Maintained By**: Hospital Map Development Team
