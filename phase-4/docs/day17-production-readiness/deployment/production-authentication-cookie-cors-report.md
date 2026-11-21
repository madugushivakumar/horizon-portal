# Production Authentication, Cookie & CORS Architecture Report
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

> **Milestone:** Phase 4 — Day 17 (Task 17)  
> **Status:** AUDITED & PRODUCTION VERIFIED  
> **Target Environment:** HTTPS Production (Vercel)  
> **Cookie Name:** `horizon_session`

---

## 1. Production Cookie Security Architecture

Horizon Portal uses stateless, cryptographically signed JSON Web Tokens (JWT) encoded into an HTTP-only session cookie named `horizon_session`. In `src/lib/auth/session.ts`, the cookie options are defined dynamically based on `process.env.NODE_ENV`:

```ts
export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: "horizon_session",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: 28800, // 8 hours
  };
}
```

### Security Attribute Analysis in Production:

| Cookie Attribute | Production Setting | Security Value & Compliance |
| :--- | :---: | :--- |
| **`httpOnly`** | `true` | **CRITICAL:** Prevents JavaScript access (`document.cookie`), completely mitigating XSS token extraction attacks. |
| **`secure`** | `true` | **ENFORCED:** Browser will transmit cookie strictly over HTTPS connections. Rejected over plain HTTP. |
| **`sameSite`** | `"lax"` | **DEFENSE-IN-DEPTH:** Mitigates Cross-Site Request Forgery (CSRF) on state-changing requests while enabling seamless navigation from external links. |
| **`path`** | `"/"` | Scoped to the root application path, ensuring all protected routes receive authentication headers. |
| **`maxAge`** | `28800` (8h) | Explicit expiration window; prevents indefinite persistent sessions on shared devices. |

---

## 2. JWT Cryptographic Signing & Validation

- **Algorithm:** HMAC-SHA256 (`HS256`) via the modern, standard `jose` library (`jose.SignJWT`, `jose.jwtVerify`).
- **Secret Key:** `process.env.AUTH_SECRET` (256-bit entropy).
- **Payload Schema:**
  ```json
  {
    "sub": "usr_emp_004",
    "email": "employee@growmar.com",
    "role": "Employee",
    "employeeId": "EMP-0188",
    "iat": 1731823000,
    "exp": 1731851800
  }
  ```
- **Session Revocation:** On logout, `clearSessionCookie(response)` overrides `horizon_session` with empty string, `maxAge: 0`, and `expires: new Date(0)`.

---

## 3. Same-Origin Architecture & CORS Governance

### Single Full-Stack Deployment:
In Vercel, the Next.js App Router UI (`src/app/*`) and API Route Handlers (`src/app/api/v1/*`) are deployed on the exact same domain:
`https://horizon-portal-[unique].vercel.app`

### CORS Security Posture:
1. **Zero Cross-Origin Friction:** Because client fetch calls (`fetch('/api/v1/...')`) target the identical origin, all requests are **same-origin**.
2. **No Wildcard CORS:** No `Access-Control-Allow-Origin: *` headers are used anywhere in the codebase.
3. **No Credential Leakage:** Cookie transmission is governed by native browser same-origin policies.
