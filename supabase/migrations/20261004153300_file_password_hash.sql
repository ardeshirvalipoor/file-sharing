-- Keep the password hash with the file row so password selection can happen
-- when a multipart upload finishes, even when its upload token was resumed.
alter table public.files
    add column password_hash text;
