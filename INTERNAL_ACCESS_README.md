# Internal access control

Username/password authentication for team-only deployments, with group-based access (`code_access`, `non_code_access`, `guest_access`).

## Database

1. Run `database/migrations/internal_access_system.sql` in the Supabase SQL editor.
2. Create users with **hashed** passwords — do not insert plaintext passwords into SQL.

## Environment

See root `.env.example`. Required for this flow:

- `JWT_SECRET` — required in **production** for signing session JWTs (use a long random string).
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `INTERNAL_USERS_SEED` — JSON array of users to create (local/script only; never commit real passwords):

```json
[
  {
    "username": "your_username",
    "password": "use-a-strong-unique-password",
    "access_group": "code_access"
  }
]
```

Optional HTTP seeding (only if you set a strong random secret):

- `SETUP_USERS_SECRET` — send the same value in the `x-setup-secret` header when calling `POST /api/setup-users`.

## Seed users (CLI)

```bash
# .env.local must include INTERNAL_USERS_SEED and Supabase vars
node scripts/setup-internal-users.js
```

## Security notes

- **Production:** Set `JWT_SECRET`. Sessions will not work correctly without it.
- **Debug API routes** (`/api/debug-*`): Disabled in production unless `ENABLE_DEBUG_API=true`.
- **HTTP migration** (`/api/migrate-healthwellness`): Disabled in production unless `ENABLE_DANGEROUS_MIGRATIONS=true`.
- Password verification and auth logging live in `app/lib/internal-auth.ts` and `app/api/internal-auth/route.ts`.

## Access groups

- **code_access** — full internal tooling
- **non_code_access** — standard internal user
- **guest_access** — limited / temporary (extend in app as needed)

Tables: `internal_users`, `internal_access_logs` (see migration file for schema).
