-- PULSE Social: initial database schema
-- Run this entire script in Supabase > SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default 'Membre',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_following_idx on public.follows(following_id);

-- Create a profile automatically whenever a user registers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted_username text;
begin
  wanted_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username',''),
    'membre_' || substr(new.id::text,1,8)
  );
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    wanted_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name',''),'Membre')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;

-- Profiles are public to signed-in members; each member can edit only their own.
drop policy if exists "Profiles readable by authenticated users" on public.profiles;
create policy "Profiles readable by authenticated users"
on public.profiles for select to authenticated using (true);
drop policy if exists "Members can update own profile" on public.profiles;
create policy "Members can update own profile"
on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Members can insert own profile" on public.profiles;
create policy "Members can insert own profile"
on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Posts are visible to authenticated users; only their author can create/delete them.
drop policy if exists "Posts readable by authenticated users" on public.posts;
create policy "Posts readable by authenticated users"
on public.posts for select to authenticated using (true);
drop policy if exists "Members can publish as themselves" on public.posts;
create policy "Members can publish as themselves"
on public.posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Authors can delete own posts" on public.posts;
create policy "Authors can delete own posts"
on public.posts for delete to authenticated using (auth.uid() = user_id);

-- Likes can be read by members; each member controls only their own likes.
drop policy if exists "Likes readable by authenticated users" on public.likes;
create policy "Likes readable by authenticated users"
on public.likes for select to authenticated using (true);
drop policy if exists "Members can like as themselves" on public.likes;
create policy "Members can like as themselves"
on public.likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Members can remove own likes" on public.likes;
create policy "Members can remove own likes"
on public.likes for delete to authenticated using (auth.uid() = user_id);

-- Follow relationships are visible to members; users manage only their own follows.
drop policy if exists "Follows readable by authenticated users" on public.follows;
create policy "Follows readable by authenticated users"
on public.follows for select to authenticated using (true);
drop policy if exists "Members can follow as themselves" on public.follows;
create policy "Members can follow as themselves"
on public.follows for insert to authenticated with check (auth.uid() = follower_id);
drop policy if exists "Members can unfollow as themselves" on public.follows;
create policy "Members can unfollow as themselves"
on public.follows for delete to authenticated using (auth.uid() = follower_id);

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.posts to authenticated;
grant select, insert, delete on public.likes to authenticated;
grant select, insert, delete on public.follows to authenticated;
