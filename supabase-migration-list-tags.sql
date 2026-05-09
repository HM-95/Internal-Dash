-- List tags schema: user-owned tags and many-to-many list tagging

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  -- Plain unique constraint to support ON CONFLICT (user_id, name)
  unique (user_id, name)
);

create table if not exists public.list_tags (
  list_id uuid not null references public.lists(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (list_id, tag_id)
);

alter table public.tags enable row level security;
alter table public.list_tags enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tags' and policyname = 'tags: own'
  ) then
    create policy "tags: own" on public.tags
      for all using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'list_tags' and policyname = 'list_tags: by list owner'
  ) then
    create policy "list_tags: by list owner" on public.list_tags
      for all using (
        exists (
          select 1 from public.lists l
          where l.id = list_tags.list_id and l.user_id = auth.uid()
        )
      ) with check (
        exists (
          select 1 from public.lists l
          where l.id = list_tags.list_id and l.user_id = auth.uid()
        )
      );
  end if;
end $$;

create index if not exists idx_tags_user_id on public.tags(user_id);
create index if not exists idx_list_tags_list_id on public.list_tags(list_id);
create index if not exists idx_list_tags_tag_id on public.list_tags(tag_id);

-- Case-insensitive uniqueness (prevents 'Tag' vs 'tag' duplicates per user)
create unique index if not exists tags_user_name_lower_idx
  on public.tags (user_id, lower(name));


