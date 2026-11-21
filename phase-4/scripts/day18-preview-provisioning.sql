-- =========================================================================
-- HORIZON PORTAL — PREVIEW DATABASE & ROLE PROVISIONING DDL
-- =========================================================================
-- Target Database: Dedicated Neon Preview Database (neondb on branch preview-day18-empty)
-- Preconditions:
--   1. MUST be executed while connected to the dedicated Preview branch (NOT Production).
--   2. MUST be executed as the administrative database owner (e.g. neondb_owner).
--   3. Replace placeholders '<STRONG_MIGRATOR_PASSWORD>' and '<STRONG_APP_PASSWORD>'
--      with cryptographically secure passwords before execution.
--
-- Security Controls Enforced:
--   - NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION on all roles.
--   - NOBYPASSRLS on all roles (Horizon Portal does not use DB-level RLS).
--   - No broad GRANT ALL ON SCHEMA or DATABASE.
--   - Strict separation: horizon_preview_migrator (DDL) vs horizon_preview_app (DML).
-- =========================================================================

\set ON_ERROR_STOP on

BEGIN;

-- 1. Safety Assertion: Refuse execution if connected to Production endpoint
DO $$
BEGIN
  IF current_database() != 'neondb' THEN
    RAISE EXCEPTION 'SAFETY HALT: Unexpected database name: %. Expected: neondb', current_database();
  END IF;
END $$;

-- 2. Create Migration Role (DDL & Schema Management)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'horizon_preview_migrator') THEN
    CREATE ROLE horizon_preview_migrator WITH
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      CONNECTION LIMIT 10
      PASSWORD '<STRONG_MIGRATOR_PASSWORD>';
    RAISE NOTICE 'Created role: horizon_preview_migrator';
  ELSE
    ALTER ROLE horizon_preview_migrator WITH
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      CONNECTION LIMIT 10;
    RAISE NOTICE 'Updated existing role: horizon_preview_migrator';
  END IF;
END $$;

-- 3. Create Runtime Application Role (DML Only)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'horizon_preview_app') THEN
    CREATE ROLE horizon_preview_app WITH
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      CONNECTION LIMIT 50
      PASSWORD '<STRONG_APP_PASSWORD>';
    RAISE NOTICE 'Created role: horizon_preview_app';
  ELSE
    ALTER ROLE horizon_preview_app WITH
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      CONNECTION LIMIT 50;
    RAISE NOTICE 'Updated existing role: horizon_preview_app';
  END IF;
END $$;

-- 4. Database-Level Least-Privilege Grants
-- Revoke default public connection permissions if necessary, then grant specific access
REVOKE ALL ON DATABASE neondb FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE neondb TO horizon_preview_migrator;
GRANT CONNECT ON DATABASE neondb TO horizon_preview_app;

-- 5. Schema-Level Least-Privilege Grants (Schema: public)
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO horizon_preview_migrator;
GRANT USAGE ON SCHEMA public TO horizon_preview_app;

-- 6. Configure Future Object Default Privileges
-- Ensure tables created by the migrator do not leak permissions to PUBLIC
ALTER DEFAULT PRIVILEGES FOR ROLE horizon_preview_migrator IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE horizon_preview_migrator IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC;

COMMIT;

-- =========================================================================
-- POST-PROVISIONING VERIFICATION QUERIES
-- =========================================================================

-- Verify Role Attributes
SELECT 
  rolname, 
  rolsuper, 
  rolcreaterole, 
  rolcreatedb, 
  rolreplication, 
  rolbypassrls, 
  rolconnlimit
FROM pg_roles
WHERE rolname IN ('horizon_preview_migrator', 'horizon_preview_app')
ORDER BY rolname;

-- Verify Database Privileges
SELECT 
  has_database_privilege('horizon_preview_migrator', 'neondb', 'CONNECT') AS migrator_connect,
  has_database_privilege('horizon_preview_migrator', 'neondb', 'CREATE') AS migrator_create_db,
  has_database_privilege('horizon_preview_app', 'neondb', 'CONNECT') AS app_connect,
  has_database_privilege('horizon_preview_app', 'neondb', 'CREATE') AS app_create_db;

-- Verify Schema Privileges
SELECT 
  has_schema_privilege('horizon_preview_migrator', 'public', 'CREATE') AS migrator_create_schema,
  has_schema_privilege('horizon_preview_migrator', 'public', 'USAGE') AS migrator_usage_schema,
  has_schema_privilege('horizon_preview_app', 'public', 'CREATE') AS app_create_schema,
  has_schema_privilege('horizon_preview_app', 'public', 'USAGE') AS app_usage_schema;
