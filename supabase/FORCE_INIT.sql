-- FORCE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- FORCE POLICY
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'deliverables' );

-- DUMMY FILE INSERT (To test list)
-- We need a valid application_id or service_order_id.
-- This script tries to find one contract and insert a file for it.

DO $$
DECLARE
    v_app_id UUID;
    v_order_id UUID;
    v_user_id UUID;
BEGIN
    SELECT application_id, service_order_id, company_id INTO v_app_id, v_order_id, v_user_id
    FROM contracts LIMIT 1;

    IF v_app_id IS NOT NULL THEN
        INSERT INTO project_resources (application_id, uploader_id, file_name, file_path)
        VALUES (v_app_id, v_user_id, 'TEST_FILE.txt', 'https://example.com/test.txt');
    ELSIF v_order_id IS NOT NULL THEN
        INSERT INTO project_resources (service_order_id, uploader_id, file_name, file_path)
        VALUES (v_order_id, v_user_id, 'TEST_FILE.txt', 'https://example.com/test.txt');
    END IF;
END;
$$;
