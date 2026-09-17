-- Production foundation. Applied through Supabase migration API; no customer data seeded.
create table public.business_types (id text primary key, name text not null unique);
create table public.jurisdictions (id text primary key, name text not null, authority_level text not null check (authority_level in ('state','county','city','profile')), parent_id text references public.jurisdictions(id));
create table public.sources (id text primary key, title text not null, url text not null check (url ~ '^https://'), agency text not null, checked_at timestamptz, fingerprint text);
create table public.requirements (
 id text primary key, business_type_id text not null references public.business_types(id), jurisdiction_id text not null references public.jurisdictions(id),
 title text not null, explanation text not null, applicability text not null default 'conditional' check(applicability in ('required','conditional','not_required','unknown')),
 condition_key text, source_id text references public.sources(id), verification_status text not null default 'researching' check(verification_status in ('verified','researching','needs_review','retired')),
 verified_at timestamptz, fee_amount numeric(12,2) check(fee_amount>=0), fee_note text, renewal text, version integer not null default 1 check(version>0),
 published boolean not null default false, created_at timestamptz not null default now(),
 check (verification_status <> 'verified' or (source_id is not null and verified_at is not null)),
 check (not published or verification_status='verified')
);
create index requirements_lookup on public.requirements(business_type_id,jurisdiction_id);
create index requirements_source on public.requirements(source_id);
create table public.requirement_versions (id uuid primary key default gen_random_uuid(), requirement_id text not null references public.requirements(id), version integer not null, snapshot jsonb not null, recorded_at timestamptz not null default now(), unique(requirement_id,version));
create table public.source_checks (id uuid primary key default gen_random_uuid(), source_id text not null references public.sources(id), checked_at timestamptz not null default now(), http_status integer, fingerprint text, changed boolean, review_status text not null default 'pending' check(review_status in ('pending','reviewed','failed')), notes text);
create index source_checks_source on public.source_checks(source_id);
create table public.customers (id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz not null default now());
create table public.reports (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, business_type_id text not null references public.business_types(id), jurisdiction_id text not null references public.jurisdictions(id), answers jsonb not null default '{}'::jsonb, status text not null default 'pending' check(status in ('pending','ready','failed','refunded')), created_at timestamptz not null default now());
create index reports_owner on public.reports(user_id);
create table public.report_requirements (report_id uuid not null references public.reports(id) on delete cascade, requirement_id text not null references public.requirements(id), version integer not null, snapshot jsonb not null, primary key(report_id,requirement_id));
create index report_requirements_requirement on public.report_requirements(requirement_id);
create table public.subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, provider_subscription_id text unique, status text not null default 'pending', current_period_end timestamptz, created_at timestamptz not null default now());
create index subscriptions_owner on public.subscriptions(user_id);
create table public.entitlements (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, report_id uuid references public.reports(id), provider_event_id text not null unique, product text not null check(product in ('report','watch')), status text not null check(status in ('active','revoked')), created_at timestamptz not null default now());
create index entitlements_owner on public.entitlements(user_id);
create index entitlements_report on public.entitlements(report_id);
create table public.alerts (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, requirement_id text references public.requirements(id), title text not null, body text not null, created_at timestamptz not null default now(), sent_at timestamptz);
create index alerts_owner on public.alerts(user_id);
create index alerts_requirement on public.alerts(requirement_id);

-- Historical snapshots are written by the invoking trusted service role, never a public definer.
create function public.record_requirement_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if NEW.id<>OLD.id then raise exception 'Requirement identity is immutable'; end if;
  NEW.version := OLD.version + 1;
 end if;
 insert into public.requirement_versions(requirement_id,version,snapshot) values(NEW.id,NEW.version,to_jsonb(NEW));
 return NEW;
end $$;
-- AFTER INSERT ensures the parent exists; update version is enforced separately below.
create function public.increment_requirement_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if NEW.id<>OLD.id then raise exception 'Requirement identity is immutable'; end if;
 NEW.version := OLD.version+1;
 return NEW;
end $$;
create trigger requirement_increment before update on public.requirements for each row execute function public.increment_requirement_version();
create trigger requirement_history after insert or update on public.requirements for each row execute function public.record_requirement_version();
revoke all on function public.record_requirement_version() from public,anon,authenticated;
revoke all on function public.increment_requirement_version() from public,anon,authenticated;

do $$ declare t text; begin
 foreach t in array array['business_types','jurisdictions','sources','requirements','requirement_versions','source_checks','customers','reports','report_requirements','subscriptions','entitlements','alerts'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant select on public.business_types,public.jurisdictions,public.sources,public.requirements to anon,authenticated;
create policy catalog_read on public.business_types for select to anon,authenticated using(true);
create policy jurisdiction_read on public.jurisdictions for select to anon,authenticated using(true);
create policy source_read on public.sources for select to anon,authenticated using(exists(select 1 from public.requirements r where r.source_id=sources.id and r.published and r.verification_status='verified'));
create policy published_read on public.requirements for select to anon,authenticated using(published and verification_status='verified');
grant select on public.customers,public.reports,public.report_requirements,public.subscriptions,public.entitlements,public.alerts to authenticated;
grant insert,update on public.customers to authenticated;
create policy customer_read on public.customers for select to authenticated using((select auth.uid())=id);
create policy customer_insert on public.customers for insert to authenticated with check((select auth.uid())=id);
create policy customer_update on public.customers for update to authenticated using((select auth.uid())=id) with check((select auth.uid())=id);
create policy report_read on public.reports for select to authenticated using((select auth.uid())=user_id);
create policy report_item_read on public.report_requirements for select to authenticated using(exists(select 1 from public.reports r where r.id=report_id and r.user_id=(select auth.uid())));
create policy subscription_read on public.subscriptions for select to authenticated using((select auth.uid())=user_id);
create policy entitlement_read on public.entitlements for select to authenticated using((select auth.uid())=user_id);
create policy alert_read on public.alerts for select to authenticated using((select auth.uid())=user_id);
