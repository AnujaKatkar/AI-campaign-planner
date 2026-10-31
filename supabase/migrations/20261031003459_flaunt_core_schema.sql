/*
# Flaunt core database

1. New Tables
- profiles: one row per user (name, saved brand voice, daily streak).
- campaigns: a saved campaign (brief, goal, dates, channels, big idea, tagline, results target).
- campaign_phases: the four phases of a campaign with their date ranges.
- calendar_items: each planned post (channel, date, hook, body, call to action, status).
- campaign_assets: generated ideas, ad scripts, copy and creative brief stored as JSON.
- generations: log of AI runs, used for the daily generation limit and usage tracking.
- campaign_summary (view): progress per campaign for the library screen.
- A profile is created automatically when someone signs up.
- updated_at timestamps on campaigns and calendar items.

2. Security
- Row Level Security enabled on every table.
- Sign-in required: only the `authenticated` role has access. No anonymous access.
- Every campaign belongs to one user. Child tables (phases, items, assets) are allowed only when the parent campaign belongs to the signed-in user.
- Four separate policies (select, insert, update, delete) per table.
- Grants limited to the verbs the app actually uses.

3. Notes
- The migration is safe to re-run: tables, indexes, triggers and policies are created with IF NOT EXISTS or dropped first.
- The status check on calendar items allows: idea, draft, ready, done (shown to users as Idea, To do, Ready to post, Posted).
*/

-- ---------- Profiles ----------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  business_name    text,
  brand_voice      text,
  heat_streak      int  not null default 0,
  last_active_on   date,
  created_at       timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Campaigns ---------------------------------------------------
create table if not exists public.campaigns (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
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
  goal_label       text,
  goal_target      int,
  tone             text,
  status           text not null default 'draft' check (status in ('draft','active','complete','archived')),
  ai_model         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists campaigns_user_idx on public.campaigns(user_id, created_at desc);

-- ---------- Phases ------------------------------------------------------
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

-- ---------- Calendar items ----------------------------------------------
create table if not exists public.calendar_items (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  phase_id      uuid references public.campaign_phases(id) on delete set null,
  scheduled_on  date not null,
  channel       text not null,
  format        text not null,
  visual        text,
  est_minutes   int,
  why           text,
  reach         int,
  clicks        int,
  conversions   int,
  title         text not null,
  hook          text,
  body          text,
  cta           text,
  status        text not null default 'draft' check (status in ('idea','draft','ready','done')),
  sort          int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists items_campaign_date_idx on public.calendar_items(campaign_id, scheduled_on);

-- ---------- Generated assets --------------------------------------------
create table if not exists public.campaign_assets (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  item_id       uuid references public.calendar_items(id) on delete cascade,
  kind          text not null check (kind in ('idea','ad_script','copy','creative_brief')),
  title         text,
  content       jsonb not null,
  kept          boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists assets_campaign_kind_idx on public.campaign_assets(campaign_id, kind);

-- ---------- Generation log ----------------------------------------------
create table if not exists public.generations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  campaign_id        uuid references public.campaigns(id) on delete set null,
  kind               text not null,
  model              text,
  prompt_tokens      int,
  completion_tokens  int,
  latency_ms         int,
  created_at         timestamptz not null default now()
);
create index if not exists generations_user_idx on public.generations(user_id, created_at desc);

-- ---------- updated_at -------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists campaigns_touch on public.campaigns;
create trigger campaigns_touch before update on public.campaigns
  for each row execute function public.touch_updated_at();

drop trigger if exists items_touch on public.calendar_items;
create trigger items_touch before update on public.calendar_items
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Row Level Security and grants
-- =====================================================================
alter table public.profiles         enable row level security;
alter table public.campaigns        enable row level security;
alter table public.campaign_phases  enable row level security;
alter table public.calendar_items   enable row level security;
alter table public.campaign_assets  enable row level security;
alter table public.generations      enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.campaigns, public.campaign_phases,
  public.calendar_items, public.campaign_assets to authenticated;
grant select, insert on public.generations to authenticated;

drop policy if exists "profile_self_select" on public.profiles;
create policy "profile_self_select" on public.profiles for select
  to authenticated using (auth.uid() = id);

drop policy if exists "profile_self_update" on public.profiles;
create policy "profile_self_update" on public.profiles for update
  to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "campaign_owner_select" on public.campaigns;
create policy "campaign_owner_select" on public.campaigns for select
  to authenticated using (auth.uid() = user_id);

drop policy if exists "campaign_owner_insert" on public.campaigns;
create policy "campaign_owner_insert" on public.campaigns for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists "campaign_owner_update" on public.campaigns;
create policy "campaign_owner_update" on public.campaigns for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "campaign_owner_delete" on public.campaigns;
create policy "campaign_owner_delete" on public.campaigns for delete
  to authenticated using (auth.uid() = user_id);

drop policy if exists "phase_owner_select" on public.campaign_phases;
create policy "phase_owner_select" on public.campaign_phases for select
  to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "phase_owner_insert" on public.campaign_phases;
create policy "phase_owner_insert" on public.campaign_phases for insert
  to authenticated with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "phase_owner_update" on public.campaign_phases;
create policy "phase_owner_update" on public.campaign_phases for update
  to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "phase_owner_delete" on public.campaign_phases;
create policy "phase_owner_delete" on public.campaign_phases for delete
  to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "item_owner_select" on public.calendar_items;
create policy "item_owner_select" on public.calendar_items for select
  to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "item_owner_insert" on public.calendar_items;
create policy "item_owner_insert" on public.calendar_items for insert
  to authenticated with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "item_owner_update" on public.calendar_items;
create policy "item_owner_update" on public.calendar_items for update
  to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "item_owner_delete" on public.calendar_items;
create policy "item_owner_delete" on public.calendar_items for delete
  to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "asset_owner_select" on public.campaign_assets;
create policy "asset_owner_select" on public.campaign_assets for select
  to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "asset_owner_insert" on public.campaign_assets;
create policy "asset_owner_insert" on public.campaign_assets for insert
  to authenticated with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "asset_owner_update" on public.campaign_assets;
create policy "asset_owner_update" on public.campaign_assets for update
  to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "asset_owner_delete" on public.campaign_assets;
create policy "asset_owner_delete" on public.campaign_assets for delete
  to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));

drop policy if exists "generation_owner_select" on public.generations;
create policy "generation_owner_select" on public.generations for select
  to authenticated using (auth.uid() = user_id);

drop policy if exists "generation_owner_insert" on public.generations;
create policy "generation_owner_insert" on public.generations for insert
  to authenticated with check (auth.uid() = user_id);

-- ---------- Library summary view ----------------------------------------
create or replace view public.campaign_summary
with (security_invoker = true) as
select c.id, c.user_id, c.name, c.goal, c.start_date, c.duration_weeks, c.status, c.updated_at,
       count(i.id)                                   as total_items,
       count(i.id) filter (where i.status = 'done')  as done_items
from public.campaigns c
left join public.calendar_items i on i.campaign_id = c.id
group by c.id;

grant select on public.campaign_summary to authenticated;
