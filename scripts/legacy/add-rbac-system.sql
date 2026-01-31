-- Family OS RBAC System Migration Script
-- This script adds Role-Based Access Control with Owner, Member, and Viewer roles
--
-- ⚠️  IMPORTANT: This is a MIGRATION script, not a fresh setup script!
-- 
-- PREREQUISITE: You MUST run 'setup-database.sql' FIRST to create the base tables.
-- 
-- If you get an error about "relation does not exist", it means you haven't
-- run setup-database.sql yet. Run that script first, then run this one.
--
-- ============================================================================
-- PREREQUISITE CHECK: Verify base tables exist
-- ============================================================================

DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  missing_tables := ARRAY[]::TEXT[];
  
  -- Check for group_members table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'group_members'
  ) THEN
    missing_tables := array_append(missing_tables, 'group_members');
  END IF;
  
  -- Check for family_groups table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'family_groups'
  ) THEN
    missing_tables := array_append(missing_tables, 'family_groups');
  END IF;
  
  -- If any tables are missing, raise an error
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required tables: %. Please run setup-database.sql first to create the base tables.', 
      array_to_string(missing_tables, ', ');
  END IF;
END $$;

-- ============================================================================
-- STEP 1: Add role column to group_members table
-- ============================================================================

-- Add role column with default 'member'
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member' 
CHECK (role IN ('owner', 'member', 'viewer'));

-- Migrate existing data: Set owner role for family owners
UPDATE group_members gm
SET role = 'owner'
FROM family_groups fg
WHERE gm.group_id = fg.id 
  AND gm.user_id = fg.owner_id
  AND gm.role = 'member';

-- ============================================================================
-- STEP 2: Add tracking fields to resource tables
-- ============================================================================

-- CARDS table
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edit_mode TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraint for edit_mode on cards
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cards_edit_mode_check'
  ) THEN
    ALTER TABLE cards ADD CONSTRAINT cards_edit_mode_check CHECK (edit_mode IN ('private', 'public'));
  END IF;
END $$;

-- DOCUMENTS table (already has uploaded_by, rename/add as needed)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edit_mode TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraint for edit_mode on documents
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_edit_mode_check'
  ) THEN
    ALTER TABLE documents ADD CONSTRAINT documents_edit_mode_check CHECK (edit_mode IN ('private', 'public'));
  END IF;
END $$;

-- Migrate uploaded_by to created_by for documents if uploaded_by exists
UPDATE documents SET created_by = uploaded_by WHERE created_by IS NULL AND uploaded_by IS NOT NULL;

-- EVENTS table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edit_mode TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraint for edit_mode on events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_edit_mode_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_edit_mode_check CHECK (edit_mode IN ('private', 'public'));
  END IF;
END $$;

-- LISTS table
ALTER TABLE lists
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edit_mode TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraint for edit_mode on lists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lists_edit_mode_check'
  ) THEN
    ALTER TABLE lists ADD CONSTRAINT lists_edit_mode_check CHECK (edit_mode IN ('private', 'public'));
  END IF;
END $$;

-- SUBSCRIPTIONS table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edit_mode TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraint for edit_mode on subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_edit_mode_check'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_edit_mode_check CHECK (edit_mode IN ('private', 'public'));
  END IF;
END $$;

-- NOTES table (already has created_by and updated_at)
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS edit_mode TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add CHECK constraint for edit_mode on notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_edit_mode_check'
  ) THEN
    ALTER TABLE notes ADD CONSTRAINT notes_edit_mode_check CHECK (edit_mode IN ('private', 'public'));
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create helper functions for permission checks
-- ============================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_role(UUID, UUID);
DROP FUNCTION IF EXISTS can_modify_resource(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS can_delete_resource(UUID, UUID, UUID);

-- Create helper functions only if base tables exist
DO $$
BEGIN
  -- Verify tables exist before creating functions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'group_members'
  ) THEN
    RAISE EXCEPTION 'The group_members table does not exist. Please run setup-database.sql first.';
  END IF;
  
  -- Get user role in a group
  EXECUTE '
  CREATE OR REPLACE FUNCTION get_user_role(p_group_id UUID, p_user_id UUID)
  RETURNS TEXT AS $func$
    SELECT role FROM group_members 
    WHERE group_id = p_group_id AND user_id = p_user_id;
  $func$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '''';
  ';
END $$;

-- Check if user can modify a resource based on role and edit mode
DO $$
BEGIN
  EXECUTE '
  CREATE OR REPLACE FUNCTION can_modify_resource(
    p_group_id UUID, 
    p_user_id UUID, 
    p_created_by UUID, 
    p_edit_mode TEXT
  ) RETURNS BOOLEAN AS $func$
  DECLARE
    v_role TEXT;
  BEGIN
    -- Get user''s role in the group
    SELECT role INTO v_role FROM group_members 
    WHERE group_id = p_group_id AND user_id = p_user_id;
    
    -- Owner can modify everything
    IF v_role = ''owner'' THEN 
      RETURN TRUE; 
    END IF;
    
    -- Viewer cannot modify anything
    IF v_role = ''viewer'' THEN 
      RETURN FALSE; 
    END IF;
    
    -- Member can modify own resources or public resources
    IF v_role = ''member'' THEN
      -- Can modify if they created it OR if edit_mode is ''public''
      RETURN (p_created_by = p_user_id OR (p_edit_mode = ''public'' OR p_edit_mode IS NULL));
    END IF;
    
    -- Default: deny access
    RETURN FALSE;
  END;
  $func$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '''';
  ';
END $$;

-- Check if user can delete a resource
DO $$
BEGIN
  EXECUTE '
  CREATE OR REPLACE FUNCTION can_delete_resource(
    p_group_id UUID, 
    p_user_id UUID, 
    p_created_by UUID
  ) RETURNS BOOLEAN AS $func$
  DECLARE
    v_role TEXT;
  BEGIN
    SELECT role INTO v_role FROM group_members 
    WHERE group_id = p_group_id AND user_id = p_user_id;
    
    -- Owner can delete everything
    IF v_role = ''owner'' THEN 
      RETURN TRUE; 
    END IF;
    
    -- Member can delete only their own resources
    IF v_role = ''member'' THEN
      RETURN p_created_by = p_user_id;
    END IF;
    
    -- Viewer cannot delete
    RETURN FALSE;
  END;
  $func$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '''';
  ';
END $$;

-- ============================================================================
-- STEP 4: Update RLS Policies for all resource tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CARDS TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Group members can manage cards" ON cards;

CREATE POLICY "cards_select" ON cards 
FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "cards_insert" ON cards 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = cards.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'member')
  ) AND created_by = auth.uid()
);

CREATE POLICY "cards_update" ON cards 
FOR UPDATE USING (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
) WITH CHECK (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
);

CREATE POLICY "cards_delete" ON cards 
FOR DELETE USING (
  can_delete_resource(group_id, auth.uid(), created_by)
);

-- ----------------------------------------------------------------------------
-- DOCUMENTS TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Group members can manage documents" ON documents;

CREATE POLICY "documents_select" ON documents 
FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "documents_insert" ON documents 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = documents.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'member')
  ) AND created_by = auth.uid()
);

CREATE POLICY "documents_update" ON documents 
FOR UPDATE USING (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
) WITH CHECK (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
);

CREATE POLICY "documents_delete" ON documents 
FOR DELETE USING (
  can_delete_resource(group_id, auth.uid(), created_by)
);

-- ----------------------------------------------------------------------------
-- EVENTS TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Group members can manage events" ON events;

CREATE POLICY "events_select" ON events 
FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "events_insert" ON events 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = events.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'member')
  ) AND created_by = auth.uid()
);

CREATE POLICY "events_update" ON events 
FOR UPDATE USING (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
) WITH CHECK (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
);

CREATE POLICY "events_delete" ON events 
FOR DELETE USING (
  can_delete_resource(group_id, auth.uid(), created_by)
);

-- ----------------------------------------------------------------------------
-- LISTS TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Group members can manage lists" ON lists;

CREATE POLICY "lists_select" ON lists 
FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "lists_insert" ON lists 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = lists.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'member')
  ) AND created_by = auth.uid()
);

CREATE POLICY "lists_update" ON lists 
FOR UPDATE USING (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
) WITH CHECK (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
);

CREATE POLICY "lists_delete" ON lists 
FOR DELETE USING (
  can_delete_resource(group_id, auth.uid(), created_by)
);

-- ----------------------------------------------------------------------------
-- SUBSCRIPTIONS TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Group members can manage subscriptions" ON subscriptions;

CREATE POLICY "subscriptions_select" ON subscriptions 
FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "subscriptions_insert" ON subscriptions 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = subscriptions.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'member')
  ) AND created_by = auth.uid()
);

CREATE POLICY "subscriptions_update" ON subscriptions 
FOR UPDATE USING (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
) WITH CHECK (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
);

CREATE POLICY "subscriptions_delete" ON subscriptions 
FOR DELETE USING (
  can_delete_resource(group_id, auth.uid(), created_by)
);

-- ----------------------------------------------------------------------------
-- NOTES TABLE POLICIES (Update existing)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view notes from their groups" ON notes;
DROP POLICY IF EXISTS "Users can create notes in their groups" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

CREATE POLICY "notes_select" ON notes 
FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "notes_insert" ON notes 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = notes.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'member')
  ) AND created_by = auth.uid()
);

CREATE POLICY "notes_update" ON notes 
FOR UPDATE USING (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
) WITH CHECK (
  can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
);

CREATE POLICY "notes_delete" ON notes 
FOR DELETE USING (
  can_delete_resource(group_id, auth.uid(), created_by)
);

-- ----------------------------------------------------------------------------
-- GROUP_MEMBERS TABLE POLICIES (Update to include role management)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can delete their own membership or owners can delete any" ON group_members;

CREATE POLICY "group_members_select" ON group_members
FOR SELECT USING (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  ) OR user_id = auth.uid()
);

CREATE POLICY "group_members_insert" ON group_members
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "group_members_update" ON group_members
FOR UPDATE USING (
  -- Only owners can update roles
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'owner'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'owner'
  )
);

CREATE POLICY "group_members_delete" ON group_members
FOR DELETE USING (
  -- Users can delete their own membership OR owners can delete any membership
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'owner'
  )
);

-- ----------------------------------------------------------------------------
-- FAMILY_GROUPS TABLE POLICIES (Update to use roles)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update groups they own" ON family_groups;
DROP POLICY IF EXISTS "Users can delete groups they own" ON family_groups;

CREATE POLICY "family_groups_update" ON family_groups
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = family_groups.id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = family_groups.id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

CREATE POLICY "family_groups_delete" ON family_groups
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = family_groups.id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================================================
-- STEP 5: Create performance indexes
-- ============================================================================

-- Role-based indexes
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(group_id, user_id, role);
CREATE INDEX IF NOT EXISTS idx_group_members_user_role ON group_members(user_id, role);

-- Resource tracking indexes
CREATE INDEX IF NOT EXISTS idx_cards_created_by ON cards(created_by);
CREATE INDEX IF NOT EXISTS idx_cards_edit_mode ON cards(edit_mode) WHERE edit_mode = 'private';

CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_edit_mode ON documents(edit_mode) WHERE edit_mode = 'private';

CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_edit_mode ON events(edit_mode) WHERE edit_mode = 'private';

CREATE INDEX IF NOT EXISTS idx_lists_created_by ON lists(created_by);
CREATE INDEX IF NOT EXISTS idx_lists_edit_mode ON lists(edit_mode) WHERE edit_mode = 'private';

CREATE INDEX IF NOT EXISTS idx_subscriptions_created_by ON subscriptions(created_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_edit_mode ON subscriptions(edit_mode) WHERE edit_mode = 'private';

CREATE INDEX IF NOT EXISTS idx_notes_edit_mode ON notes(edit_mode) WHERE edit_mode = 'private';

-- ============================================================================
-- STEP 6: Create triggers for automatic updated_at updates
-- ============================================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_lists_updated_at ON lists;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;

-- Create triggers for all resource tables
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The RBAC system is now in place with:
-- - Owner role: Full control over family and all resources
-- - Member role: Can create and modify own/unlocked resources
-- - Viewer role: Read-only access
-- - Resource edit mode: Owners can set resources to 'private' (only owner can edit) or 'public' (members can edit)
-- - Audit trail: created_by, updated_by, updated_at tracked on all resources
