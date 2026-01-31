# Hospital Map - Setup Guide

This guide will help you set up the Hospital Map project on a new machine.

---

## Prerequisites

Before starting, ensure you have the following installed:

| Software | Version | Download Link |
|----------|---------|---------------|
| Node.js | v18+ | https://nodejs.org/ |
| Docker & Docker Compose | Latest | https://www.docker.com/ |
| Git | Latest | https://git-scm.com/ |
| MySQL/PostgreSQL | Latest | (if not using Docker) |

---

## Quick Start (Docker)

The easiest way to run the project:

```bash
# 1. Clone the repository
git clone <repository-url>
cd hospital-map

# 2. Start all services with Docker
docker-compose up --build

# 3. Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

---

## Manual Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd hospital-map
```

### Step 2: Database Setup

1. Create a new database:
   ```sql
   CREATE DATABASE hospital_map;
   ```

2. Run the SQL script to set up tables:
   ```bash
   # Using MySQL
   mysql -u root -p hospital_map < "CREATE DATABASE hospital_map;.sql"
   
   # Using PostgreSQL
   psql -U postgres -d hospital_map -f "CREATE DATABASE hospital_map;.sql"
   ```

### Step 3: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env
# Or manually create .env file (see Environment Variables section)

# Start development server
npm run dev
```

The backend will run on **http://localhost:5000**

### Step 4: Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file (if needed)
copy .env.example .env.local
# Or manually create .env.local file

# Start development server
npm run dev
```

The frontend will run on **http://localhost:3000**

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_map

# JWT Secret (generate a random string)
JWT_SECRET=your_jwt_secret_key
```

### Frontend (`frontend/.env.local`)

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Google Maps API Key (REQUIRED)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Important:** To obtain a Google Maps API Key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API (optional, for enhanced features)
4. Go to "Credentials" and create an API key
5. (Recommended) Restrict the API key to your domain for production use

---

## Project Structure

```
hospital-map/
├── backend/                 # Node.js backend API
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/                # Next.js frontend
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml       # Docker orchestration
├── CREATE DATABASE hospital_map;.sql  # Database schema
└── readme-steps.md          # This file
```

---

## Available Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run linter |

---

## Troubleshooting

### Port Already in Use

```bash
# Windows - Find and kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change the port in .env file
```

### Database Connection Failed

1. Ensure database server is running
2. Verify credentials in `.env` file
3. Check if database `hospital_map` exists
4. Ensure firewall allows connections

### Node Modules Issues

```bash
# Delete node_modules and reinstall
rd /s /q node_modules
del package-lock.json
npm install
```

### Docker Issues

```bash
# Rebuild containers from scratch
docker-compose down -v
docker-compose up --build --force-recreate
```

---

## Production Deployment

### Using Docker

```bash
# Build and run in production mode
docker-compose -f docker-compose.prod.yml up --build -d
```

### Manual Deployment

1. Build frontend: `cd frontend && npm run build`
2. Build backend: `cd backend && npm run build`
3. Set `NODE_ENV=production` in environment
4. Use a process manager like PM2 for the backend
5. Serve frontend with Nginx or similar

---

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the console/terminal for error messages
3. Ensure all environment variables are correctly set
4. Verify all prerequisites are installed

---

## License

This project documentation does not specify a license. Please consult with the project maintainers for licensing information.