-- =========================================================================
-- HORIZON PORTAL — PREVIEW RUNTIME ROLE LEAST-PRIVILEGE DML GRANTS
-- =========================================================================
-- Target Database: Dedicated Neon Preview Database (neondb on branch preview-day18-empty)
-- Target Role: horizon_preview_app
-- Precondition: MUST be executed AFTER Prisma migrations have been applied by horizon_preview_migrator.
--
-- Security Controls Enforced:
--   - Explicit table-by-table DML grants based on actual source code requirements.
--   - ZERO DELETE grants across all 27 application tables.
--   - audit_logs is append-only (SELECT, INSERT only; ZERO UPDATE, ZERO DELETE).
--   - Announcements is read-only (SELECT only).
--   - ZERO privileges on public._prisma_migrations.
--   - ZERO DDL privileges (no CREATE, ALTER, DROP, TRUNCATE).
-- =========================================================================

\set ON_ERROR_STOP on

BEGIN;

-- 1. Tables requiring SELECT, INSERT, UPDATE (3 Tables)
-- Rationale:
--   - employees: Created by HR/Admin (INSERT), updated on profile/diffs (UPDATE), queried (SELECT).
--   - leave_requests: Submitted by employee (INSERT), status approved/rejected (UPDATE), queried (SELECT).
--   - notifications: Dispatched by system (INSERT), marked as read (UPDATE), queried (SELECT).
GRANT SELECT, INSERT, UPDATE ON TABLE public.employees TO horizon_preview_app;
GRANT SELECT, INSERT, UPDATE ON TABLE public.leave_requests TO horizon_preview_app;
GRANT SELECT, INSERT, UPDATE ON TABLE public.notifications TO horizon_preview_app;

-- 2. Tables requiring SELECT, UPDATE (4 Tables)
-- Rationale:
--   - users: Authenticated (SELECT), soft-deactivated via isActive=false (UPDATE).
--   - payroll_runs: Queried (SELECT), approved via status="Approved" (UPDATE).
--   - leave_balances: Queried (SELECT), balance decremented/restored on approval (UPDATE).
--   - tasks: Queried for Kanban (SELECT), status/version updated on board drag-and-drop (UPDATE).
GRANT SELECT, UPDATE ON TABLE public.users TO horizon_preview_app;
GRANT SELECT, UPDATE ON TABLE public.payroll_runs TO horizon_preview_app;
GRANT SELECT, UPDATE ON TABLE public.leave_balances TO horizon_preview_app;
GRANT SELECT, UPDATE ON TABLE public.tasks TO horizon_preview_app;

-- 3. Tables requiring SELECT, INSERT (2 Tables)
-- Rationale:
--   - audit_logs: Appended by compliance logger (INSERT), queried by admin (SELECT). Strictly immutable!
--   - manager_delegations: Delegated by manager (INSERT), queried by approval engine (SELECT).
GRANT SELECT, INSERT ON TABLE public.audit_logs TO horizon_preview_app;
GRANT SELECT, INSERT ON TABLE public.manager_delegations TO horizon_preview_app;

-- 4. Tables requiring SELECT Only (18 Read-Only Application & Reference Tables)
-- Rationale:
--   - Reference, catalog, historical analytics, financial, or read-only insight records.
GRANT SELECT ON TABLE public.departments TO horizon_preview_app;
GRANT SELECT ON TABLE public.roles TO horizon_preview_app;
GRANT SELECT ON TABLE public.leave_types TO horizon_preview_app;
GRANT SELECT ON TABLE public.holidays TO horizon_preview_app;
GRANT SELECT ON TABLE public.attendance_monthly TO horizon_preview_app;
GRANT SELECT ON TABLE public.teams TO horizon_preview_app;
GRANT SELECT ON TABLE public.sprints TO horizon_preview_app;
GRANT SELECT ON TABLE public.clients TO horizon_preview_app;
GRANT SELECT ON TABLE public.vendors TO horizon_preview_app;
GRANT SELECT ON TABLE public.invoices TO horizon_preview_app;
GRANT SELECT ON TABLE public.expenses TO horizon_preview_app;
GRANT SELECT ON TABLE public.announcements TO horizon_preview_app;
GRANT SELECT ON TABLE public.hr_faqs TO horizon_preview_app;
GRANT SELECT ON TABLE public.chatbot_responses TO horizon_preview_app;
GRANT SELECT ON TABLE public.ai_anomaly_results TO horizon_preview_app;
GRANT SELECT ON TABLE public.ai_attrition_risk TO horizon_preview_app;
GRANT SELECT ON TABLE public.payroll_adjustments TO horizon_preview_app;
GRANT SELECT ON TABLE public.payslips TO horizon_preview_app;

-- 5. Sequence Usage Privileges (If sequences are present for auto-increment keys)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO horizon_preview_app;

-- 6. Strict Exclusion of Migration History
REVOKE ALL PRIVILEGES ON TABLE public._prisma_migrations FROM horizon_preview_app;
REVOKE ALL PRIVILEGES ON TABLE public._prisma_migrations FROM PUBLIC;

COMMIT;

-- =========================================================================
-- RUNTIME PRIVILEGE VERIFICATION QUERIES
-- =========================================================================

-- Verify Zero DELETE Privileges across all public tables
SELECT tablename, 
       has_table_privilege('horizon_preview_app', quote_ident(schemaname) || '.' || quote_ident(tablename), 'DELETE') AS can_delete
FROM pg_tables
WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
  AND has_table_privilege('horizon_preview_app', quote_ident(schemaname) || '.' || quote_ident(tablename), 'DELETE') = true;
-- Expected Result: Zero rows returned (Empty).

-- Verify Zero Access on _prisma_migrations
SELECT 
  has_table_privilege('horizon_preview_app', 'public._prisma_migrations', 'SELECT') AS can_select,
  has_table_privilege('horizon_preview_app', 'public._prisma_migrations', 'INSERT') AS can_insert,
  has_table_privilege('horizon_preview_app', 'public._prisma_migrations', 'UPDATE') AS can_update,
  has_table_privilege('horizon_preview_app', 'public._prisma_migrations', 'DELETE') AS can_delete,
  has_table_privilege('horizon_preview_app', 'public._prisma_migrations', 'TRUNCATE') AS can_truncate;
-- Expected Result: All false.

-- Verify audit_logs Immutability (Zero UPDATE)
SELECT has_table_privilege('horizon_preview_app', 'public.audit_logs', 'UPDATE') AS audit_can_update;
-- Expected Result: false.
