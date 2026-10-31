-- =====================================================================
-- Flaunt — Supabase schema (Postgres)
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Owner-only access via Row Level Security on every table.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Profiles (1:1 with auth.users) ----------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  business_name    text,
  brand_voice      text,                       -- saved default tone
  heat_streak      int  not null default 0,    -- consecutive active days
  last_active_on   date,
  created_at       timestamptz not null default now()
);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Campaigns -------------------------------------------------
create table if not exists public.campaigns (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  big_idea         text,
  tagline          text,
  business_name    text not null,
  business_brief   text not null,
  target_audience  text not null,
  goal             text not null check (goal in ('awareness','leads','sales','launch','event','retention')),
  offer            text,
  duration_weeks   int  not null check (duration_weeks between 1 and 26),
  start_date       date not null,
  channels         text[] not null default '{}',
  workload         text not null default 'steady' check (workload in ('light','steady','allin')),
  story_recipe     text not null default 'auto' check (story_recipe in ('auto','problem','hero','backstage','aida')),
  goal_label       text,              -- e.g. 'First orders'
  goal_target      int,               -- e.g. 150 (editable on the Results tab)
  tone             text,
  status           text not null default 'draft' check (status in ('draft','active','complete','archived')),
  ai_model         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists campaigns_user_idx on public.campaigns(user_id, created_at desc);

-- ---------- Phases (Tease → Launch → Amplify → Convert) ---------------
create table if not exists public.campaign_phases (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns(id) on delete cascade,
  name         text not null,
  objective    text,
  starts_on    date not null,
  ends_on      date not null,
  sort         int  not null default 0
);
create index if not exists phases_campaign_idx on public.campaign_phases(campaign_id, sort);

-- ---------- Calendar items (the editable calendar) --------------------
create table if not exists public.calendar_items (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  phase_id      uuid references public.campaign_phases(id) on delete set null,
  scheduled_on  date not null,
  channel       text not null,     -- instagram | tiktok | linkedin | email | facebook | google | blog
  format        text not null,     -- reel | carousel | storypoll | photo | ttvideo | trend | stitch | lipost | owner | slides | email | fbpost | group | gads | blog
  visual        text,              -- what to photograph or film
  est_minutes   int,               -- time estimate shown in This week view
  why           text,              -- 'Why this works' coaching note
  reach         int,               -- results logged after posting
  clicks        int,
  conversions   int,               -- counts toward the campaign goal
  title         text not null,
  hook          text,
  body          text,
  cta           text,
  status        text not null default 'draft' check (status in ('idea','draft','ready','done'))  -- shown as Idea / To do / Ready to post / Posted,
  sort          int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists items_campaign_date_idx on public.calendar_items(campaign_id, scheduled_on);

-- ---------- Generated assets (ideas, ad scripts, copy, creative brief) -
create table if not exists public.campaign_assets (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  item_id       uuid references public.calendar_items(id) on delete cascade,  -- null = campaign-level
  kind          text not null check (kind in ('idea','ad_script','copy','creative_brief')),
  title         text,
  content       jsonb not null,
  kept          boolean not null default true,   -- swipe keep / toss
  created_at    timestamptz not null default now()
);
create index if not exists assets_campaign_kind_idx on public.campaign_assets(campaign_id, kind);

-- ---------- Generation log (usage, rate limiting, demo metrics) -------
create table if not exists public.generations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  campaign_id        uuid references public.campaigns(id) on delete set null,
  kind               text not null,            -- full_campaign | regenerate_item
  model              text,
  prompt_tokens      int,
  completion_tokens  int,
  latency_ms         int,
  created_at         timestamptz not null default now()
);
create index if not exists generations_user_idx on public.generations(user_id, created_at desc);

-- ---------- updated_at trigger ----------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists campaigns_touch on public.campaigns;
create trigger campaigns_touch before update on public.campaigns
  for each row execute function public.touch_updated_at();

drop trigger if exists items_touch on public.calendar_items;
create trigger items_touch before update on public.calendar_items
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles         enable row level security;
alter table public.campaigns        enable row level security;
alter table public.campaign_phases  enable row level security;
alter table public.calendar_items   enable row level security;
alter table public.campaign_assets  enable row level security;
alter table public.generations      enable row level security;

-- Profiles: a user sees and edits only their own row
create policy "profile_self_select" on public.profiles for select using (auth.uid() = id);
create policy "profile_self_update" on public.profiles for update using (auth.uid() = id);

-- Campaigns: owner-only CRUD
create policy "campaign_owner_all" on public.campaigns for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Child tables: allowed when the parent campaign belongs to the user
create policy "phase_owner_all" on public.campaign_phases for all
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

create policy "item_owner_all" on public.calendar_items for all
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

create policy "asset_owner_all" on public.campaign_assets for all
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

-- Generations: users can read their own log; inserts come from the Edge Function
create policy "generation_owner_select" on public.generations for select using (auth.uid() = user_id);
create policy "generation_owner_insert" on public.generations for insert with check (auth.uid() = user_id);

-- ---------- Handy view for the Campaign Library screen ----------------
create or replace view public.campaign_summary
with (security_invoker = true) as
select c.id, c.user_id, c.name, c.goal, c.start_date, c.duration_weeks, c.status, c.updated_at,
       count(i.id)                                   as total_items,
       count(i.id) filter (where i.status = 'done')  as done_items
from public.campaigns c
left join public.calendar_items i on i.campaign_id = c.id
group by c.id;
