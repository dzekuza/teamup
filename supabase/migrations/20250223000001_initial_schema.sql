-- ============================================================
-- TeamUp: Firebase → Supabase Migration
-- Initial schema: tables, indexes, RLS policies, storage
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (maps to Firestore 'users' collection)
--    Extends Supabase auth.users with app-specific fields
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  first_name text default '',
  last_name text default '',
  photo_url text default 'Avatar1',
  phone_number text default '',
  level text default '',
  location text default '',
  sports text[] default '{}',
  bio text default '',
  description text default '',
  is_admin boolean default false,
  email_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.profiles is 'User profiles extending Supabase auth.users';

-- ============================================================
-- 2. EVENTS (maps to Firestore 'events' collection)
-- ============================================================
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  date date not null,
  time time not null,
  end_time time not null,
  location text not null,
  level text default 'Beginner',
  max_players integer default 4,
  created_by uuid not null references public.profiles(id) on delete cascade,
  price numeric(10,2) default 0,
  status text not null default 'active' check (status in ('active', 'completed')),
  is_private boolean default false,
  password text,
  sport_type text default 'Padel',
  description text,
  cover_image_url text,
  custom_location_lat double precision,
  custom_location_lng double precision,
  created_at timestamptz default now()
);

comment on table public.events is 'Sports events (padel, tennis, etc.)';

-- ============================================================
-- 3. EVENT_PLAYERS (normalizes Firestore events.players[] array)
-- ============================================================
create table public.event_players (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text,
  photo_url text,
  level text,
  joined_at timestamptz default now(),
  unique(event_id, user_id)
);

comment on table public.event_players is 'Junction table: players registered for events';

-- ============================================================
-- 4. MATCH_RESULTS (normalizes Firestore events.matchResults)
-- ============================================================
create table public.match_results (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_a_score text not null,
  team_b_score text not null,
  winner text not null check (winner in ('Team A', 'Team B')),
  created_at timestamptz default now()
);

comment on table public.match_results is 'Match results for completed events';

-- ============================================================
-- 5. FRIENDS (normalizes Firestore 'friends' collection)
-- ============================================================
create table public.friends (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

comment on table public.friends is 'Bidirectional friend relationships';

-- ============================================================
-- 6. FRIEND_REQUESTS (normalizes Firestore friends/{id}/requests)
-- ============================================================
create table public.friend_requests (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

comment on table public.friend_requests is 'Pending friend requests between users';

-- ============================================================
-- 7. NOTIFICATIONS (maps to Firestore 'notifications' collection)
-- ============================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('new_event', 'event_joined', 'event_cancelled')),
  event_id uuid references public.events(id) on delete set null,
  event_title text,
  created_by uuid references public.profiles(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read boolean default false,
  created_at timestamptz default now()
);

comment on table public.notifications is 'In-app notifications for users';

-- ============================================================
-- 8. SAVED_EVENTS (maps to Firestore 'savedEvents' collection)
-- ============================================================
create table public.saved_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  saved_at timestamptz default now(),
  unique(user_id, event_id)
);

comment on table public.saved_events is 'Bookmarked/saved events per user';

-- ============================================================
-- 9. MEMORIES (maps to Firestore 'memories' collection)
-- ============================================================
create table public.memories (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete set null,
  event_title text,
  description text,
  image_url text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  sport_type text,
  date date,
  location text,
  created_at timestamptz default now()
);

comment on table public.memories is 'Post-event photo memories shared by users';

-- ============================================================
-- 10. MEMORY_LIKES (normalizes Firestore memories.likes[] array)
-- ============================================================
create table public.memory_likes (
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (memory_id, user_id)
);

comment on table public.memory_likes is 'Likes on memories by users';


-- ============================================================
-- INDEXES (maps Firestore composite indexes)
-- ============================================================

-- Events: common query patterns
create index idx_events_date_time on public.events (date asc, time asc);
create index idx_events_location_date on public.events (location, date asc, time asc);
create index idx_events_sport_date on public.events (sport_type, date asc, time asc);
create index idx_events_status_date on public.events (status, date asc);
create index idx_events_created_by on public.events (created_by);

-- Event players
create index idx_event_players_event on public.event_players (event_id);
create index idx_event_players_user on public.event_players (user_id);

-- Notifications: per-user ordered
create index idx_notifications_user_created on public.notifications (user_id, created_at desc);
create index idx_notifications_user_unread on public.notifications (user_id) where read = false;

-- Saved events
create index idx_saved_events_user on public.saved_events (user_id);
create index idx_saved_events_event on public.saved_events (event_id);

-- Memories
create index idx_memories_created_at on public.memories (created_at desc);
create index idx_memories_event on public.memories (event_id);

-- Friends
create index idx_friends_friend on public.friends (friend_id);

-- Friend requests
create index idx_friend_requests_to on public.friend_requests (to_user_id, status);
create index idx_friend_requests_from on public.friend_requests (from_user_id);


-- ============================================================
-- ROW LEVEL SECURITY (maps Firestore security rules)
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_players enable row level security;
alter table public.match_results enable row level security;
alter table public.friends enable row level security;
alter table public.friend_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_events enable row level security;
alter table public.memories enable row level security;
alter table public.memory_likes enable row level security;

-- ----------------------
-- PROFILES policies
-- ----------------------
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ----------------------
-- EVENTS policies
-- ----------------------
create policy "Events are viewable by everyone"
  on public.events for select
  using (true);

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update events"
  on public.events for update
  using (auth.role() = 'authenticated');

create policy "Only event creator can delete events"
  on public.events for delete
  using (auth.uid() = created_by);

-- ----------------------
-- EVENT_PLAYERS policies
-- ----------------------
create policy "Event players are viewable by everyone"
  on public.event_players for select
  using (true);

create policy "Authenticated users can join events"
  on public.event_players for insert
  with check (auth.role() = 'authenticated');

create policy "Users can remove themselves from events"
  on public.event_players for delete
  using (auth.uid() = user_id);

-- ----------------------
-- MATCH_RESULTS policies
-- ----------------------
create policy "Match results are viewable by everyone"
  on public.match_results for select
  using (true);

create policy "Authenticated users can add match results"
  on public.match_results for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update match results"
  on public.match_results for update
  using (auth.role() = 'authenticated');

-- ----------------------
-- FRIENDS policies
-- ----------------------
create policy "Users can view their own friends"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Authenticated users can add friends"
  on public.friends for insert
  with check (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can remove their own friendships"
  on public.friends for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- ----------------------
-- FRIEND_REQUESTS policies
-- ----------------------
create policy "Users can view their own friend requests"
  on public.friend_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Authenticated users can send friend requests"
  on public.friend_requests for insert
  with check (auth.uid() = from_user_id);

create policy "Recipients can update friend request status"
  on public.friend_requests for update
  using (auth.uid() = to_user_id);

create policy "Either party can delete friend requests"
  on public.friend_requests for delete
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- ----------------------
-- NOTIFICATIONS policies
-- ----------------------
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Authenticated users can create notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ----------------------
-- SAVED_EVENTS policies
-- ----------------------
create policy "Users can view their own saved events"
  on public.saved_events for select
  using (auth.uid() = user_id);

create policy "Users can save events"
  on public.saved_events for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave events"
  on public.saved_events for delete
  using (auth.uid() = user_id);

-- ----------------------
-- MEMORIES policies
-- ----------------------
create policy "Memories are viewable by everyone"
  on public.memories for select
  using (true);

create policy "Authenticated users can create memories"
  on public.memories for insert
  with check (auth.uid() = created_by);

create policy "Memory creator can update their memories"
  on public.memories for update
  using (auth.uid() = created_by);

create policy "Memory creator can delete their memories"
  on public.memories for delete
  using (auth.uid() = created_by);

-- ----------------------
-- MEMORY_LIKES policies
-- ----------------------
create policy "Memory likes are viewable by everyone"
  on public.memory_likes for select
  using (true);

create policy "Authenticated users can like memories"
  on public.memory_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike memories"
  on public.memory_likes for delete
  using (auth.uid() = user_id);


-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, photo_url, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'photo_url', 'Avatar1'),
    now(),
    now()
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Helper view: events with player count
create or replace view public.events_with_player_count as
select
  e.*,
  coalesce(pc.player_count, 0) as player_count
from public.events e
left join (
  select event_id, count(*) as player_count
  from public.event_players
  group by event_id
) pc on pc.event_id = e.id;


-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Create storage buckets for app assets
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('event-covers', 'event-covers', true),
  ('memory-images', 'memory-images', true)
on conflict (id) do nothing;

-- Storage policies: avatars bucket
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update their own avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: event-covers bucket
create policy "Event covers are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'event-covers');

create policy "Authenticated users can upload event covers"
  on storage.objects for insert
  with check (bucket_id = 'event-covers' and auth.role() = 'authenticated');

create policy "Authenticated users can delete event covers"
  on storage.objects for delete
  using (bucket_id = 'event-covers' and auth.role() = 'authenticated');

-- Storage policies: memory-images bucket
create policy "Memory images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'memory-images');

create policy "Authenticated users can upload memory images"
  on storage.objects for insert
  with check (bucket_id = 'memory-images' and auth.role() = 'authenticated');

create policy "Users can delete their own memory images"
  on storage.objects for delete
  using (bucket_id = 'memory-images' and auth.uid()::text = (storage.foldername(name))[1]);
