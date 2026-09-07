-- OMNIPATH: immutable content, owner-scoped player data, server-authoritative matches.
create schema if not exists game_private;
revoke all on schema game_private from public, anon, authenticated;
grant usage on schema game_private to service_role;

create table public.content_catalog (
  id text primary key, kind text not null check (kind in ('legend','card','die','cosmetic')),
  version integer not null check (version > 0), definition jsonb not null,
  starter boolean not null default false, enabled boolean not null default true
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Wayfarer' check (char_length(display_name) between 2 and 32),
  avatar_path text, preferences jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_xp bigint not null default 0 check(account_xp >= 0),
  coins bigint not null default 0 check(coins >= 0), rank_points integer not null default 0 check(rank_points >= 0),
  mastery jsonb not null default '{}', updated_at timestamptz not null default now()
);
create table public.inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null references public.content_catalog(id),
  acquired_at timestamptz not null default now(), source text not null default 'starter', primary key(user_id, content_id)
);
create index inventory_content_idx on public.inventory(content_id);
create table public.loadouts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 60), legend_id text not null references public.content_catalog(id),
  card_ids text[] not null check(cardinality(card_ids)=4), die_ids text[] not null check(cardinality(die_ids)=3),
  updated_at timestamptz not null default now()
);
create index loadouts_owner_idx on public.loadouts(user_id);
create index loadouts_legend_idx on public.loadouts(legend_id);
create table public.developer_members (
  user_id uuid primary key references auth.users(id) on delete cascade, role text not null check(role in ('admin','analyst')),
  created_at timestamptz not null default now()
);
create table game_private.developer_allowlist (email text primary key, role text not null default 'admin' check(role in ('admin','analyst')));
create table public.matches (
  id uuid primary key default gen_random_uuid(), mechanical_version integer not null,
  status text not null check(status in ('waiting','active','completed','abandoned')),
  created_at timestamptz not null default now(), completed_at timestamptz, winner integer check(winner in (-1,0,1))
);
create table public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seat integer not null check(seat in (0,1)), primary key(match_id,user_id), unique(match_id,seat)
);
create index match_players_owner_idx on public.match_players(user_id,match_id);
create table public.match_views (
  match_id uuid not null, user_id uuid not null, revision integer not null, view jsonb not null,
  updated_at timestamptz not null default now(), primary key(match_id,user_id),
  foreign key(match_id,user_id) references public.match_players(match_id,user_id) on delete cascade
);
create index match_views_owner_idx on public.match_views(user_id,match_id);
create table game_private.matches (
  id uuid primary key references public.matches(id) on delete cascade,
  invite_code uuid not null default gen_random_uuid() unique,
  host_id uuid not null references auth.users(id), guest_id uuid references auth.users(id),
  host_loadout jsonb not null, state jsonb, revision integer not null default 0,
  updated_at timestamptz not null default now(), check(guest_id is null or guest_id <> host_id)
);
create index private_matches_host_idx on game_private.matches(host_id);
create index private_matches_guest_idx on game_private.matches(guest_id);
create table game_private.match_commands (
  match_id uuid not null references public.matches(id) on delete cascade, actor uuid not null references auth.users(id),
  command_id uuid not null, request jsonb not null, resulting_revision integer not null,
  created_at timestamptz not null default now(), primary key(match_id,actor,command_id)
);
create index commands_actor_idx on game_private.match_commands(actor);
create table public.match_results (
  id text primary key, source text not null check(source in ('live','simulation','lab')),
  authority text not null check(authority in ('server','client','simulation','lab')),
  user_id uuid references auth.users(id) on delete set null,
  mechanical_version integer not null, created_at timestamptz not null,
  legend_a text not null, legend_b text not null, payload jsonb not null
);
create index results_source_date_idx on public.match_results(source,mechanical_version,created_at desc);
create index results_legend_a_idx on public.match_results(legend_a,legend_b,created_at desc);
create index results_legend_b_idx on public.match_results(legend_b,legend_a,created_at desc);
create index results_user_idx on public.match_results(user_id);
create table public.usage_events (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  event text not null check(char_length(event) between 1 and 60), session_id text not null check(char_length(session_id) <= 100),
  created_at timestamptz not null
);
create index usage_events_date_idx on public.usage_events(created_at desc);
create index usage_events_user_idx on public.usage_events(user_id,created_at desc);
create table public.asset_manifest (
  id text primary key, bucket text not null default 'game-assets', path text not null,
  sha256 text not null check(length(sha256)=64), mime_type text not null, bytes bigint not null check(bytes>=0),
  version integer not null default 1, published boolean not null default false, unique(bucket,path)
);

-- Signup bootstrap is the only privilege-elevated function. No client can call it.
create function game_private.bootstrap_player() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id) values(new.id) on conflict do nothing;
  insert into public.player_progress(user_id) values(new.id) on conflict do nothing;
  insert into public.inventory(user_id,content_id) select new.id,id from public.content_catalog where starter and enabled on conflict do nothing;
  if new.email_confirmed_at is not null then
    insert into public.developer_members(user_id,role)
      select new.id,role from game_private.developer_allowlist where email=lower(new.email)
      on conflict(user_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function game_private.bootstrap_player() from public,anon,authenticated;
create trigger omnipath_player_created after insert or update of email_confirmed_at on auth.users
  for each row execute function game_private.bootstrap_player();

-- Validate stored loadout ownership/card identity before it ever reaches matchmaking.
create function public.validate_saved_loadout() returns trigger language plpgsql security invoker set search_path='' as $$
declare piece text;
begin
  if (select count(distinct c) from unnest(new.card_ids) c) <> 4 then raise exception 'Choose four distinct cards'; end if;
  if not exists(select 1 from public.content_catalog where id=new.legend_id and kind='legend' and enabled) then raise exception 'Invalid Legend'; end if;
  foreach piece in array new.card_ids loop
    if not exists(select 1 from public.content_catalog where id=piece and kind='card' and enabled) then raise exception 'Invalid card'; end if;
  end loop;
  foreach piece in array new.die_ids loop
    if not exists(select 1 from public.content_catalog where id=piece and kind='die' and enabled) then raise exception 'Invalid die'; end if;
  end loop;
  foreach piece in array array[new.legend_id] || new.card_ids || new.die_ids loop
    if not exists(select 1 from public.inventory where user_id=new.user_id and content_id=piece) then raise exception 'Content is not owned'; end if;
  end loop;
  new.updated_at=now(); return new;
end $$;
revoke all on function public.validate_saved_loadout() from public,anon,authenticated;
create trigger loadout_validation before insert or update on public.loadouts for each row execute function public.validate_saved_loadout();

-- Every exposed table is opt-in and protected by RLS. Private tables are also RLS-enabled.
do $$ declare t text; begin
  foreach t in array array['content_catalog','profiles','player_progress','inventory','loadouts','developer_members','matches','match_players','match_views','match_results','usage_events','asset_manifest'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
  foreach t in array array['developer_allowlist','matches','match_commands'] loop
    execute format('alter table game_private.%I enable row level security',t);
    execute format('grant all on game_private.%I to service_role',t);
  end loop;
end $$;
grant select on public.content_catalog,public.asset_manifest to anon,authenticated;
create policy published_content on public.content_catalog for select to anon,authenticated using(enabled);
create policy published_assets on public.asset_manifest for select to anon,authenticated using(published);
grant select on public.profiles,public.player_progress,public.inventory,public.loadouts,public.developer_members,public.matches,public.match_players,public.match_views to authenticated;
grant update(display_name,avatar_path,preferences) on public.profiles to authenticated;
grant insert,update,delete on public.loadouts to authenticated;
create policy own_profile_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy own_profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy own_progress on public.player_progress for select to authenticated using(user_id=(select auth.uid()));
create policy own_inventory on public.inventory for select to authenticated using(user_id=(select auth.uid()));
create policy own_loadouts on public.loadouts for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_membership on public.developer_members for select to authenticated using(user_id=(select auth.uid()));
create policy own_match_seat on public.match_players for select to authenticated using(user_id=(select auth.uid()));
create policy participant_match on public.matches for select to authenticated using(id in(select match_id from public.match_players where user_id=(select auth.uid())));
create policy own_match_view on public.match_views for select to authenticated using(user_id=(select auth.uid()));
-- Metrics writes/reads go through authenticated Edge API authorization; no direct client grant.

-- Transactional compare-and-swap includes views, command deduplication, and final metrics.
create function public.server_create_match(p_user uuid,p_loadout jsonb,p_version integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare mid uuid; code uuid;
begin
  if (select count(*) from game_private.matches m join public.matches p on p.id=m.id where m.host_id=p_user and p.status='waiting' and p.created_at>now()-interval '1 hour') >= 5 then raise exception 'Too many open rooms'; end if;
  insert into public.matches(mechanical_version,status) values(p_version,'waiting') returning id into mid;
  insert into game_private.matches(id,host_id,host_loadout) values(mid,p_user,p_loadout) returning invite_code into code;
  insert into public.match_players values(mid,p_user,0);
  return jsonb_build_object('id',mid,'inviteCode',code);
end $$;
create function public.server_read_match(p_user uuid,p_id uuid default null,p_code uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
  select to_jsonb(m) from game_private.matches m join public.matches p on p.id=m.id
  where (m.id=p_id and p_user in(m.host_id,m.guest_id))
  or (m.invite_code=p_code and p.status='waiting' and p.created_at>now()-interval '1 hour')
$$;
create function public.server_join_match(p_user uuid,p_id uuid,p_state jsonb,p_views jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare host uuid;
begin
  select host_id into host from game_private.matches where id=p_id and guest_id is null and host_id<>p_user for update;
  if host is null then return false; end if;
  if exists(select 1 from public.matches where id=p_id and (status<>'waiting' or created_at<now()-interval '1 hour')) then return false; end if;
  update game_private.matches set guest_id=p_user,state=p_state,revision=(p_state->>'revision')::int,updated_at=now() where id=p_id;
  insert into public.match_players values(p_id,p_user,1);
  insert into public.match_views values(p_id,host,(p_state->>'revision')::int,p_views->0,now()),(p_id,p_user,(p_state->>'revision')::int,p_views->1,now());
  update public.matches set status='active' where id=p_id;
  return true;
end $$;
create function public.server_commit_match(p_user uuid,p_id uuid,p_expected integer,p_command uuid,p_request jsonb,p_state jsonb,p_views jsonb,p_result jsonb default null)
returns text language plpgsql security invoker set search_path='' as $$
declare m game_private.matches; previous jsonb;
begin
  select * into m from game_private.matches where id=p_id and p_user in(host_id,guest_id) for update;
  if m.id is null then raise exception 'Match not found'; end if;
  select request into previous from game_private.match_commands where match_id=p_id and actor=p_user and command_id=p_command;
  if previous is not null then
    if previous<>p_request then raise exception 'Conflicting duplicate command'; end if;
    return 'duplicate';
  end if;
  if m.revision<>p_expected then return 'stale'; end if;
  if (p_state->>'revision')::int<=p_expected then raise exception 'Revision must advance'; end if;
  update game_private.matches set state=p_state,revision=(p_state->>'revision')::int,updated_at=now() where id=p_id;
  update public.match_views set view=case user_id when m.host_id then p_views->0 else p_views->1 end,revision=(p_state->>'revision')::int,updated_at=now() where match_id=p_id;
  insert into game_private.match_commands values(p_id,p_user,p_command,p_request,(p_state->>'revision')::int,now());
  if p_state->>'phase'='MATCH_END' then
    update public.matches set status='completed',winner=(p_state->>'winner')::int,completed_at=now() where id=p_id;
    if p_result is not null then
      insert into public.match_results values(p_id::text,'live','server',p_user,(p_state->>'version')::int,now(),p_state#>>'{players,0,loadout,legend}',p_state#>>'{players,1,loadout,legend}',p_result) on conflict(id) do nothing;
    end if;
  end if;
  return 'accepted';
end $$;
create function public.server_command_receipt(p_user uuid,p_id uuid,p_command uuid)
returns jsonb language sql security invoker set search_path='' as $$
 select request from game_private.match_commands where match_id=p_id and actor=p_user and command_id=p_command
$$;
do $$ declare f record; begin
 for f in select p.oid::regprocedure as name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'server_%' loop
   execute 'revoke all on function '||f.name||' from public,anon,authenticated';
   execute 'grant execute on function '||f.name||' to service_role';
 end loop;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('game-assets','game-assets',true,10485760,array['image/webp','image/png','image/jpeg','image/svg+xml','audio/mpeg','audio/ogg','application/json']),
 ('avatars','avatars',true,2097152,array['image/webp','image/png','image/jpeg']),
 ('match-replays','match-replays',false,10485760,array['application/json']);
create policy own_avatar_insert on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_avatar_read on storage.objects for select to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_avatar_update on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_avatar_delete on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Only sanitized per-player match views enter Realtime; never full state or commands.
alter publication supabase_realtime add table public.match_views;

create function public.server_usage_summary(p_since timestamptz) returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_build_object(
 'events',(select coalesce(jsonb_agg(x),'[]') from(select event,count(*) as count from public.usage_events where created_at>=p_since and event<>'session_heartbeat' group by event order by count(*) desc) x),
 'activeSessions',(select count(distinct (user_id,session_id)) from public.usage_events where created_at>=now()-interval '15 minutes'))
$$;
revoke all on function public.server_usage_summary(timestamptz) from public,anon,authenticated;
grant execute on function public.server_usage_summary(timestamptz) to service_role;
