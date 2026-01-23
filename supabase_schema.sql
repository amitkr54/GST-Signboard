-- Create materials table
create table public.materials (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price_per_sqft numeric not null,
  description text,
  slug text unique not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.materials enable row level security;

-- Create policies
create policy "Materials are viewable by everyone"
  on public.materials for select
  using ( true );

create policy "Materials are insertable by authenticated users only"
  on public.materials for insert
  with check ( auth.role() = 'authenticated' );

create policy "Materials are updatable by authenticated users only"
  on public.materials for update
  using ( auth.role() = 'authenticated' );

create policy "Materials are deletable by authenticated users only"
  on public.materials for delete
  using ( auth.role() = 'authenticated' );

-- Seed initial data (approximate conversion of previous fixed prices to hypothetical sqft prices, 
-- assuming the fixed prices were for a standard 2x3 ft (6 sqft) banner for calculation)
-- Previous: Flex 700. If 6sqft, then ~116/sqft. Let's make it 120.
-- Previous: Vinyl 800. ~133.
-- Previous: Sun Board 2000. ~333.
-- Previous: ACP Non-Lit 2500. ~416.
-- Previous: ACP Lit 3500. ~583.
-- Previous: Acrylic Board 3500. ~583.
-- Previous: Acrylic Non-Lit 4000. ~666.
-- Previous: Acrylic Lit 5000. ~833.
-- Previous: Neon 6000. ~1000.

insert into public.materials (name, slug, price_per_sqft) values
  ('Flex', 'flex', 120),
  ('Vinyl', 'vinyl', 135),
  ('Sun Board', 'sunboard', 335),
  ('ACP Non-Lit', 'acp_non_lit', 420),
  ('ACP Lit', 'acp_lit', 585),
  ('Acrylic Board', 'acrylic', 585),
  ('Acrylic Non-Lit', 'acrylic_non_lit', 670),
  ('Acrylic Lit', 'acrylic_lit', 835),
  ('Stainless Steel', 'steel', 750),
  ('Neon Sign', 'neon', 1000);
