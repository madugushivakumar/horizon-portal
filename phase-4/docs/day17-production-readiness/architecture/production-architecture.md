# Production Cloud Architecture: Vercel + Neon PostgreSQL
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

---

## 1. High-Level Architecture Topology

```mermaid
flowchart TD
    subgraph Client ["Client Layer"]
        Browser["Desktop & Mobile Browsers<br/>(Chrome, Safari, Edge, Firefox)"]
    end

    subgraph CDN ["Vercel Edge & CDN Layer"]
        EdgeNetwork["Vercel Anycast Edge Network<br/>- Global SSL / HTTPS Termination<br/>- Static Asset Caching (JS, CSS, SVGs)<br/>- Automated Gzip / Brotli Compression"]
    end

    subgraph Compute ["Vercel Serverless Compute Layer (Next.js 16)"]
        direction TB
        AppRouter["Next.js App Router (16.4.2)<br/>- Server Components Rendering (RSC)<br/>- Partial Prefetching (PPR) Engine"]
        ProxyRouter["Route Proxy (src/proxy.ts)<br/>- Role Verification (Admin/HR/Manager/Employee)<br/>- horizon_session Cookie Validation"]
        APIRoutes["Serverless Route Handlers (/api/v1/*)<br/>- Zod Schema Validation<br/>- JWT Authentication (jose HS256)<br/>- Password Verification (bcrypt)"]
        PrismaClient["Prisma Client 6.19.3 (PostgreSQL Engine)<br/>- Connection Pooling Client (port 6543)<br/>- In-Memory DTO Transformation"]
    end

    subgraph Database ["Neon Managed Database Layer (AWS Region)"]
        direction TB
        PgBouncer["Neon Connection Pooler<br/>(PgBouncer - Port 6543)<br/>- Transaction-Mode Pooling<br/>- High-Concurrency Multiplexing"]
        PostgresEngine["Neon PostgreSQL 16+ Engine<br/>(Direct - Port 5432)<br/>- Auto-Suspend (5 min inactivity)<br/>- Instant Resume (< 500ms)"]
        StorageEngine["Serverless Distributed Storage<br/>- 27 Relational Tables<br/>- 441 Employees, 2,469 Payslips<br/>- Point-in-Time Recovery"]
    end

    subgraph LocalDev ["Isolated Local Development Environment (Preserved)"]
        SQLiteDB["SQLite Database (prisma/dev.db)<br/>- 8 Historical Migrations Preserved<br/>- Local Isolated Verification"]
    end

    Browser -->|HTTPS (TLS 1.3)| EdgeNetwork
    EdgeNetwork -->|Dynamic Requests| AppRouter
    AppRouter --> ProxyRouter
    ProxyRouter --> APIRoutes
    APIRoutes --> PrismaClient
    PrismaClient -->|DATABASE_URL (SSL Required)| PgBouncer
    PgBouncer --> PostgresEngine
    PostgresEngine --> StorageEngine

    %% Migration flow
    VercelCI["Vercel Build / CI/CD"] -.->|DIRECT_URL (DDL Migrations)| PostgresEngine
```

---

## 2. Key Architectural Guarantees

### 2.1 Complete Component & API Colocation
Horizon Portal deploys as a **unified full-stack application**. Both the Next.js presentation layer and backend API routes (`/api/v1/*`) execute within the same Vercel deployment. This eliminates:
- Cross-origin CORS configuration issues between frontend and backend.
- Complex third-party API gateway proxies.
- Separate backend server maintenance costs.

### 2.2 Dual-Engine Database Isolation
- **Production:** Operates on **Neon PostgreSQL 16+** via SSL encryption (`sslmode=require`).
- **Local Development:** Operates on **SQLite (`prisma/dev.db`)**.
- **No Shared State:** The local development database is never targeted by production deployments, preserving local test data and history.

### 2.3 Stateless Serverless Execution
- **Zero Disk Dependency:** No user uploads or transient temporary files are written to the server container.
- **Dynamic File Generation:**
  - Bulk CSV exports are generated and streamed in-memory.
  - Payslip PDF printouts are rendered client-side via React and browser-native `window.print()`.

### 2.4 Scalability & Connection Management
Serverless functions spinning up concurrently can easily exhaust standard PostgreSQL connection limits (e.g., 20–100 connections). Neon’s integrated PgBouncer pooler transparently multiplexes thousands of incoming queries into persistent server connections, ensuring zero connection dropped errors under load.
