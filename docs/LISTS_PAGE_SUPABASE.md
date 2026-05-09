## Lists Page ↔ Supabase Integration Guide

This guide defines the schema, security, and frontend wiring to make the Lists page fully functional and future‑proof when connected to the dashboard.

### TL;DR
- Lists are user‑owned; creators are linked to a list via a junction table.
- Tags are normalized per user and attached to lists via a junction.
- Optional metrics cache prevents heavy per‑request aggregation.
- Frontend reads/writes are scoped by list id only (no shared global arrays).

---

### 1) Prerequisites
- Supabase project with Auth enabled
- `creators` master table exists
- Next.js client with `@supabase/supabase-js`

Env vars:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-only
```

---

### 2) Schema

#### lists
```sql
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  visibility text not null default 'private' check (visibility in ('private','team','public')),
  is_archived boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_lists_owner on public.lists(owner_user_id);
```

#### list_creators (junction)
```sql
create table if not exists public.list_creators (
  list_id uuid not null references public.lists(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  added_at timestamptz not null default now(),
  added_by_user_id uuid not null references auth.users(id),
  notes text,
  primary key (list_id, creator_id)
);
create index if not exists idx_list_creators_list on public.list_creators(list_id);
create index if not exists idx_list_creators_creator on public.list_creators(creator_id);
```

#### list_metrics_cache (recommended)
```sql
create table if not exists public.list_metrics_cache (
  list_id uuid primary key references public.lists(id) on delete cascade,
  avg_followers numeric not null default 0,
  avg_views numeric not null default 0,
  avg_engagement numeric not null default 0,
  avg_buzz numeric not null default 0,
  creator_count integer not null default 0,
  recalculated_at timestamptz not null default now()
);
```

#### tags (per‑user)
```sql
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_user_id, lower(name))
);
create index if not exists idx_tags_owner on public.tags(owner_user_id);
```

#### list_tags (junction)
```sql
create table if not exists public.list_tags (
  list_id uuid not null references public.lists(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (list_id, tag_id)
);
create index if not exists idx_list_tags_list on public.list_tags(list_id);
create index if not exists idx_list_tags_tag on public.list_tags(tag_id);
```

---

### 3) RLS Policies
Enable RLS:
```sql
alter table public.lists enable row level security;
alter table public.list_creators enable row level security;
alter table public.list_metrics_cache enable row level security;
alter table public.tags enable row level security;
alter table public.list_tags enable row level security;
```

Policies:
```sql
-- lists: owner CRUD/SELECT
create policy lists_owner_select on public.lists for select using (owner_user_id = auth.uid());
create policy lists_owner_crud   on public.lists for all    using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- list_creators: owner of parent list
create policy list_creators_owner on public.list_creators
for all
using (
  exists (select 1 from public.lists l where l.id = list_creators.list_id and l.owner_user_id = auth.uid())
)
with check (
  exists (select 1 from public.lists l where l.id = list_creators.list_id and l.owner_user_id = auth.uid())
);

-- metrics cache: owner read (writes via RPC/service)
create policy list_metrics_select on public.list_metrics_cache
for select using (
  exists (select 1 from public.lists l where l.id = list_metrics_cache.list_id and l.owner_user_id = auth.uid())
);

-- tags: per-user library
create policy tags_owner_all on public.tags for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- list_tags: both sides must belong to owner
create policy list_tags_owner on public.list_tags
for all
using (
  exists (select 1 from public.lists l where l.id = list_tags.list_id and l.owner_user_id = auth.uid()) and
  exists (select 1 from public.tags  t where t.id = list_tags.tag_id  and t.owner_user_id   = auth.uid())
)
with check (
  exists (select 1 from public.lists l where l.id = list_tags.list_id and l.owner_user_id = auth.uid()) and
  exists (select 1 from public.tags  t where t.id = list_tags.tag_id  and t.owner_user_id   = auth.uid())
);
```

Optional: cap at 4 tags per list
```sql
create or replace function public.enforce_max_4_tags()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.list_tags where list_id = new.list_id) >= 4 then
    raise exception 'Max 4 tags per list';
  end if;
  return new;
end; $$;

create trigger trg_max_4_tags
before insert on public.list_tags
for each row execute function public.enforce_max_4_tags();
```

---

### 4) Metrics Recompute (SQL)
```sql
create or replace function public.recompute_list_metrics(p_list_id uuid)
returns void language sql security definer as $$
  with c as (
    select c.*
    from public.list_creators lc
    join public.creators c on c.id = lc.creator_id
    where lc.list_id = p_list_id
  )
  insert into public.list_metrics_cache as m (
    list_id, avg_followers, avg_views, avg_engagement, avg_buzz, creator_count, recalculated_at
  )
  select p_list_id,
         coalesce(avg(c.followers_count),0),
         coalesce(avg(c.average_views),0),
         coalesce(avg(c.engagement_rate),0),
         coalesce(avg(c.buzz_score),0),
         coalesce(count(*),0),
         now()
  from c
  on conflict (list_id) do update
  set avg_followers = excluded.avg_followers,
      avg_views = excluded.avg_views,
      avg_engagement = excluded.avg_engagement,
      avg_buzz = excluded.avg_buzz,
      creator_count = excluded.creator_count,
      recalculated_at = excluded.recalculated_at;
$$;
```

> Use RPC (`supabase.rpc('recompute_list_metrics', { p_list_id })`) after add/remove; or run a worker on NOTIFY events.

Security note for SECURITY DEFINER functions
```sql
-- Ensure SECURITY DEFINER functions run with a constrained search_path
alter function public.recompute_list_metrics(p_list_id uuid)
  set search_path = public;
```

---

### 5) Frontend Wiring
- Single source of truth: `creatorsByListId: Record<string, Creator[]>`.
- Covers compute per‑card averages from `creatorsByListId[listId]`.
- Modal reads/writes only `creatorsByListId[selectedListId]`.
- New lists initialize `creatorsByListId[listId] = []` so metrics are 0 by default.

Queries (examples):
```ts
// lists + metrics + tags
const { data: lists } = await supabase
  .from('lists')
  .select(`
    id, name, created_at, visibility, is_archived,
    list_metrics_cache!left(avg_followers,avg_views,avg_engagement,avg_buzz,creator_count,recalculated_at),
    list_tags(tag_id, tags!inner(id,name))
  `)
  .order('created_at', { ascending: false });

// creators for a list
const { data: rows } = await supabase
  .from('list_creators')
  .select('creator_id, creators(*)')
  .eq('list_id', listId);
```

Writes (examples):
```ts
// add creator
await supabase.from('list_creators').insert({ list_id, creator_id, added_by_user_id: userId });
await supabase.rpc('recompute_list_metrics', { p_list_id: list_id });

// remove creator
await supabase.from('list_creators').delete().match({ list_id, creator_id });
await supabase.rpc('recompute_list_metrics', { p_list_id: list_id });

// tags
await supabase.from('tags').insert({ owner_user_id: userId, name }).select('id,name').single();
await supabase.from('list_tags').insert({ list_id, tag_id }).onConflict('list_id,tag_id').ignore();
await supabase.from('list_tags').delete().match({ list_id, tag_id });
```

---

### 6) Testing Checklist
- RLS: users can only see and mutate their own lists/tags/creators.
- New list shows 0 metrics until creators are added.
- Removing creators updates cache and UI.
- Tag dropdown lists only the current user's tags; rename propagates.
- Import adds creators and triggers recompute.

---

### 7) Migration Plan
1) Apply schema + RLS.
2) Backfill metrics cache.
3) Hydrate `creatorsByListId` per list and swap covers to compute per‑card.
4) Optionally show `list_metrics_cache` on covers for server‑truth; recompute after writes.

---

### 8) Types (sketch)
```ts
export type List = {
  id: string;
  name: string;
  created_at: string;
  visibility: 'private'|'team'|'public';
  is_archived: boolean;
  metrics?: { avg_followers: number; avg_views: number; avg_engagement: number; avg_buzz: number; creator_count: number };
};

export type Tag = { id: string; name: string };
export type Creator = {
  id: string;
  display_name: string;
  username: string;
  platform: string;
  followers_count: number;
  average_views: number;
  engagement_rate: number;
  buzz_score: number;
};
```

This setup ensures each list is isolated, fast to render, and secure, and it makes swapping to Supabase trivial: populate `creatorsByListId[listId]` and (optionally) `list_metrics_cache` after writes.

---

### 9) Dashboard Compatibility (plug-and-play)
The dashboard expects minimal tables `lists` and `list_items` with `user_id` and `creator_id` (string). If you prefer to keep the richer schema above, expose the minimal surface via views; otherwise, create these tables as-is.

Option A — Views over your existing tables
```sql
create or replace view public.lists as
select
  l.id,
  l.owner_user_id as user_id,
  l.name,
  l.created_at
from public.lists l;

create or replace view public.list_items as
select
  gen_random_uuid() as id,
  lc.list_id,
  coalesce(c.external_id, lc.creator_id::text) as creator_id,
  lc.added_at as created_at
from public.list_creators lc
left join public.creators c on c.id = lc.creator_id;
```

Option B — Minimal physical tables (matches the dashboard guide)
```sql
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.lists(id) on delete cascade,
  creator_id text not null,
  created_at timestamptz default now(),
  unique (list_id, creator_id)
);

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

create policy "lists: own" on public.lists
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "list_items: by list owner" on public.list_items
for all using (
  exists (select 1 from public.lists l where l.id = list_items.list_id and l.user_id = auth.uid())
) with check (
  exists (select 1 from public.lists l where l.id = list_items.list_id and l.user_id = auth.uid())
);
```

Trigger to keep metrics cache updated when using Option B:
```sql
create or replace function public.after_list_items_change()
returns trigger language plpgsql as $$
begin
  perform public.recompute_list_metrics(coalesce(new.list_id, old.list_id));
  return null;
end; $$;

create trigger trg_list_items_after_change
after insert or delete on public.list_items
for each row execute function public.after_list_items_change();
```

Frontend adapter (already added): `src/lib/listsClient.ts`
- getLists(): returns `id,name,created_at,creatorCount`
- createList(name)
- addCreators(listId, ids)
- removeCreator(listId, id)

This ensures the Lists page works in the dashboard with no further changes — just configure `.env` and run the SQL above.
