-- Add denormalized tag_name to list_tags and keep it in sync

alter table public.list_tags
  add column if not exists tag_name text;

-- Trigger to fill tag_name from tags on insert/update when not provided
create or replace function public.sync_list_tag_name()
returns trigger
language plpgsql
as $$
begin
  if new.tag_name is null then
    select t.name into new.tag_name from public.tags t where t.id = new.tag_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_list_tags_set_name on public.list_tags;
create trigger trg_list_tags_set_name
before insert or update on public.list_tags
for each row execute function public.sync_list_tag_name();

-- When a tag is renamed, propagate to list_tags
create or replace function public.propagate_tag_rename()
returns trigger
language plpgsql
as $$
begin
  if new.name is distinct from old.name then
    update public.list_tags set tag_name = new.name where tag_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tags_rename_propagate on public.tags;
create trigger trg_tags_rename_propagate
after update of name on public.tags
for each row execute function public.propagate_tag_rename();


