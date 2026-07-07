ALTER TABLE document_versions
ADD COLUMN IF NOT EXISTS summary TEXT;
