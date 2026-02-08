# Database Migrations

This directory contains SQL migration scripts for the Civic Sense Portal database.

## Prerequisites

- PostgreSQL 14+ installed
- PostGIS extension available
- Database created: `civic_sense_db`

## Setup Database

```bash
# Create database (run in PostgreSQL)
psql -U postgres
CREATE DATABASE civic_sense_db;
\q

# Or using psql command directly
psql -U postgres -c "CREATE DATABASE civic_sense_db;"
```

## Running Migrations

### Option 1: Using psql command line

```bash
# Run all migrations in order
psql -U postgres -d civic_sense_db -f migrations/001_initial_schema.sql
```

### Option 2: Using Node.js migration script

```bash
# From server directory
npm run migrate
```

### Option 3: Using the provided migration script

```bash
# From server directory
node migrations/run-migrations.js
```

## Migration Files

- `001_initial_schema.sql` - Initial database schema with all tables, indexes, and default data

## Rollback

To drop all tables and start fresh:

```sql
-- Connect to database
psql -U postgres -d civic_sense_db

-- Drop all tables (this will delete all data!)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS routing_rules CASCADE;
DROP TABLE IF EXISTS issue_updates CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP EXTENSION IF EXISTS postgis CASCADE;
```

## Verify Installation

```sql
-- Check tables
\dt

-- Check PostGIS
SELECT PostGIS_version();

-- Check sample data
SELECT * FROM departments;
SELECT * FROM routing_rules;
```

## Connection String Format

```
postgresql://username:password@localhost:5432/civic_sense_db
```

For `.env` file:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/civic_sense_db
```
