# Production Environment Variable Inventory & Security Governance
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

---

## 1. Master Environment Variable Inventory

| Variable Name | Required Scope | Sensitivity | Target Value Format / Example | Configuration Location |
| :--- | :---: | :---: | :--- | :--- |
| **`DATABASE_URL`** | Production, Preview | **CRITICAL (Secret)** | `postgresql://[user]:[password]@[neon-host]:6543/[dbname]?sslmode=require&pgbouncer=true` | Vercel Environment Variables |
| **`DIRECT_URL`** | Production, Preview | **CRITICAL (Secret)** | `postgresql://[user]:[password]@[neon-host]:5432/[dbname]?sslmode=require` | Vercel Environment Variables |
| **`AUTH_SECRET`** | Production, Preview | **CRITICAL (Secret)** | 64-char Hex String (Generated via `openssl rand -hex 32`) | Vercel Environment Variables |
| **`NODE_ENV`** | Production | Low (System) | `"production"` | Automatically injected by Vercel |
| **`APP_URL`** | Production, Preview | Low (Public) | `https://horizon-portal-[unique].vercel.app` | Vercel Environment Variables |

---

## 2. Variable Descriptions & Runtime Integration

### 2.1 `DATABASE_URL` (Pooled Connection)
- **Runtime Consumer:** `src/lib/prisma.ts` & Prisma Client.
- **Port:** `6543`
- **Purpose:** Multiplexes all runtime web application queries through Neon’s PgBouncer pooler. Prevents connection spikes from overwhelming PostgreSQL during traffic surges.
- **Security Rule:** Must include `sslmode=require`.

### 2.2 `DIRECT_URL` (Direct Migration Connection)
- **Runtime Consumer:** Prisma CLI during `prisma migrate deploy` and `db:seed`.
- **Port:** `5432`
- **Purpose:** Connects directly to the PostgreSQL compute instance in session mode, allowing DDL transactions and advisory locks required for migration tracking.

### 2.3 `AUTH_SECRET` (JWT Signing Key)
- **Runtime Consumer:** `src/lib/auth/token.ts` & `src/proxy.ts`.
- **Purpose:** Serves as the secret cryptographic HMAC-SHA256 key for signing and verifying `horizon_session` cookies.
- **Generation:** Must be generated using a cryptographically secure pseudo-random number generator:
  ```bash
  openssl rand -hex 32
  ```

### 2.4 `NODE_ENV`
- **Runtime Consumer:** `src/lib/auth/session.ts` & Next.js core.
- **Purpose:** Toggles production optimizations (React Compiler, minification, caching) and triggers `secure: true` on the `horizon_session` cookie to enforce HTTPS transmission.

---

## 3. Strict Security Governance & Hygiene Rules

1. **Zero Secret Leakage in Source Code:** No connection strings, passwords, or tokens may be hardcoded anywhere in `src/`, `prisma/`, or `scripts/`.
2. **Zero Secrets in Git History:** `.env` and `.env.local` are explicitly ignored in `.gitignore`.
3. **No `NEXT_PUBLIC_` Exposure:** Secrets (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`) must **NEVER** be prefixed with `NEXT_PUBLIC_`, ensuring they are never bundled into client-side JavaScript.
4. **No Secrets in Logs or Evidence:** Connection strings and secret keys are masked in all screenshots, test logs, and Markdown reports.
5. **Secret Rotation Procedure:** If `AUTH_SECRET` is rotated, all existing active user sessions expire gracefully, prompting users to re-authenticate at `/login` without application errors.
