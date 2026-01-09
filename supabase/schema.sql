
-- Create Products Table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  image text,
  price_from numeric not null, -- Mapped from priceFrom
  rating numeric default 0,
  review_count integer default 0, -- Mapped from reviewCount
  
  -- JSONB columns for array/complex data
  features jsonb default '[]'::jsonb,
  sizes jsonb default '[]'::jsonb,
  materials jsonb default '[]'::jsonb,
  popular_templates jsonb default '[]'::jsonb, -- Mapped from popularTemplates

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.products enable row level security;

-- Create Policies (Adjust as needed for production)
-- Allow read access to everyone
create policy "Public products are viewable by everyone"
  on products for select
  using ( true );

-- Allow insert/update/delete for authenticated setup (or public for development if desired)
-- STRICT MODE: Only service role or authenticated users can edit
create policy "Authenticated users can insert products"
  on products for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authenticated users can update products"
  on products for update
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can delete products"
  on products for delete
  using ( auth.role() = 'authenticated' );

-- Create Templates Table
create table public.templates (
  id text primary key, -- Using text ID to match existing IDs like 'modern', 'corporate'
  name text not null,
  description text,
  thumbnail_color text,
  thumbnail text,
  svg_path text,
  layout_type text not null,
  is_custom boolean default false,
  
  -- Complex JSON data
  components jsonb default '{}'::jsonb,
  fabric_config jsonb default '{}'::jsonb,
  defaults jsonb default '{}'::jsonb, -- Joined from TEMPLATE_DEFAULTS

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Templates
alter table public.templates enable row level security;

create policy "Public templates are viewable by everyone"
  on templates for select
  using ( true );

-- Only authenticated users (admins) can manage templates
create policy "Authenticated users can manage templates"
  on templates for all
  using ( auth.role() = 'authenticated' );
