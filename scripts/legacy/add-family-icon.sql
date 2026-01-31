-- Add icon field to family_groups table
-- This field will store either an emoji, an image URL, or a predefined icon identifier

ALTER TABLE family_groups ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🏠';

-- Add index for better performance when querying by icon
CREATE INDEX IF NOT EXISTS idx_family_groups_icon ON family_groups(icon);

-- Update existing families to have the default home icon
UPDATE family_groups SET icon = '🏠' WHERE icon IS NULL; 