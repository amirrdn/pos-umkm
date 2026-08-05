# Security Policy

## Supported Versions

We actively support and patch security vulnerabilities in the following versions:

| Version | Supported |
|---------|-----------|
| main    | :white_check_mark: Yes |
| < main  | :x: No |

## Production Security Practices

### Database Row-Level Security (RLS)
- Use a non-superuser database user (e.g., `app_user`) to ensure PostgreSQL RLS policies are enforced.
- Migration `20260623120000_enable_rls` enables `FORCE ROW LEVEL SECURITY` on 15 tables containing `tenantId`.
- For the `tenants` table: run `backend/scripts/tenant_table_rls.sql` — `app_user` is only allowed to SELECT/UPDATE their own row (`id = app.current_tenant_id`). INSERT/DELETE operations on tenants must only be executed via the `postgres` superuser (seeding/migrations).

### Accessing `tenants` Table in the Application
- **Do not** expose `runInSystemContext` or `DIRECT_URL` to general business services.
- `tenantMiddleware` resolves the tenant once (using `app_user` + RLS) and stores it in `req.tenant`.
- Route handlers should use `req.tenant` for subscription and settings metadata; querying business data must go through `app_user` with RLS on the target tables.
- `runInSystemContext` is strictly reserved for auth login/register, platform admin actions, seeding, and operations scripts.

### Authentication
- JWTs are stored in the `auth_token` cookie with `httpOnly`, `sameSite: strict`, and `secure` flags enabled in production.
- The `POST /api/auth/logout` endpoint clears the session cookie.

### Rate Limiting
- `/api/auth/*`: 20 requests / 15 minutes per IP.
- `/api/*` (non-auth): 300 requests / 15 minutes per IP.
- `POST /api/transactions/checkout`: 60 requests / 15 minutes per IP.

### RLS Testing in CI (Optional)
- Set `RLS_TEST_ROLE` to a non-superuser PostgreSQL role to run cross-tenant isolation tests in `prismaRls.test.ts`.

### Platform Admin Audit Trail
- Platform admin tenant inspections are logged as `IMPERSONATE_START` / `IMPERSONATE_END` in `platform_audit_logs`.
- Tenant write operations by platform admins are logged as `TENANT_SCOPED_WRITE`.
- Active inspection sessions are stored in `platform_admin_sessions`.

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately to our team at **security@example.com**.

Your report should include:
- A detailed description of the vulnerability.
- Steps to reproduce the issue (including proof-of-concept scripts or screenshots if available).
- The potential impact of the vulnerability.

Please do not report security vulnerabilities via public GitHub Issues to protect user data.

## SLA (Service Level Agreement)

- **Response SLA**: We will review and respond to your report within **48 hours**.
- **Patch/Mitigation SLA**: We commit to releasing a patch or mitigation for verified vulnerabilities within **7 days** of the initial report.
