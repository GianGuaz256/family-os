-- Enhanced Documents Storage Migration
-- Run this in your Supabase SQL editor to enhance document storage capabilities

-- First, let's modify the documents table to support file storage
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_data BYTEA,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS file_extension TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make url nullable since we'll now store files directly
ALTER TABLE documents ALTER COLUMN url DROP NOT NULL;

-- Add constraint for file size (5MB = 5242880 bytes)
ALTER TABLE documents 
ADD CONSTRAINT check_file_size CHECK (file_size IS NULL OR file_size <= 5242880);

-- Add constraint to ensure either url or file_data is provided (not both or neither)
ALTER TABLE documents 
ADD CONSTRAINT check_document_source CHECK (
  (url IS NOT NULL AND file_data IS NULL) OR 
  (url IS NULL AND file_data IS NOT NULL)
);

-- Create an index on file_size for performance
CREATE INDEX IF NOT EXISTS idx_documents_file_size ON documents(file_size);
CREATE INDEX IF NOT EXISTS idx_documents_mime_type ON documents(mime_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_documents_updated_at_trigger ON documents;
CREATE TRIGGER update_documents_updated_at_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Create a function to get document size for display
CREATE OR REPLACE FUNCTION format_file_size(size_in_bytes INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF size_in_bytes IS NULL THEN
    RETURN 'Unknown';
  ELSIF size_in_bytes < 1024 THEN
    RETURN size_in_bytes || ' B';
  ELSIF size_in_bytes < 1024 * 1024 THEN
    RETURN ROUND(size_in_bytes / 1024.0, 1) || ' KB';
  ELSIF size_in_bytes < 1024 * 1024 * 1024 THEN
    RETURN ROUND(size_in_bytes / (1024.0 * 1024.0), 1) || ' MB';
  ELSE
    RETURN ROUND(size_in_bytes / (1024.0 * 1024.0 * 1024.0), 1) || ' GB';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update the existing RLS policy to include the new columns
DROP POLICY IF EXISTS "Group members can manage documents" ON documents;
CREATE POLICY "Group members can manage documents" ON documents
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Add a policy specifically for viewing document data
CREATE POLICY "Group members can view document files" ON documents
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Create a view for documents with formatted file sizes (useful for displaying)
CREATE OR REPLACE VIEW documents_with_metadata AS
SELECT 
  d.*,
  format_file_size(d.file_size) as formatted_file_size,
  CASE 
    WHEN d.file_data IS NOT NULL THEN 'file'
    WHEN d.url IS NOT NULL THEN 'url'
    ELSE 'unknown'
  END as document_type,
  u.email as uploaded_by_email
FROM documents d
LEFT JOIN auth.users u ON d.uploaded_by = u.id;

-- Grant necessary permissions
GRANT SELECT ON documents_with_metadata TO authenticated;

-- Enable realtime for the enhanced documents table (only if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'documents'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE documents;
    END IF;
END $$; 