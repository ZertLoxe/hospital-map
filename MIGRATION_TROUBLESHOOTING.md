# Migration Troubleshooting Summary

**Date:** January 3, 2026  
**Issue:** Knex migration failing to connect to Aiven PostgreSQL database

---

## Problem Overview

When running `npm run knex:migrate`, the migration would fail with connection timeout errors, despite `psql` being able to connect successfully to the same database.

---

## Issues Encountered

### 1. Initial Connection Timeout (ETIMEDOUT)
```
AggregateError [ETIMEDOUT]: 
    at internalConnectMultiple (node:net:1134:18)
```

**Cause:** Node.js `pg` library was attempting to connect via IPv6 first, which was timing out.

**Investigation:**
- `psql` command worked: `psql 'postgres://User:password@pg-3b020c22-mostaf1111-57d8.k.aivencloud.com:22860/MedLocation?sslmode=require'`
- DNS lookup revealed both IPv4 and IPv6 addresses:
  - IPv4: `209.38.26.89`
  - IPv6: `2c0f:fa18:0:10::d126:1a59`
- Node.js was trying IPv6 first and timing out

### 2. Docker Container DNS Resolution (EAI_AGAIN)
```
getaddrinfo EAI_AGAIN pg-3b020c22-mostaf1111-57d8.k.aivencloud.com
```

**Cause:** Docker container couldn't resolve the Aiven hostname properly.

**Note:** This occurred when attempting to run migrations inside Docker container using `docker compose run --rm backend npm run knex:migrate`

### 3. SSL Certificate Error
```
self-signed certificate in certificate chain
Error: self-signed certificate in certificate chain
```

**Cause:** After switching to IPv4 address, SSL verification was failing because:
- The DATABASE_URL included `?sslmode=require`
- Knex's SSL configuration wasn't being applied due to URL parameter conflict

---

## Solutions Applied

### 1. Use IPv4 Address Instead of Hostname
**Changed:**
```diff
- DATABASE_URL=postgresql://...@pg-3b020c22-mostaf1111-57d8.k.aivencloud.com:22860/MedLocation
+ DATABASE_URL=postgresql://...@209.38.26.89:22860/MedLocation
```

This forced Node.js to use IPv4, avoiding the IPv6 timeout issue.

### 2. Remove SSL Query Parameter
**Changed:**
```diff
- DATABASE_URL=postgresql://...@209.38.26.89:22860/MedLocation?sslmode=require
+ DATABASE_URL=postgresql://...@209.38.26.89:22860/MedLocation
```

Removed `?sslmode=require` to allow Knex configuration to handle SSL.

### 3. Configure SSL in knexfile.cjs
**Updated knexfile.cjs:**
```javascript
module.exports = {
  client: "pg",
  
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  },
  
  pool: {
    min: 0,
    max: 10,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,
  },
  
  migrations: {
    directory: "./src/knex/migrations",
    extension: "cjs",
  },
};
```

---

## Final Working Configuration

### .env
```env
DATABASE_URL=postgresql://user:pwd@209.38.26.89:22860/MedLocation
PORT=5000
NODE_ENV=development
```

### Migration Success
```
> knex --knexfile knexfile.cjs migrate:latest
[dotenv@17.2.3] injecting env (3) from .env
Batch 1 run: 1 migrations
```

---

## Key Takeaways

1. **IPv6 vs IPv4:** When experiencing connection timeouts with cloud databases, check if the hostname resolves to both IPv4 and IPv6. Node.js may prefer IPv6 which could have connectivity issues.

2. **SSL Configuration:** When using connection strings with Aiven or other cloud providers, either:
   - Use `?sslmode=require` in the URL and don't configure SSL in Knex, OR
   - Configure SSL in Knex and don't use `?sslmode=require` in the URL
   - Don't mix both approaches

3. **Docker Networking:** For database connections from Docker containers, consider:
   - Using `network_mode: host` (already configured in docker-compose.yaml)
   - Running migrations from the host machine if Docker networking is problematic

4. **Debugging Tools:**
   - `psql` for testing database connectivity
   - `host <hostname>` to check DNS resolution
   - Direct Node.js pg client tests to isolate issues

---

## Commands Reference

### Run migrations (from host)
```bash
cd backend
npm run knex:migrate
```

### Test database connection with psql
```bash
psql 'postgresql://user:pass@host:port/dbname?sslmode=require'
```

### Check DNS resolution
```bash
host pg-3b020c22-mostaf1111-57d8.k.aivencloud.com
```

### Run migrations in Docker (if needed)
```bash
docker compose run --rm backend npm run knex:migrate
```
