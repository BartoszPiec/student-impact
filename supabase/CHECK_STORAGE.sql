-- Check if deliverables bucket exists
select * from storage.buckets where name = 'deliverables';

-- Check policies on objects table related to this bucket
select * from pg_policies where schemaname = 'storage' and tablename = 'objects';
