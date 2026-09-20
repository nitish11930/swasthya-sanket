# Security Policy — SWASTHYA-SANKET

## Reporting a Vulnerability

Email: **security@swasthya-sanket.gov.in** (placeholder)
Response SLA: 48 hours for critical, 7 days for non-critical.

---

## Security Architecture

### Authentication
- NextAuth v5 with credentials provider (Employee ID + hashed password)
- Session tokens are server-side only (httpOnly cookies)
- JWT payload contains: userId, role, phcId — no sensitive data

### Authorization (RBAC)
- Role checks happen on the **server** in middleware and API route handlers
- Frontend role checks are UX-only — NEVER the authoritative gate
- Every API mutation validates the caller's role before executing

### Data Protection
- All DB connections use TLS
- Environment secrets never in source control (`.env.local` is gitignored)
- API keys never sent to the browser
- Prisma parameterized queries prevent SQL injection

### Audit Trail
- Every state-changing action writes an immutable `audit_log` record
- Audit records include: actor userId, role, action, before/after snapshot, timestamp
- Audit records are append-only — no UPDATE or DELETE permitted on audit_log table
- Database-level trigger enforces append-only constraint

### Transfer Safety
- No transfer can be authorized without human approval (mandatory DB workflow state)
- Donor safety buffer check is deterministic (domain service) — not AI
- AI may suggest a transfer but cannot execute it

### Offline Safety
- Events captured offline (IndexedDB) are synced with optimistic locking
- Server rejects conflicting offline events with HTTP 409 — user must resolve
- Offline events are never silently dropped

### Input Validation
- All API inputs validated with Zod schemas server-side
- TypeScript types enforced at compile time
- No `any` types in domain or API code

### Rate Limiting
- Login endpoint: max 5 attempts per 15 minutes per IP (Phase 1)
- API endpoints: per-role rate limits (Phase 2)

### OWASP Top 10 Mitigations
| Risk | Mitigation |
|------|-----------|
| A01 Broken Access Control | Server-side RBAC on every endpoint |
| A02 Cryptographic Failures | TLS everywhere, bcrypt passwords |
| A03 Injection | Prisma parameterized queries, Zod validation |
| A07 Auth Failures | httpOnly cookies, short session TTL |
| A09 Logging Failures | Immutable audit log for all mutations |

---

## Secret Management

```
# Never commit .env.local
# Use .env.example as template
# In production: use environment variable injection (not files)
```

Secrets required:
- `DATABASE_URL` — PostgreSQL connection string (never logged)
- `NEXTAUTH_SECRET` — 32+ byte random string
- `NEXTAUTH_URL` — canonical app URL
- `AI_API_KEY` — AI provider key (server-side only, never sent to client)
