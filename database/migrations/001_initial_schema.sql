-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: origins
create table public.origins (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: demand_types
create table public.demand_types (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: statuses
create table public.statuses (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text not null,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: profiles (Users)
create table public.profiles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null unique,
  role text not null, -- 'Administrador', 'Gerente', 'Editor', 'Visualizador'
  avatar_url text,
  password text, -- Storing simple passwords for this MVP as requested (Not recommended for prod)
  status text default 'active',
  origin text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: demands
create table public.demands (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  origin_id uuid references public.origins(id) on delete set null,
  type_id uuid references public.demand_types(id) on delete set null,
  status_id uuid references public.statuses(id) on delete set null,
  responsible_id uuid references public.profiles(id) on delete set null,
  goal text,
  deadline timestamp with time zone,
  drive_link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  production_started_at timestamp with time zone,
  accumulated_time bigint default 0
);

-- Table: permissions
create table public.permissions (
  id uuid default uuid_generate_v4() primary key,
  role text not null,
  module text not null,
  view boolean default false,
  edit boolean default false,
  delete boolean default false,
  unique(role, module)
);

-- Table: logs
create table public.logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null, -- 'CREATE', 'UPDATE', 'DELETE'
  table_name text not null,
  record_id uuid,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Simplified for MVP: Enable all access for now, or public)
alter table public.origins enable row level security;
create policy "Allow all access" on public.origins for all using (true);

alter table public.demand_types enable row level security;
create policy "Allow all access" on public.demand_types for all using (true);

alter table public.statuses enable row level security;
create policy "Allow all access" on public.statuses for all using (true);

alter table public.profiles enable row level security;
create policy "Allow all access" on public.profiles for all using (true);

alter table public.demands enable row level security;
create policy "Allow all access" on public.demands for all using (true);

alter table public.permissions enable row level security;
create policy "Allow all access" on public.permissions for all using (true);

alter table public.logs enable row level security;
create policy "Allow all access" on public.logs for all using (true);

-- Insert Default Data
insert into public.statuses (name, color, "order") values 
('Backlog', 'bg-zinc-500', 1),
('Em Produção', 'bg-blue-500', 2),
('Revisão', 'bg-yellow-500', 3),
('Concluído', 'bg-green-500', 4);

insert into public.origins (name) values ('Instagram'), ('Email'), ('WhatsApp');
insert into public.demand_types (name) values ('Post'), ('Story'), ('Reels'), ('Vídeo');

-- Table: job_titles
create table public.job_titles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: comments
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  demand_id uuid references public.demands(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alter Demands Table to add reference_link
alter table public.demands add column reference_link text;

-- Alter Profiles Table to add job_title_id
alter table public.profiles add column job_title_id uuid references public.job_titles(id) on delete set null;

-- RLS for new tables
alter table public.job_titles enable row level security;
create policy "Allow all access" on public.job_titles for all using (true);

alter table public.comments enable row level security;
create policy "Allow all access" on public.comments for all using (true);

-- Insert Default Job Titles
insert into public.job_titles (name) values ('Designer'), ('Copywriter'), ('Social Media'), ('Videomaker');
