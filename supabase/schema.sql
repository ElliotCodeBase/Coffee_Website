-- ============================================================
-- Caffeine Coffee Co. — Database Schema
-- Target: Supabase (Postgres). Run in Supabase SQL Editor.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. PROFILES (extends Supabase auth.users with role + name)
-- ------------------------------------------------------------
-- Supabase Auth already stores email/password in auth.users.
-- We add a profiles table for role-based access control (RBAC).
create type user_role as enum ('admin', 'developer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'admin',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'admin');
  return new;
end;
$$ language plpgsql security definer;

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. REVIEWS (customer testimonials shown in carousel)
-- ------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  avatar_url text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. CONTACT SUBMISSIONS (form backup, even though email sent)
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
-- 7. CUSTOM CODE INJECTIONS (developer-only: header/footer scripts)
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
-- 8. THEME / DESIGN SETTINGS (developer-only: colors, fonts)
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

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Public (anon) can READ published content only.
-- Authenticated admin/developer can write, per role.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.nav_links enable row level security;
alter table public.menu_items enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.custom_code_snippets enable row level security;
alter table public.theme_settings enable row level security;

-- Helper: check current user's role
create function public.current_user_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- Profiles: users can read their own profile; devs can read all
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id or public.current_user_role() = 'developer');

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

-- Menu items: public read available items, admin+dev manage all
create policy "public read menu_items" on public.menu_items
  for select using (is_available = true or public.current_user_role() in ('admin','developer'));
create policy "admin manage menu_items" on public.menu_items
  for all using (public.current_user_role() in ('admin','developer'));

-- Reviews: public read published, admin+dev manage all
create policy "public read reviews" on public.reviews
  for select using (is_published = true or public.current_user_role() in ('admin','developer'));
create policy "admin manage reviews" on public.reviews
  for all using (public.current_user_role() in ('admin','developer'));

-- Contact submissions: NO public read. Insert allowed for anyone (the form).
-- Reading/managing restricted to admin+developer.
create policy "anyone can submit contact form" on public.contact_submissions
  for insert with check (true);
create policy "admin read contact_submissions" on public.contact_submissions
  for select using (public.current_user_role() in ('admin','developer'));
create policy "admin update contact_submissions" on public.contact_submissions
  for update using (public.current_user_role() in ('admin','developer'));

-- Custom code snippets: DEVELOPER ONLY (never client-admin — this is raw code injection)
create policy "developer only custom_code" on public.custom_code_snippets
  for all using (public.current_user_role() = 'developer');

-- Theme settings: public read (site needs to render colors), DEVELOPER ONLY write
create policy "public read theme_settings" on public.theme_settings
  for select using (true);
create policy "developer write theme_settings" on public.theme_settings
  for update using (public.current_user_role() = 'developer');

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
  ('Reviews', '#reviews', 3),
  ('Visit', '#location', 4),
  ('Contact', '#contact', 5);

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
  ('pastries','Avocado Sourdough Toast','Smashed avocado, chili flakes, and olive oil on country sourdough.',6.50,'Vegan','https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=500&q=75',3);

insert into public.reviews (author_name, rating, body, avatar_url, sort_order) values
  ('Shalina Hayden',5,'I visit almost every morning. The atmosphere is wonderful and the coffee always hits the spot.','https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=75',0),
  ('Marcus Vance',5,'Easily the best honey lavender latte in town. Great seating for getting some remote work done.','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=75',1),
  ('Elena Rostova',5,'Fresh croissants and smooth pour-overs. You can really tell they care about what they serve.','https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=75',2),
  ('David Kim',5,'Such a hidden gem. The staff is super nice and their cold brew tonic keeps me going all summer.',null,3);
