Deploy Runbook

Environment variables
- NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anon key (client)
- SUPABASE_SERVICE_ROLE_KEY: Service role key (server write ops)
- OPENAI_API_KEY: OpenAI key for embeddings
- GEMINI_API_KEY: Google Generative AI key (Gemini 1.5 Flash)

Local development
```bash
npm install
npm run dev
```

Database migration
- Apply `supabase-migration.sql` and `supabase-migration-creator-index.sql` in Supabase SQL editor.

Populate semantic index
```bash
npm run populate-creator-index reset
```

Images
- Update `next.config.js` `images.domains` to include any external hosts you load avatars/images from.

Production deploy
- Set all environment variables in your hosting platform.
- Ensure service role key is stored securely and only used server-side.
- Run `npm run build` and `npm start` (or host-specific steps).

Health checks & logs
- API routes log key steps (session creation, DB queries, AI calls). Use platform logs to monitor 500s.
- Verify `/api/chat-history` returns data after login.

Common failures
- Missing image hosts in `next.config.js` cause Next/Image errors.
- RLS blocking writes when service role key is missing in the environment.

Related
- ./TROUBLESHOOTING.md


