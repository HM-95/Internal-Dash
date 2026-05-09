# Internal Dash

Internal Dash is an internal tool for **creator growth and analytics**: compare creators side by side, track performance signals (followers, engagement, views, momentum), segment with filters, and run repeatable lists for outreach and partnerships. It is built as a portfolio / demo codebase; you connect your own Supabase project and configuration.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Postgres). Optional Stripe for subscription flows.

---

## What it does

1. **Growth and analytics** – Rich creator profiles with platform breakdowns, trend-style metrics, and scoring to prioritize who to work with and why.
2. **Lists and operations** – Build and maintain creator lists, tags, and imports so teams can share a single view of the pipeline.
3. **Discovery** – Talent-network style browsing with filters (platform, location, niche, performance bands) to narrow large catalogs quickly.
4. **Login** – Team username/password access with short-lived JWT sessions (no public self-serve signup in this flow).
5. **Alpha: assisted discovery** – Early experimental chat / similarity helpers existed in the codebase; treat them as **alpha** only, not the product focus. They need extra API keys if you choose to turn them on.
6. **Data** – Backed by Supabase; SQL migrations in the repo describe tables you can apply to your own project.

---

## Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) project (free tier is enough to try the app)
- Optional: Stripe keys if you exercise billing routes
- Optional: OpenAI / Gemini keys **only** if you want to experiment with the legacy alpha assisted-discovery pieces (see `docs/`)

---

## Setup (step by step)

**1. Clone and install**

```bash
git clone https://github.com/HM-95/Internal-Dash.git
cd Internal-Dash
npm install
```

**2. Environment file**

```bash
cp .env.example .env.local
```

Edit `.env.local`. At minimum set:

- `NEXT_PUBLIC_SUPABASE_URL` – from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon (public) key
- `SUPABASE_SERVICE_ROLE_KEY` – service role key (server and scripts only; never expose in the browser)
- `JWT_SECRET` – long random string for signing session cookies (required for a serious deploy; see `.env.example` for local notes)
- `NEXT_PUBLIC_APP_URL` – e.g. `http://localhost:3000` for local dev

Add Stripe or AI keys only if you need those paths.

**3. Database schema**

In the Supabase SQL editor, run the migrations that match what you want to use. Start with:

- `database/migrations/internal_access_system.sql` (internal login tables)

Other `.sql` files in the repo root and `database/` document additional tables and changes; apply them in a sensible order for your use case, or follow notes in `docs/` if you need a full production-like schema.

**4. Create login users**

Internal users are not hardcoded in the repo. Set `INTERNAL_USERS_SEED` in `.env.local` to a JSON array, for example:

```json
[{"username":"admin","password":"choose-a-strong-password","access_group":"code_access"}]
```

Then run:

```bash
node scripts/setup-internal-users.js
```

More detail: [INTERNAL_ACCESS_README.md](./INTERNAL_ACCESS_README.md).

**5. Run the app**

```bash
npm run dev
```

Open http://localhost:3000 and sign in with the user you seeded.

**6. Production build (optional check)**

```bash
npm run build
npm run start
```

---

## Useful commands

- `npm run dev` – development server  
- `npm run build` – production build  
- `npm run start` – run production server  
- `npm run populate-creator-index` – optional; rebuilds search index for alpha assisted flows (needs OpenAI + service role; see `docs/`)

---

## Security notes for reviewers

Do not commit `.env.local` or real API keys. The service role key and `JWT_SECRET` must stay server-side. In production, debug and migration HTTP endpoints stay off unless you explicitly set the flags described in [docs/SECURITY_NOTES.md](./docs/SECURITY_NOTES.md).

---

## More documentation

- [INTERNAL_ACCESS_README.md](./INTERNAL_ACCESS_README.md) – internal auth and seeding  
- [docs/](./docs/) – Stripe, migrations, troubleshooting, and optional alpha features  

## License

[MIT](./LICENSE) – Copyright Hariprasad Mohandas & Odin Lund.
