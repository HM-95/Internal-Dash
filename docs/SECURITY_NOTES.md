Security Notes

Required environment variables
- NEXT_PUBLIC_SUPABASE_URL (public)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (public client key)
- SUPABASE_SERVICE_ROLE_KEY (server only)
- OPENAI_API_KEY (server only)
- GEMINI_API_KEY (server only)
- RESEND_API_KEY (server only, if email sending enabled)

Storage locations
- Local dev: `.env.local` (git-ignored). Never commit.
- Production: Platform-secret store (Vercel/Render/Fly/etc.). Do not embed in code.

Frontend exposure
- `NEXT_PUBLIC_*` values are embedded in the client bundle by design.
  - Treat `NEXT_PUBLIC_SUPABASE_ANON_KEY` as public. RLS must protect data.
  - Never expose service role keys or private API keys in the browser.

Rotation procedure
1) Revoke/rotate in provider dashboard (OpenAI, Google, Supabase, Resend, etc.).
2) Update environment store for all deployments and `.env.local` for dev.
3) Redeploy.
4) If a secret was ever committed, purge from history (see below).

Git history purge (if a secret was committed)
- Install `git filter-repo`:
```bash
brew install git-filter-repo # macOS
```
- Rewrite history to remove old values and force-push:
```bash
git filter-repo --path .env --invert-paths
git push --force --tags origin main
```
- Rotate the compromised keys immediately.

Best practices
- Keep `.env*` in `.gitignore` (already configured).
- Validate required env vars at runtime for critical services.
- Restrict service-role keys to server-only usages in API routes and scripts.
- Use RLS for all user data access; assume client anon key is public.


