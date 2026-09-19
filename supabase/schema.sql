-- ============================================================
-- Caffeine Coffee Co. — Database Schema
-- Target: Supabase (Postgres). Run in Supabase SQL Editor.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Table-level privileges. RLS policies (defined further below) are the
-- real access-control boundary — GRANT alone would let anon/authenticated
-- attempt anything, and RLS narrows that down per-row per-policy. But RLS
-- means nothing WITHOUT a GRANT: a role with no table-level privilege at
-- all is refused before RLS ever gets evaluated. Setting this as the
-- default now means any table created after this line — including ones
-- added later, or if this schema is ever re-run after a schema reset —
-- automatically gets the grant without needing to remember it per table.
-- NOTE: anon is deliberately NOT given blanket DML here. A future table
-- created without RLS would otherwise be writable by anyone holding the
-- public anon key. anon gets exactly what the public site needs, granted
-- explicitly at the bottom of this file.
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 1. PROFILES (extends Supabase auth.users with role + name)
-- ------------------------------------------------------------
-- Supabase Auth already stores email/password in auth.users.
-- We add a profiles table for role-based access control (RBAC).
create type user_role as enum ('admin', 'developer', 'staff');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  -- Least privilege by default. Roles are promoted explicitly by the
  -- invite flows, which run with the service role key.
  role user_role not null default 'staff',
  -- Exactly one profile may be the Main Admin (see the unique partial
  -- index below); that account cannot be deleted until the role is
  -- transferred to another admin.
  is_main_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index profiles_one_main_admin_idx
  on public.profiles (is_main_admin)
  where (is_main_admin = true);

-- Auto-create a profile row whenever a new auth user signs up
-- New users default to the LEAST privileged role. Hard-coding 'admin'
-- here means any successful /auth/v1/signup with the public anon key
-- creates a site administrator. Both invite flows set the real role
-- straight after the invite using the service role key.
-- The exception handler keeps profile bookkeeping from ever aborting the
-- auth.users INSERT itself.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'staff')
  on conflict (id) do nothing;
  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 2. SITE SETTINGS (singleton-style key/value + structured cols)
-- ------------------------------------------------------------
create table public.site_settings (
  id int primary key default 1 check (id = 1), -- enforce single row
  business_name text not null default 'Caffeine',
  tagline text not null default 'Cozy Craft Coffee',
  logo_url text,
  logo_alt text default 'Caffeine logo',
  hero_image_url text,
  hero_headline text default 'Good coffee, good people.',
  hero_subtext text,
  about_image_url text,
  about_headline text,
  about_body text,
  address_line1 text,
  address_line2 text,
  map_embed_url text,
  hours_weekday text,
  hours_weekend text,
  phone text,
  email text,
  social_facebook text,
  social_twitter text,
  social_instagram text,
  social_linkedin text,
  footer_copyright text,
  meta_description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

insert into public.site_settings (id) values (1);

-- ------------------------------------------------------------
-- 3. NAVIGATION LINKS (client can rename/reorder, dev can add)
-- ------------------------------------------------------------
create table public.nav_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true
);

-- ------------------------------------------------------------
-- 4. MENU ITEMS (drinks & pastries)
-- ------------------------------------------------------------
create type menu_category as enum ('drinks', 'pastries');

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category menu_category not null,
  name text not null,
  description text,
  price numeric(6,2) not null check (price >= 0),
  badge text,                 -- e.g. "Vegan", "House Special"
  image_url text,
  sort_order int not null default 0,
  is_available boolean not null default true,
  is_best_seller boolean not null default false,
  is_new boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. CONTACT SUBMISSIONS (form backup, even though email sent)
-- ------------------------------------------------------------
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text,
  message text not null,
  ip_address text,
  status text not null default 'new', -- new | read | archived
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. CUSTOM CODE INJECTIONS (developer-only: header/footer scripts)
-- ------------------------------------------------------------
create table public.custom_code_snippets (
  id uuid primary key default gen_random_uuid(),
  location text not null check (location in ('head', 'body_start', 'body_end')),
  label text,
  code text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

-- ------------------------------------------------------------
-- 7. THEME / DESIGN SETTINGS (developer-only: colors, fonts)
-- ------------------------------------------------------------
create table public.theme_settings (
  id int primary key default 1 check (id = 1),
  color_dark text default '#1c120c',
  color_card text default '#291b13',
  color_cream text default '#f9f4ee',
  color_tan text default '#f0e3d5',
  color_accent text default '#432516',
  color_gold text default '#d99b26',
  font_heading text default 'Comfortaa',
  font_body text default 'Plus Jakarta Sans',
  updated_at timestamptz not null default now()
);

insert into public.theme_settings (id) values (1);

-- ------------------------------------------------------------
-- 8. SITE VISITS (admin-only analytics — daily/weekly/monthly/yearly)
-- ------------------------------------------------------------
create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text not null default '/'
);

create index site_visits_created_at_idx on public.site_visits (created_at);

-- ------------------------------------------------------------
-- 9. IMAGE HISTORY (lets the client revert logo/hero/about images)
-- ------------------------------------------------------------
create table public.image_history (
  id uuid primary key default gen_random_uuid(),
  field_name text not null check (field_name in ('logo_url', 'hero_image_url', 'about_image_url')),
  image_url text not null,
  replaced_at timestamptz not null default now()
);

create index image_history_field_idx on public.image_history (field_name, replaced_at desc);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Public (anon) can READ published content only.
-- Authenticated admin/developer can write, per role.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.nav_links enable row level security;
alter table public.menu_items enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.custom_code_snippets enable row level security;
alter table public.theme_settings enable row level security;
alter table public.site_visits enable row level security;
alter table public.image_history enable row level security;

-- Helper: check current user's role
-- `set search_path` is required on a SECURITY DEFINER function: without
-- it a caller can shadow `profiles` and control what this returns.
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public, anon, authenticated;
grant execute on function public.current_user_role() to authenticated, service_role;

-- Profiles: users can read their own profile; devs can read all
create policy "admin read team profiles" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.current_user_role() in ('admin', 'developer'));

-- Site settings: public read, admin+dev write
create policy "public read site_settings" on public.site_settings
  for select using (true);
create policy "admin write site_settings" on public.site_settings
  for update using (public.current_user_role() in ('admin','developer'));

-- Nav links: public read, admin+dev manage
create policy "public read nav_links" on public.nav_links
  for select using (is_visible = true or public.current_user_role() in ('admin','developer'));
create policy "admin manage nav_links" on public.nav_links
  for all using (public.current_user_role() in ('admin','developer'));

-- Menu items: public read available items, admin+dev+staff manage all
-- (staff is the only role besides admin/developer that can write here —
-- every other table below stays admin/developer only).
create policy "public read menu_items" on public.menu_items
  for select using (is_available = true or public.current_user_role() in ('admin','developer','staff'));
create policy "admin manage menu_items" on public.menu_items
  for all using (public.current_user_role() in ('admin','developer','staff'));

-- Contact submissions: NO public read. Insert allowed for anyone (the form).
-- Reading is admin+developer+staff; only admin/developer can change status.
create policy "anyone can submit contact form" on public.contact_submissions
  for insert with check (true);
create policy "admin read contact_submissions" on public.contact_submissions
  for select using (public.current_user_role() in ('admin','developer','staff'));
create policy "admin update contact_submissions" on public.contact_submissions
  for update to authenticated
  using (public.current_user_role() in ('admin','developer','staff'))
  with check (public.current_user_role() in ('admin','developer','staff'));
create policy "admin delete contact_submissions" on public.contact_submissions
  for delete to authenticated
  using (public.current_user_role() in ('admin','developer'));

-- Custom code snippets: DEVELOPER ONLY (never client-admin — this is raw code injection)
create policy "developer only custom_code" on public.custom_code_snippets
  for all using (public.current_user_role() = 'developer');

-- Theme settings: public read (site needs to render colors), DEVELOPER ONLY write
create policy "public read theme_settings" on public.theme_settings
  for select using (true);
create policy "developer write theme_settings" on public.theme_settings
  for update using (public.current_user_role() = 'developer');

-- Site visits: anyone can log a visit (anonymous, insert-only). Only
-- ADMIN can read the data — staff and developer are excluded on purpose.
create policy "anyone can log a visit" on public.site_visits
  for insert
  to anon, authenticated
  with check (true);
create policy "admin and staff can view visits" on public.site_visits
  for select to authenticated
  using (public.current_user_role() in ('admin','staff','developer'));

-- Image history: same access as site_settings itself (admin/developer
-- only) — staff can't reach the Site Info page in the first place.
create policy "admin manage image_history" on public.image_history
  for all using (public.current_user_role() = any (array['admin'::user_role, 'developer'::user_role]));

-- ============================================================
-- SEED DATA (matches original static template so nothing breaks)
-- ============================================================
update public.site_settings set
  hero_subtext = 'We keep things simple: carefully roasted beans, house-made syrups, and a warm neighborhood spot to sit back and catch your breath.',
  about_headline = 'Built around the neighborhood.',
  about_body = 'We started Caffeine back in 2021 with a simple idea: create a room where locals could slow down.',
  address_line1 = '123 Brewmasters Lane',
  address_line2 = 'Seattle, WA 98101',
  hours_weekday = '6:30 AM - 6:00 PM',
  hours_weekend = '7:30 AM - 7:00 PM',
  phone = '+1 (206) 555-0192',
  email = 'hello@caffeinecoffee.com',
  footer_copyright = '© 2026 Caffeine Coffee Co. All rights reserved.'
where id = 1;

insert into public.nav_links (label, href, sort_order) values
  ('Home', '#hero-header', 0),
  ('Our Story', '#about', 1),
  ('Menu', '#menu', 2),
  ('Visit', '#location', 3),
  ('Contact', '#contact', 4);

insert into public.menu_items (category, name, description, price, badge, image_url, sort_order) values
  ('drinks','Classic Americano','Rich double shot espresso with hot filtered water.',3.50,'House Special','https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=500&q=75',0),
  ('drinks','Honey Lavender Latte','Infused with organic honey, dried lavender, and oat milk.',5.25,'House Special','https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=75',1),
  ('drinks','Cold Brew Tonic','18-hour cold brew poured over crisp tonic water.',4.75,'Vegan','https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=500&q=75',2),
  ('drinks','Iced Matcha Latte','Ceremonial Uji green tea whisked with almond milk.',5.50,'Vegan','https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=500&q=75',3),
  ('drinks','Salted Caramel Macchiato','Espresso, steamed milk, and house-made sea salt caramel.',5.00,null,'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=500&q=75',4),
  ('drinks','Spiced Chai Latte','Slow-brewed black tea with cardamom, ginger, and cinnamon.',4.80,'Gluten-Free',null,5),
  ('pastries','Butter Croissant','Traditional French layered pastry, baked fresh daily.',4.00,null,'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=75',0),
  ('pastries','Almond Frangipane Tart','Flaky crust filled with sweet almond cream and toasted slices.',4.75,'House Special','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=75',1),
  ('pastries','Wild Blueberry Scone','Tender crumb biscuit packed with berries and lemon glaze.',3.80,null,'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=500&q=75',2),
  ('pastries','Avocado Sourdough Toast','Smashed avocado, chili flakes, and olive oil on country sourdough.',6.50,'Vegan','https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=500&q=75',3),
  ('drinks','Cappuccino','Equal parts espresso, steamed milk, and silky microfoam.',4.25,null,'https://images.unsplash.com/photo-1524671710025-d79530c2f957?auto=format&fit=crop&w=500&q=75',6),
  ('drinks','Double Chocolate Mocha','Espresso and steamed milk layered with real dark chocolate.',5.15,null,'https://images.unsplash.com/photo-1533651441215-d01c13c8c4ad?auto=format&fit=crop&w=500&q=75',7),
  ('pastries','Cinnamon Roll','Soft-baked and swirled with brown sugar and cinnamon, finished with a light glaze.',4.25,null,'https://images.unsplash.com/photo-1559745757-f6219279c3e5?auto=format&fit=crop&w=500&q=75',4),
  ('pastries','New York Cheesecake','Dense and creamy on a graham cracker crust, baked in-house.',5.25,null,'https://images.unsplash.com/photo-1745226518652-a2621a09e096?auto=format&fit=crop&w=500&q=75',5);

-- Flag one seed item as Best Seller (and one as New) so the header's
-- floating showcase and the "New" menu badge have something to display
-- immediately after a fresh reset, instead of both silently rendering
-- nothing until you manually check a box in the admin panel.
update public.menu_items set is_best_seller = true where name = 'Honey Lavender Latte';
update public.menu_items set is_new = true where name = 'Iced Matcha Latte';

-- Explicit, redundant safety net on top of the ALTER DEFAULT PRIVILEGES
-- near the top of this file: guarantees every table above has the grant
-- it needs regardless of what role/session actually executed the CREATE
-- TABLE statements. Cheap to run twice, expensive to silently omit —
-- this exact gap (RLS policies with no underlying GRANT) is what broke
-- every menu/login query on the live site after an earlier reset.
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- anon: read public content, write a contact message or a visit row. That's all.
grant select on public.site_settings, public.theme_settings, public.nav_links,
                public.menu_items, public.custom_code_snippets to anon;
grant insert on public.contact_submissions to anon;
grant insert on public.site_visits to anon;
