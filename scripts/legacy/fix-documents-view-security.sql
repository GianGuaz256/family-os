-- Fix Security Issues with documents_with_metadata View
-- This script addresses:
-- 1. auth_users_exposed: Removes exposure of auth.users data
-- 2. security_definer_view: Implements proper RLS-aware view

-- Drop the existing insecure view
DROP VIEW IF EXISTS documents_with_metadata;

-- Create a secure view that respects RLS and doesn't expose auth.users
CREATE VIEW documents_with_metadata 
WITH (security_invoker = true) AS
SELECT 
  d.id,
  d.group_id,
  d.name,
  d.url,
  d.file_data,
  d.file_size,
  d.mime_type,
  d.file_extension,
  d.uploaded_by,
  d.created_at,
  d.updated_at,
  format_file_size(d.file_size) as formatted_file_size,
  CASE 
    WHEN d.file_data IS NOT NULL THEN 'file'
    WHEN d.url IS NOT NULL THEN 'url'
    ELSE 'unknown'
  END as document_type
FROM documents d
WHERE 
  -- Apply the same RLS logic as the base table
  d.group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  );

-- Grant permissions only to authenticated users (not anon)
GRANT SELECT ON documents_with_metadata TO authenticated;

-- Ensure anon users cannot access this view
REVOKE ALL ON documents_with_metadata FROM anon;

-- Add comment explaining the security measures
COMMENT ON VIEW documents_with_metadata IS 
'Secure view for documents with metadata. Uses security_invoker to respect RLS policies and does not expose auth.users data.'; 