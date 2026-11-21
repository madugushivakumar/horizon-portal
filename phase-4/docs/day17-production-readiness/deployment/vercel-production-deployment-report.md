# Stage 11: Vercel Production Deployment Configuration Specification
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

> **Milestone:** Phase 4 — Day 17 (Task 17)  
> **Stage:** Stage 11 — Vercel Project Configuration  
> **Status:** SPECIFICATION READY FOR GATED DEPLOYMENT  
> **Target Repository:** `madugushivakumar/horizon-portal` (Branch: `main`)  
> **Target Platform:** Vercel Global Edge & Serverless Infrastructure  
> **Framework Preset:** Next.js (Version 16.4.2, Turbopack / Webpack hybrid build)

---

## 1. Project Configuration Settings

| Setting | Value | Rationale |
| :--- | :--- | :--- |
| **Project Name** | `horizon-portal` | Canonical project naming |
| **Git Repository** | `madugushivakumar/horizon-portal` | Connected via native GitHub app integration |
| **Production Branch** | `main` | Default release branch |
| **Framework Preset** | `Next.js` | Full App Router and Route Handlers support |
| **Root Directory** | `./` | Root repository deployment |
| **Node.js Version** | `20.x` | Production LTS runtime |
| **Build Command** | `npm run build:prod` | Compiles PostgreSQL Prisma Client before `next build --webpack` |
| **Output Directory** | `.next` (Default) | Standard Next.js production build output |
| **Install Command** | `npm install` | Clean production dependency installation |

---

## 2. Production Environment Variables Configuration

Configure the following environment variables securely in the **Vercel Dashboard > Project Settings > Environment Variables** (Scope: Production & Preview):

| Variable Name | Type / Scope | Target Value Description |
| :--- | :---: | :--- |
| **`DATABASE_URL`** | Sensitive Secret | Neon Pooled Connection String (Port 6543, `?sslmode=require&pgbouncer=true`) |
| **`DIRECT_URL`** | Sensitive Secret | Neon Direct Connection String (Port 5432, `?sslmode=require`) |
| **`AUTH_SECRET`** | Sensitive Secret | 64-character cryptographically secure hex key for JWT cookie signing |
| **`NODE_ENV`** | System | Automatically injected by Vercel (`"production"`) |
| **`APP_URL`** | Public / URL | `https://horizon-portal-[subdomain].vercel.app` (Live HTTPS URL) |

### Strict Security Rules:
- No secrets may be marked with `NEXT_PUBLIC_`.
- Plaintext secrets and credentials must never be included in `vercel.json` or committed to source control.
- `AUTH_SECRET` must be generated using `openssl rand -hex 32` or Node's `crypto.randomBytes(32).toString('hex')`.

---

## 3. Deployment Gating & Execution Sequence

1. **Step 1 — Database Handshake & Migration (Gate B):** Neon PostgreSQL provisioned, migration applied (`npm run prisma:migrate:pg`).
2. **Step 2 — Data Pack Seeding (Gate C):** 23 datasets seeded into Neon (`npm run db:seed:pg`).
3. **Step 3 — Vercel Setup & Environment Injection:** Variables configured in Vercel.
4. **Step 4 — Trigger Production Deployment:** Deploy `main` branch to production.
5. **Step 5 — Live HTTPS Verification:** Perform 4-role smoke testing on live public domain.
