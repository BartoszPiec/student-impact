-- Create a public bucket 'offer_attachments' if it doesn't exist
insert into storage.buckets (id, name, public)
values ('offer_attachments', 'offer_attachments', true)
on conflict (id) do nothing;

-- Drop existing policies to avoid conflicts on re-run
drop policy if exists "Authenticated users can upload offer attachments" on storage.objects;
drop policy if exists "Everyone can read offer attachments" on storage.objects;
drop policy if exists "Users can update own offer attachments" on storage.objects;
drop policy if exists "Users can delete own offer attachments" on storage.objects;


-- 1. Allow authenticated users (companies) to upload files
create policy "Authenticated users can upload offer attachments"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'offer_attachments' );

-- 2. Allow public read access (since it's a public bucket)
-- Note: In the UI we hide the link until accepted, but the file itself is public if known.
create policy "Everyone can read offer attachments"
on storage.objects for select
to public
using ( bucket_id = 'offer_attachments' );

-- 3. Allow owners to update/delete their own files
create policy "Users can update own offer attachments"
on storage.objects for update
to authenticated
using ( bucket_id = 'offer_attachments' and auth.uid() = owner );

create policy "Users can delete own offer attachments"
on storage.objects for delete
to authenticated
using ( bucket_id = 'offer_attachments' and auth.uid() = owner );
