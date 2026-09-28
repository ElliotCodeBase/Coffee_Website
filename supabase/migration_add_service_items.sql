-- Run this once against an existing database (Supabase SQL editor) to add
-- the "Our Services" section introduced in this redesign pass. New projects
-- created from schema.sql already have this table and do not need to run
-- this file.

create table if not exists public.service_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text not null default 'coffee',
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_items_sort_idx on public.service_items (sort_order);

alter table public.service_items enable row level security;

-- Public read for visible items; ADMIN/DEVELOPER ONLY manage (staff is
-- deliberately excluded, unlike menu_items).
drop policy if exists "public read service_items" on public.service_items;
create policy "public read service_items" on public.service_items
  for select using (is_visible = true or public.current_user_role() in ('admin','developer'));

drop policy if exists "admin manage service_items" on public.service_items;
create policy "admin manage service_items" on public.service_items
  for all using (public.current_user_role() in ('admin','developer'));

grant select on public.service_items to anon;

-- Seed a starter row so the section isn't empty before the admin fills it
-- in. Safe to delete/edit from /admin once logged in.
insert into public.service_items (title, description, icon, sort_order)
select * from (values
  ('Espresso Bar', 'Hand-pulled shots from small-batch, in-house roasted beans.', 'coffee', 0),
  ('Fresh Pastries', 'Baked daily — croissants, muffins, and seasonal specials.', 'pastry', 1),
  ('Cozy Seating', 'A warm room built for slowing down, working, or catching up.', 'seat', 2),
  ('Loyalty Rewards', 'Every visit gets you closer to a free drink on us.', 'award', 3)
) as seed(title, description, icon, sort_order)
where not exists (select 1 from public.service_items);
