-- Add application_id to project_secrets
ALTER TABLE project_secrets 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id);

-- Add application_id to project_resources (just in case)
ALTER TABLE project_resources 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id);

-- Make offer_id nullable if we are switching to application_id
ALTER TABLE project_secrets 
ALTER COLUMN offer_id DROP NOT NULL;

ALTER TABLE project_resources 
ALTER COLUMN offer_id DROP NOT NULL;
