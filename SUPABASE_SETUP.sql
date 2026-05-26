create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name_tag text not null,
  wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name_tag text not null,
  email text not null,
  wallet_address text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.circle_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  circle_name text not null,
  member_count integer not null,
  weekly_usdc numeric not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.waitlist enable row level security;
alter table public.circle_requests enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Signed-in users can join waitlist"
  on public.waitlist for insert
  with check (auth.uid() = user_id);

create policy "Users can read own waitlist rows"
  on public.waitlist for select
  using (auth.uid() = user_id);

create policy "Signed-in users can request circles"
  on public.circle_requests for insert
  with check (auth.uid() = user_id);

create policy "Users can read own circle requests"
  on public.circle_requests for select
  using (auth.uid() = user_id);
