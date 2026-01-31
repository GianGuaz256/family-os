-- ============================================================================
-- Family OS - Complete Database Schema
-- Version: 1.0.0
-- ============================================================================
--
-- This is a consolidated, production-ready database setup script that replaces
-- all previous incremental migration scripts. Use this for fresh database setups.
--
-- Features:
-- - 10 tables with complete schema definitions
-- - Role-Based Access Control (RBAC) with owner/member/viewer roles
-- - Row Level Security (RLS) policies for all tables
-- - Performance indexes (50+)
-- - Helper functions for permission checks
-- - Automatic triggers for timestamp updates
-- - Realtime subscriptions enabled
-- - Optimized views for common queries
--
-- For existing databases, see migrations/README.md for migration instructions.
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 Family Groups Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT '🏠',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE family_groups IS 'Family groups - the primary organizational unit';
COMMENT ON COLUMN family_groups.owner_id IS 'Original creator of the family group';
COMMENT ON COLUMN family_groups.invite_code IS 'Unique code for inviting new members';
COMMENT ON COLUMN family_groups.icon IS 'Emoji icon for the family group';

-- ----------------------------------------------------------------------------
-- 1.2 Group Members Table (with RBAC roles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

COMMENT ON TABLE group_members IS 'Maps users to family groups with role-based permissions';
COMMENT ON COLUMN group_members.role IS 'User role: owner (full control), member (can create/edit), viewer (read-only)';

-- ----------------------------------------------------------------------------
-- 1.3 User Profiles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  profile_image TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Public user profile information viewable by family members';
COMMENT ON COLUMN profiles.profile_image IS 'Profile image (lucide icon, URL, or emoji)';

-- ----------------------------------------------------------------------------
-- 1.4 User Preferences Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language VARCHAR(2) DEFAULT 'en' CHECK (language IN ('en', 'it')),
  theme VARCHAR(10) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

COMMENT ON TABLE user_preferences IS 'User-specific preferences (language, theme, notifications)';

-- ----------------------------------------------------------------------------
-- 1.5 Lists Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edit_mode TEXT DEFAULT 'public' CHECK (edit_mode IN ('private', 'public')),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE lists IS 'Shared family lists (shopping, todo, etc.)';
COMMENT ON COLUMN lists.items IS 'Array of list items in JSON format';
COMMENT ON COLUMN lists.edit_mode IS 'private = only creator/owner can edit, public = all members can edit';

-- ----------------------------------------------------------------------------
-- 1.6 Documents Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  file_data BYTEA,
  file_size INTEGER CHECK (file_size IS NULL OR file_size <= 5242880),
  mime_type TEXT,
  file_extension TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edit_mode TEXT DEFAULT 'public' CHECK (edit_mode IN ('private', 'public')),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_document_source CHECK (
    (url IS NOT NULL AND file_data IS NULL) OR 
    (url IS NULL AND file_data IS NOT NULL)
  )
);

COMMENT ON TABLE documents IS 'Family documents - can store files directly or URLs';
COMMENT ON COLUMN documents.file_data IS 'Binary file data (max 5MB)';
COMMENT ON COLUMN documents.url IS 'External URL (if not storing file directly)';
COMMENT ON CONSTRAINT check_document_source ON documents IS 'Ensures either URL or file data is provided, not both';

-- ----------------------------------------------------------------------------
-- 1.7 Events Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  event_type TEXT DEFAULT 'single' CHECK (event_type IN ('single', 'recurring', 'range')),
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly') OR recurrence_pattern IS NULL),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end_date DATE,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edit_mode TEXT DEFAULT 'public' CHECK (edit_mode IN ('private', 'public')),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE events IS 'Family calendar events with support for recurring events';
COMMENT ON COLUMN events.date IS 'Primary date field (kept for backward compatibility)';
COMMENT ON COLUMN events.event_type IS 'single (one-time), recurring (repeats), or range (multi-day)';
COMMENT ON COLUMN events.recurrence_interval IS 'Repeat every X days/weeks/months/years';

-- ----------------------------------------------------------------------------
-- 1.8 Subscriptions Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  provider TEXT,
  cost DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  billing_day INTEGER,
  payer_id UUID REFERENCES auth.users(id),
  category TEXT CHECK (category IN ('streaming', 'utilities', 'insurance', 'software', 'fitness', 'food', 'transport', 'gaming', 'news', 'cloud', 'other') OR category IS NULL),
  payment_method TEXT,
  next_payment_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  notify_days_before INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  website_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edit_mode TEXT DEFAULT 'public' CHECK (edit_mode IN ('private', 'public')),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE subscriptions IS 'Family subscriptions tracking (Netflix, Spotify, etc.)';
COMMENT ON COLUMN subscriptions.billing_day IS 'Day of month/week for billing (1-31 for monthly, 1-7 for weekly)';
COMMENT ON COLUMN subscriptions.payer_id IS 'Family member who pays for this subscription';

-- ----------------------------------------------------------------------------
-- 1.9 Cards Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  card_number TEXT,
  barcode TEXT,
  points_balance TEXT,
  expiry_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edit_mode TEXT DEFAULT 'public' CHECK (edit_mode IN ('private', 'public')),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cards IS 'Loyalty cards, membership cards, etc.';

-- ----------------------------------------------------------------------------
-- 1.10 Notes Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edit_mode TEXT DEFAULT 'public' CHECK (edit_mode IN ('private', 'public')),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE notes IS 'Family notes - one note per family can be marked as important';
COMMENT ON COLUMN notes.is_important IS 'Only one note per family can be marked important';

-- ============================================================================
-- SECTION 2: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Family groups indexes
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code ON family_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_family_groups_owner ON family_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_family_groups_icon ON family_groups(icon);

-- Group members indexes
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_group ON group_members(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(group_id, user_id, role);
CREATE INDEX IF NOT EXISTS idx_group_members_user_role ON group_members(user_id, role);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Lists indexes
CREATE INDEX IF NOT EXISTS idx_lists_group_id ON lists(group_id);
CREATE INDEX IF NOT EXISTS idx_lists_group_created ON lists(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lists_created_by ON lists(created_by);
CREATE INDEX IF NOT EXISTS idx_lists_edit_mode ON lists(edit_mode) WHERE edit_mode = 'private';

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_group_id ON documents(group_id);
CREATE INDEX IF NOT EXISTS idx_documents_group_created ON documents(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_file_size ON documents(file_size);
CREATE INDEX IF NOT EXISTS idx_documents_mime_type ON documents(mime_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_edit_mode ON documents(edit_mode) WHERE edit_mode = 'private';

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_start_datetime ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_events_end_datetime ON events(end_datetime);
CREATE INDEX IF NOT EXISTS idx_events_recurrence_end_date ON events(recurrence_end_date);
CREATE INDEX IF NOT EXISTS idx_events_group_date ON events(group_id, date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_edit_mode ON events(edit_mode) WHERE edit_mode = 'private';

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_id ON subscriptions(group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payer_id ON subscriptions(payer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment_date ON subscriptions(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_cycle ON subscriptions(billing_cycle);
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_active ON subscriptions(group_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_by ON subscriptions(created_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_edit_mode ON subscriptions(edit_mode) WHERE edit_mode = 'private';

-- Cards indexes
CREATE INDEX IF NOT EXISTS idx_cards_group_id ON cards(group_id);
CREATE INDEX IF NOT EXISTS idx_cards_expiry_date ON cards(expiry_date);
CREATE INDEX IF NOT EXISTS idx_cards_group_created ON cards(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_created_by ON cards(created_by);
CREATE INDEX IF NOT EXISTS idx_cards_edit_mode ON cards(edit_mode) WHERE edit_mode = 'private';

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_group_id ON notes(group_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_is_important ON notes(is_important);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_group_created ON notes(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_edit_mode ON notes(edit_mode) WHERE edit_mode = 'private';

-- ============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 Get User Role in a Group
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role(p_group_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.group_members 
  WHERE group_id = p_group_id AND user_id = p_user_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION get_user_role IS 'Returns the user role (owner, member, viewer) in a specific group';

-- ----------------------------------------------------------------------------
-- 3.2 Check if User Can Modify Resource
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION can_modify_resource(
  p_group_id UUID, 
  p_user_id UUID, 
  p_created_by UUID, 
  p_edit_mode TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Get user's role in the group
  SELECT role INTO v_role FROM public.group_members 
  WHERE group_id = p_group_id AND user_id = p_user_id;
  
  -- Owner can modify everything
  IF v_role = 'owner' THEN 
    RETURN TRUE; 
  END IF;
  
  -- Viewer cannot modify anything
  IF v_role = 'viewer' THEN 
    RETURN FALSE; 
  END IF;
  
  -- Member can modify own resources or public resources
  IF v_role = 'member' THEN
    -- Can modify if they created it OR if edit_mode is 'public'
    RETURN (p_created_by = p_user_id OR (p_edit_mode = 'public' OR p_edit_mode IS NULL));
  END IF;
  
  -- Default: deny access
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION can_modify_resource IS 'Checks if user can modify a resource based on role and edit_mode';

-- ----------------------------------------------------------------------------
-- 3.3 Check if User Can Delete Resource
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION can_delete_resource(
  p_group_id UUID, 
  p_user_id UUID, 
  p_created_by UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.group_members 
  WHERE group_id = p_group_id AND user_id = p_user_id;
  
  -- Owner can delete everything
  IF v_role = 'owner' THEN 
    RETURN TRUE; 
  END IF;
  
  -- Member can delete only their own resources
  IF v_role = 'member' THEN
    RETURN p_created_by = p_user_id;
  END IF;
  
  -- Viewer cannot delete
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION can_delete_resource IS 'Checks if user can delete a resource (owner: all, member: own, viewer: none)';

-- ----------------------------------------------------------------------------
-- 3.4 Update Timestamp Trigger Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF TG_TABLE_NAME IN ('lists', 'documents', 'events', 'subscriptions', 'cards', 'notes') THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates updated_at and updated_by fields on row updates';

-- ----------------------------------------------------------------------------
-- 3.5 Format File Size for Display
-- ----------------------------------------------------------------------------
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
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION format_file_size IS 'Formats file size in bytes to human-readable format (B, KB, MB, GB)';

-- ----------------------------------------------------------------------------
-- 3.6 Ensure Single Important Note per Family
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_single_important_note()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new note is being marked as important
  IF NEW.is_important = true THEN
    -- Remove important flag from all other notes in the same group
    UPDATE public.notes 
    SET is_important = false 
    WHERE group_id = NEW.group_id 
    AND id != NEW.id 
    AND is_important = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION ensure_single_important_note IS 'Ensures only one note per family group can be marked as important';

-- ----------------------------------------------------------------------------
-- 3.7 Create User Profile on Auth User Creation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, profile_image)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'profile_image', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION create_user_profile IS 'Automatically creates a profile when a new user signs up';

-- ----------------------------------------------------------------------------
-- 3.8 Create User Preferences on Auth User Creation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id, language, theme, notifications_enabled)
  VALUES (NEW.id, 'en', 'system', true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION create_user_preferences IS 'Automatically creates default preferences for new users';

-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

-- Profiles triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- User preferences triggers
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();

-- Lists triggers
DROP TRIGGER IF EXISTS update_lists_updated_at ON lists;
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Documents triggers
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Events triggers
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Subscriptions triggers
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cards triggers
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notes triggers
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_ensure_single_important_note ON notes;
CREATE TRIGGER trigger_ensure_single_important_note
  BEFORE INSERT OR UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_important_note();

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5.1 Family Groups Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view groups they belong to" ON family_groups;
CREATE POLICY "Users can view groups they belong to" ON family_groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create groups" ON family_groups;
CREATE POLICY "Users can create groups" ON family_groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view family by invite code" ON family_groups;
CREATE POLICY "Anyone can view family by invite code" ON family_groups
  FOR SELECT USING (invite_code IS NOT NULL);

DROP POLICY IF EXISTS "family_groups_update" ON family_groups;
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

DROP POLICY IF EXISTS "family_groups_delete" ON family_groups;
CREATE POLICY "family_groups_delete" ON family_groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = family_groups.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ----------------------------------------------------------------------------
-- 5.2 Group Members Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "group_members_select" ON group_members;
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "group_members_insert" ON group_members;
CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "group_members_update" ON group_members;
CREATE POLICY "group_members_update" ON group_members
  FOR UPDATE USING (
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

DROP POLICY IF EXISTS "group_members_delete" ON group_members;
CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'owner'
    )
  );

-- ----------------------------------------------------------------------------
-- 5.3 Profiles Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view profiles of family members" ON profiles;
CREATE POLICY "Users can view profiles of family members" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 5.4 User Preferences Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own preferences" ON user_preferences;
CREATE POLICY "Users can delete their own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5.5 Lists Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "lists_select" ON lists;
CREATE POLICY "lists_select" ON lists 
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "lists_insert" ON lists;
CREATE POLICY "lists_insert" ON lists 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = lists.group_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'member')
    ) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "lists_update" ON lists;
CREATE POLICY "lists_update" ON lists 
  FOR UPDATE USING (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  ) WITH CHECK (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  );

DROP POLICY IF EXISTS "lists_delete" ON lists;
CREATE POLICY "lists_delete" ON lists 
  FOR DELETE USING (
    can_delete_resource(group_id, auth.uid(), created_by)
  );

-- ----------------------------------------------------------------------------
-- 5.6 Documents Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "documents_select" ON documents;
CREATE POLICY "documents_select" ON documents 
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "documents_insert" ON documents;
CREATE POLICY "documents_insert" ON documents 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = documents.group_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'member')
    ) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "documents_update" ON documents;
CREATE POLICY "documents_update" ON documents 
  FOR UPDATE USING (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  ) WITH CHECK (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  );

DROP POLICY IF EXISTS "documents_delete" ON documents;
CREATE POLICY "documents_delete" ON documents 
  FOR DELETE USING (
    can_delete_resource(group_id, auth.uid(), created_by)
  );

-- ----------------------------------------------------------------------------
-- 5.7 Events Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "events_select" ON events;
CREATE POLICY "events_select" ON events 
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "events_insert" ON events;
CREATE POLICY "events_insert" ON events 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = events.group_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'member')
    ) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "events_update" ON events;
CREATE POLICY "events_update" ON events 
  FOR UPDATE USING (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  ) WITH CHECK (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  );

DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_delete" ON events 
  FOR DELETE USING (
    can_delete_resource(group_id, auth.uid(), created_by)
  );

-- ----------------------------------------------------------------------------
-- 5.8 Subscriptions Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions 
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
CREATE POLICY "subscriptions_insert" ON subscriptions 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = subscriptions.group_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'member')
    ) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
CREATE POLICY "subscriptions_update" ON subscriptions 
  FOR UPDATE USING (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  ) WITH CHECK (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  );

DROP POLICY IF EXISTS "subscriptions_delete" ON subscriptions;
CREATE POLICY "subscriptions_delete" ON subscriptions 
  FOR DELETE USING (
    can_delete_resource(group_id, auth.uid(), created_by)
  );

-- ----------------------------------------------------------------------------
-- 5.9 Cards Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "cards_select" ON cards;
CREATE POLICY "cards_select" ON cards 
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "cards_insert" ON cards;
CREATE POLICY "cards_insert" ON cards 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = cards.group_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'member')
    ) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "cards_update" ON cards;
CREATE POLICY "cards_update" ON cards 
  FOR UPDATE USING (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  ) WITH CHECK (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  );

DROP POLICY IF EXISTS "cards_delete" ON cards;
CREATE POLICY "cards_delete" ON cards 
  FOR DELETE USING (
    can_delete_resource(group_id, auth.uid(), created_by)
  );

-- ----------------------------------------------------------------------------
-- 5.10 Notes Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "notes_select" ON notes;
CREATE POLICY "notes_select" ON notes 
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "notes_insert" ON notes;
CREATE POLICY "notes_insert" ON notes 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = notes.group_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'member')
    ) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "notes_update" ON notes;
CREATE POLICY "notes_update" ON notes 
  FOR UPDATE USING (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  ) WITH CHECK (
    can_modify_resource(group_id, auth.uid(), created_by, edit_mode)
  );

DROP POLICY IF EXISTS "notes_delete" ON notes;
CREATE POLICY "notes_delete" ON notes 
  FOR DELETE USING (
    can_delete_resource(group_id, auth.uid(), created_by)
  );

-- ============================================================================
-- SECTION 6: VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1 Documents with Metadata View
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS documents_with_metadata;
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
  d.created_by,
  d.created_at,
  d.edit_mode,
  d.updated_by,
  d.updated_at,
  format_file_size(d.file_size) as formatted_file_size,
  CASE 
    WHEN d.file_data IS NOT NULL THEN 'file'
    WHEN d.url IS NOT NULL THEN 'url'
    ELSE 'unknown'
  END as document_type
FROM documents d
WHERE d.group_id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
);

COMMENT ON VIEW documents_with_metadata IS 'Documents view with formatted file sizes and type classification';

-- ----------------------------------------------------------------------------
-- 6.2 Dashboard Summary View
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS dashboard_summary;
CREATE VIEW dashboard_summary AS
SELECT 
  fg.id as group_id,
  fg.name as group_name,
  (SELECT count(*) FROM lists WHERE group_id = fg.id) as lists_count,
  (SELECT count(*) FROM documents WHERE group_id = fg.id) as documents_count,
  (SELECT count(*) FROM events WHERE group_id = fg.id) as events_count,
  (SELECT count(*) FROM cards WHERE group_id = fg.id) as cards_count,
  (SELECT count(*) FROM subscriptions WHERE group_id = fg.id AND is_active = true) as active_subscriptions_count,
  (SELECT count(*) FROM notes WHERE group_id = fg.id) as notes_count
FROM family_groups fg;

COMMENT ON VIEW dashboard_summary IS 'Consolidated view for dashboard metrics across all resource types';

-- ============================================================================
-- SECTION 7: GRANTS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO authenticated;
GRANT SELECT ON documents_with_metadata TO authenticated;
GRANT SELECT ON dashboard_summary TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Revoke from anonymous users
REVOKE ALL ON documents_with_metadata FROM anon;
REVOKE ALL ON dashboard_summary FROM anon;

-- ============================================================================
-- SECTION 8: ENABLE REALTIME
-- ============================================================================

-- Enable realtime for all family resource tables
DO $$
BEGIN
  -- Check and add tables to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'family_groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE family_groups;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'group_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'lists'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE lists;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE documents;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cards;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notes;
  END IF;
END $$;

-- ============================================================================
-- SECTION 9: BACKFILL DATA (For Fresh Installs with Existing Auth Users)
-- ============================================================================

-- Create profiles for any existing auth users
INSERT INTO profiles (id, email, display_name, profile_image)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', NULL),
  COALESCE(au.raw_user_meta_data->>'profile_image', NULL)
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Create preferences for any existing auth users
INSERT INTO user_preferences (user_id, language, theme, notifications_enabled)
SELECT id, 'en', 'system', true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

SELECT 
  'Family OS database schema setup complete!' as message,
  '✓ 10 tables created with RBAC support' as tables,
  '✓ 50+ performance indexes' as indexes,
  '✓ Row Level Security enabled' as security,
  '✓ Helper functions and triggers' as automation,
  '✓ Realtime subscriptions enabled' as realtime;
