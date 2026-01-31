-- Fix for Family Deletion Issues
-- Run this in your Supabase SQL editor to fix missing RLS policies

-- Add missing UPDATE and DELETE policies for family_groups table
DROP POLICY IF EXISTS "Family owners can update their groups" ON family_groups;
DROP POLICY IF EXISTS "Family owners can delete their groups" ON family_groups;
DROP POLICY IF EXISTS "Group members can delete their membership" ON group_members;

-- Policy to allow family owners to update their groups (for icon changes, etc.)
CREATE POLICY "Family owners can update their groups" ON family_groups
  FOR UPDATE USING (owner_id = auth.uid());

-- Policy to allow family owners to delete their groups
CREATE POLICY "Family owners can delete their groups" ON family_groups
  FOR DELETE USING (owner_id = auth.uid());

-- Policy to allow members to delete their own membership (leave group)
-- and allow owners to delete any membership (remove members)
CREATE POLICY "Group members can delete memberships" ON group_members
  FOR DELETE USING (
    user_id = auth.uid() OR -- Users can delete their own membership
    EXISTS (
      SELECT 1 FROM family_groups 
      WHERE id = group_id AND owner_id = auth.uid()
    ) -- Or if the current user is the family owner
  );

-- Ensure CASCADE DELETE is working properly by refreshing the foreign key constraints
-- Note: This is usually not needed but can help in some edge cases
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE group_members ADD CONSTRAINT group_members_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES family_groups(id) ON DELETE CASCADE;

ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_group_id_fkey;
ALTER TABLE lists ADD CONSTRAINT lists_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES family_groups(id) ON DELETE CASCADE;

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_group_id_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES family_groups(id) ON DELETE CASCADE;

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_group_id_fkey;
ALTER TABLE events ADD CONSTRAINT events_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES family_groups(id) ON DELETE CASCADE;

ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_group_id_fkey;
ALTER TABLE cards ADD CONSTRAINT cards_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES family_groups(id) ON DELETE CASCADE; 