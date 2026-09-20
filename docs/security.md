# Security Documentation — SWASTHYA-SANKET

See also: [SECURITY.md](../SECURITY.md) (top-level summary)

## Threat Model

| Threat | Impact | Mitigation |
|--------|--------|-----------|
| Unauthorized transfer approval | Patient harm, medicine theft | Server RBAC + human approval mandatory |
| Data tampering (edit audit log) | Loss of accountability | Append-only DB constraint + trigger |
| SQL injection | Data breach | Prisma parameterized queries |
| Session hijacking | Impersonation | httpOnly cookies, short TTL |
| Mass assignment | Privilege escalation | Zod schema strips unknown fields |
| Offline event forgery | Fake inventory events | Server validates all synced events |
| AI hallucination in arithmetic | Wrong transfer quantities | AI never does arithmetic — deterministic only |
| API key exposure | Cost/data leakage | Server-side only, env vars |

## Authentication Design

```
Employee ID + Password
    → bcrypt verify (server)
    → NextAuth session (httpOnly cookie)
    → JWT: { userId, employeeId, role, phcId, districtId }
    → Session TTL: 8 hours (shift length)
    → Refresh: extends on activity
```

## Authorization Matrix

| Operation | ANM | MO | PHC-Head | District Officer | State Admin |
|-----------|-----|----|---------|--------------------|-------------|
| View own PHC stock | ✅ | ✅ | ✅ | ✅ | ✅ |
| Log inventory event | ✅ | ✅ | ✅ | ✅ | ❌ |
| Request transfer | ❌ | ✅ | ✅ | ✅ | ❌ |
| Approve transfer | ❌ | ✅* | ✅ | ✅ | ❌ |
| View district stock | ❌ | ❌ | ❌ | ✅ | ✅ |
| View audit log | ❌ | ❌ | ✅ | ✅ | ✅ |
| Resolve discrepancy | ❌ | ✅ | ✅ | ✅ | ❌ |

*MO can only approve within same PHC

## Audit Log Design

The `audit_log` table is **append-only** enforced at the database level:

```sql
-- Applied during migration:
CREATE RULE no_update_audit AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_log DO INSTEAD NOTHING;
```

Every record includes:
- `actor_id` + `actor_role` — who did it
- `action` — enum of all possible actions
- `entity_type` + `entity_id` — what was affected
- `before` + `after` — JSONB snapshot of the changed record
- `ip_address` + `user_agent` — device fingerprint
- `occurred_at` — server timestamp (not client-supplied)

## Offline Sync Security

1. Each offline event has a client-generated `idempotency_key` (UUID v4)
2. Server rejects events with duplicate idempotency keys (prevents replay)
3. Server rejects events with timestamps > 24 hours old
4. Server re-validates all offline events with the same Zod schemas
5. Optimistic locking: server rejects conflicting events (409 Conflict)
6. Unresolvable conflicts require human intervention — never silently dropped
