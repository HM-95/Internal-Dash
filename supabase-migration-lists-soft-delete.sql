-- Soft delete for lists
-- Adds is_active boolean column and an index. Only active lists will be shown in the app.

alter table if exists public.lists
  add column if not exists is_active boolean not null default true;

create index if not exists idx_lists_user_active
  on public.lists (user_id, is_active);


