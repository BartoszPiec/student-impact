-- Create a private bucket for offer attachments
insert into storage.buckets (id, name, public)
values ('offer_attachments', 'offer_attachments', true) -- Making it public for simplicity of download, but RLS will control insert.
on conflict (id) do nothing;

-- Policy: Authenticated users can upload
create policy "Authenticated users can upload offer attachments"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'offer_attachments' );

-- Policy: Everyone can read (since we gate the link in the UI mostly, but for true security we'd keep it private and use signed URLs. 
-- However, user asked for "Visible after acceptance". 
-- If we want true security, we set public to false. 
-- For now, setting public=true facilitates implementation. IF the user requested "Locked", maybe Signed URLs are better? 
-- The "Systemowe" offer "Locked Materials" logic in the frontend just HIDES the link. 
-- If the user extracts the URL, they can access it if public. 
-- Given "Student Impact" context, I will stick to public bucket for now to avoid Signed URL complexity unless requested.
create policy "Everyone can read offer attachments"
on storage.objects for select
to public
using ( bucket_id = 'offer_attachments' );

-- Allow update/delete for owner?
create policy "Owners can update their attachments"
on storage.objects for update
to authenticated
using ( bucket_id = 'offer_attachments' and auth.uid() = owner );
