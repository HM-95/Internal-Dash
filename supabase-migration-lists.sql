-- Lists feature minimal schema (Option A)
-- Safe to run repeatedly (IF NOT EXISTS) and does not modify existing unrelated tables

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

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'lists' and policyname = 'lists: own'
  ) then
    create policy "lists: own" on public.lists
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'list_items' and policyname = 'list_items: by list owner'
  ) then
    create policy "list_items: by list owner" on public.list_items
      for all using (
        exists (select 1 from public.lists l where l.id = list_items.list_id and l.user_id = auth.uid())
      ) with check (
        exists (select 1 from public.lists l where l.id = list_items.list_id and l.user_id = auth.uid())
      );
  end if;
end $$;

-- Optional indexes for performance
create index if not exists idx_lists_user_id on public.lists(user_id);
create index if not exists idx_list_items_list_id on public.list_items(list_id);
create index if not exists idx_list_items_creator_id on public.list_items(creator_id);


