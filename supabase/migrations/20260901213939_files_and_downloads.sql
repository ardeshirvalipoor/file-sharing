-- The index of what this service holds.
--
-- The file bytes stay in Cloudflare R2 and never come here. These tables record
-- that a file exists, who put it there, and who has fetched it since.

-- One row per account, filled in when somebody signs up.
--
-- Supabase keeps accounts in auth.users, a table we are not allowed to change.
-- This is the usual way around that: our own table, one row per account, joined
-- by the same id. Anything of ours that belongs to a person points here.
create table public.profiles (
    id uuid primary key references auth.users on delete cascade,
    email text,
    created_at timestamptz not null default now()
);

-- Signing up writes to auth.users, which our code never sees. This trigger
-- gives every new account a profile row at that moment, so the two tables can
-- never drift apart.
create function public.add_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, email) values (new.id, new.email);
    return new;
end;
$$;

create trigger add_profile_after_signup
    after insert on auth.users
    for each row execute function public.add_profile_for_new_user();

-- One row per share id.
--
-- The row is written when an upload starts and stays in 'uploading' until every
-- part has arrived. An upload that is abandoned leaves its row behind, which is
-- how we will later find the parts in R2 that nobody is coming back for.
create table public.files (
    id text primary key,
    owner_id uuid references public.profiles on delete set null,

    file_name text not null,
    content_type text not null,
    size bigint not null,

    status text not null default 'uploading' check (status in ('uploading', 'ready')),

    -- Kept here rather than counted from the downloads table, because the
    -- download page asks for it on every visit and a count would grow slower
    -- with every download the file has ever had.
    download_count integer not null default 0,

    created_at timestamptz not null default now(),
    completed_at timestamptz,

    -- Both null for now. They are the shape of two features the README lists as
    -- missing: links that expire, and deleting a file without losing the record
    -- that it was once there.
    expires_at timestamptz,
    deleted_at timestamptz
);

-- For the "my files" page, once accounts exist. Anonymous uploads are the
-- common case today and none of them belong in this index.
create index files_owner_id_idx on public.files (owner_id) where owner_id is not null;

-- One row per download.
--
-- We store a hash of the address rather than the address itself. That is enough
-- to tell two downloads apart without keeping anything that points at a person.
create table public.downloads (
    id bigint generated always as identity primary key,
    file_id text not null references public.files on delete cascade,
    downloaded_at timestamptz not null default now(),
    ip_hash text,
    user_agent text
);

create index downloads_file_id_idx on public.downloads (file_id, downloaded_at desc);

-- Supabase publishes every table in the public schema through a REST API that
-- the anon key can reach, and the anon key is public by design. Turning row
-- level security on with no policies written closes that door: the REST API can
-- see nothing at all. Our server connects as the database owner, which is not
-- subject to these rules, so it keeps full access.
alter table public.profiles enable row level security;
alter table public.files enable row level security;
alter table public.downloads enable row level security;
