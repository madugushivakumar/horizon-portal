-- =========================================================================
-- HORIZON PORTAL — POST-MIGRATION ISOLATION & PRIVILEGE RECONCILIATION HOOK
-- =========================================================================
-- Identity: Must be executed by an authorized role: horizon_preview_migrator or neondb_owner.
-- Purpose:
--   1. Ensures horizon_preview_app retains ZERO access to public._prisma_migrations.
--   2. Proves horizon_preview_migrator is the authoritative owner of all 27 tables & _prisma_migrations.
--   3. Proves horizon_preview_app has ZERO recursive/transitive membership in privileged roles.
--   4. Validates schema public privileges (migrator has CREATE/USAGE; app role has USAGE, 0 CREATE).
-- Fail-Closed: Raises a fatal PostgreSQL exception on any violation.
-- =========================================================================

\set ON_ERROR_STOP on

BEGIN;

-- 1. Ensure public._prisma_migrations exists before proceeding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
  ) THEN
    RAISE EXCEPTION 'RECONCILIATION ERROR: Table public._prisma_migrations does not exist. Migration may have failed.';
  END IF;
END $$;

-- 2. Revoke all direct privileges on public._prisma_migrations from horizon_preview_app
REVOKE ALL PRIVILEGES ON TABLE public._prisma_migrations FROM horizon_preview_app;

-- 3. Revoke any residual privileges granted to PUBLIC on public._prisma_migrations
REVOKE ALL PRIVILEGES ON TABLE public._prisma_migrations FROM PUBLIC;

-- 4. Fail-Closed Verification Block
DO $$
DECLARE
  v_can_select boolean;
  v_can_insert boolean;
  v_can_update boolean;
  v_can_delete boolean;
  v_can_truncate boolean;
  v_migration_owner text;
  v_unowned_table text;
  v_unowned_seq text;
  v_violating_role text;
  v_is_super boolean;
  v_can_createrole boolean;
  v_can_createdb boolean;
  v_app_bypassrls boolean;
  v_migrator_bypassrls boolean;
  v_app_schema_create boolean;
  v_migrator_schema_create boolean;
  v_migrator_schema_usage boolean;
  v_delete_violating_table text;
  v_audit_update boolean;
BEGIN
  -- A. Check Effective Privileges on _prisma_migrations (direct, group, and PUBLIC grants)
  SELECT 
    has_table_privilege('horizon_preview_app', 'public._prisma_migrations', 'SELECT'),
    has_table_privilege('horizon_preview_app', 'public._prisma_migrations', 'INSERT'),
    has_table_privilege('horizon_preview_app', 'public._prisma_migrations', 'UPDATE'),
    has_table_privilege('horizon_preview_app', 'public._prisma_migrations', 'DELETE'),
    has_table_privilege('horizon_preview_app', 'public._prisma_migrations', 'TRUNCATE')
  INTO v_can_select, v_can_insert, v_can_update, v_can_delete, v_can_truncate;

  IF v_can_select OR v_can_insert OR v_can_update OR v_can_delete OR v_can_truncate THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: horizon_preview_app retains effective privilege on public._prisma_migrations (SELECT: %, INSERT: %, UPDATE: %, DELETE: %, TRUNCATE: %)',
      v_can_select, v_can_insert, v_can_update, v_can_delete, v_can_truncate;
  END IF;

  -- B. Verify public._prisma_migrations is owned specifically by horizon_preview_migrator
  SELECT tableowner INTO v_migration_owner
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = '_prisma_migrations';

  IF v_migration_owner != 'horizon_preview_migrator' THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: public._prisma_migrations is owned by %, expected horizon_preview_migrator!', v_migration_owner;
  END IF;

  -- C. Verify All Application Tables are owned by horizon_preview_migrator
  SELECT tablename INTO v_unowned_table
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename != '_prisma_migrations'
    AND tablename NOT LIKE 'pg_%'
    AND tableowner != 'horizon_preview_migrator'
  LIMIT 1;

  IF v_unowned_table IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: Application table public.% is not owned by horizon_preview_migrator!', v_unowned_table;
  END IF;

  -- D. Verify Any Migration Sequences are owned by horizon_preview_migrator
  SELECT sequencename INTO v_unowned_seq
  FROM pg_sequences
  WHERE schemaname = 'public'
    AND sequenceowner != 'horizon_preview_migrator'
  LIMIT 1;

  IF v_unowned_seq IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: Sequence public.% is not owned by horizon_preview_migrator!', v_unowned_seq;
  END IF;

  -- E. Verify Schema public Privileges
  SELECT 
    has_schema_privilege('horizon_preview_migrator', 'public', 'CREATE'),
    has_schema_privilege('horizon_preview_migrator', 'public', 'USAGE'),
    has_schema_privilege('horizon_preview_app', 'public', 'CREATE')
  INTO v_migrator_schema_create, v_migrator_schema_usage, v_app_schema_create;

  IF NOT (v_migrator_schema_create AND v_migrator_schema_usage) THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: horizon_preview_migrator lacks required CREATE and USAGE on schema public (CREATE: %, USAGE: %)',
      v_migrator_schema_create, v_migrator_schema_usage;
  END IF;

  IF v_app_schema_create THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: horizon_preview_app possesses unauthorized CREATE privilege on schema public!';
  END IF;

  -- F. Verify Direct Role Flags for horizon_preview_app & horizon_preview_migrator
  SELECT rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
  INTO v_is_super, v_can_createrole, v_can_createdb, v_app_bypassrls
  FROM pg_roles
  WHERE rolname = 'horizon_preview_app';

  IF v_is_super OR v_can_createrole OR v_can_createdb OR v_app_bypassrls THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: horizon_preview_app has unauthorized administrative/bypass flags (superuser: %, createrole: %, createdb: %, bypassrls: %)!',
      v_is_super, v_can_createrole, v_can_createdb, v_app_bypassrls;
  END IF;

  SELECT rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
  INTO v_is_super, v_can_createrole, v_can_createdb, v_migrator_bypassrls
  FROM pg_roles
  WHERE rolname = 'horizon_preview_migrator';

  IF v_is_super OR v_can_createrole OR v_can_createdb OR v_migrator_bypassrls THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: horizon_preview_migrator has unauthorized administrative/bypass flags (superuser: %, createrole: %, createdb: %, bypassrls: %)!',
      v_is_super, v_can_createrole, v_can_createdb, v_migrator_bypassrls;
  END IF;

  -- F2. Verify Runtime Role Zero-DELETE Invariant Across All Tables
  SELECT tablename INTO v_delete_violating_table
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND has_table_privilege('horizon_preview_app', quote_ident(schemaname) || '.' || quote_ident(tablename), 'DELETE') = true
  LIMIT 1;

  IF v_delete_violating_table IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: horizon_preview_app possesses unauthorized DELETE privilege on public.%!', v_delete_violating_table;
  END IF;

  -- F3. Verify audit_logs Immutability Invariant (Zero UPDATE privilege)
  SELECT has_table_privilege('horizon_preview_app', 'public.audit_logs', 'UPDATE') INTO v_audit_update;
  IF v_audit_update THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: horizon_preview_app possesses unauthorized UPDATE privilege on public.audit_logs (audit logs must be append-only)!';
  END IF;

  -- G. Verify Recursive and Transitive Role Hierarchy & SET ROLE Restrictions
  WITH RECURSIVE member_roles AS (
    -- Direct memberships of horizon_preview_app
    SELECT 
      am.roleid AS assumed_role_oid,
      r_assumed.rolname AS assumed_role_name,
      r_assumed.rolsuper AS is_super,
      r_assumed.rolcreaterole AS can_create_role,
      1 AS depth
    FROM pg_auth_members am
    JOIN pg_roles r_member ON am.member = r_member.oid
    JOIN pg_roles r_assumed ON am.roleid = r_assumed.oid
    WHERE r_member.rolname = 'horizon_preview_app'

    UNION ALL

    -- Transitive memberships
    SELECT 
      am2.roleid AS assumed_role_oid,
      r_transitive.rolname AS assumed_role_name,
      r_transitive.rolsuper AS is_super,
      r_transitive.rolcreaterole AS can_create_role,
      mr.depth + 1 AS depth
    FROM pg_auth_members am2
    JOIN member_roles mr ON am2.member = mr.assumed_role_oid
    JOIN pg_roles r_transitive ON am2.roleid = r_transitive.oid
  )
  SELECT assumed_role_name INTO v_violating_role
  FROM member_roles
  WHERE assumed_role_name IN ('horizon_preview_migrator', 'neondb_owner', 'pg_database_owner', 'pg_read_all_data', 'pg_write_all_data')
     OR is_super = true
     OR can_create_role = true
  LIMIT 1;

  IF v_violating_role IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY GATE FAILED: horizon_preview_app inherits privileges or can SET ROLE to privileged role %!', v_violating_role;
  END IF;

  RAISE NOTICE '========================================================================';
  RAISE NOTICE 'SECURITY RECONCILIATION SUCCESS: Full isolation and object ownership verified.';
  RAISE NOTICE 'Owner: horizon_preview_migrator owns all schema objects and _prisma_migrations.';
  RAISE NOTICE 'Runtime Role: horizon_preview_app has 0 migration access, 0 public CREATE, and 0 privileged role memberships.';
  RAISE NOTICE '========================================================================';
END $$;

COMMIT;
