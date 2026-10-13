alter table public.files
    add column revocation_token_hash text,
    add column revoked_at timestamptz;
