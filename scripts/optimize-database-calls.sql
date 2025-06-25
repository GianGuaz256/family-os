-- Database Call Optimization Script
-- This script helps optimize database performance by adding proper indexes
-- and understanding current table usage patterns

-- ============================================================================
-- 1. Add Missing Indexes for Better Query Performance
-- ============================================================================

-- Index for group_members table (heavily used in joins)
CREATE INDEX IF NOT EXISTS idx_group_members_user_group ON group_members(user_id, group_id);

-- Compound indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_documents_group_created ON documents(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_group_date ON events(group_id, date);
CREATE INDEX IF NOT EXISTS idx_cards_group_created ON cards(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_active ON subscriptions(group_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_group_created ON notes(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lists_group_created ON lists(group_id, created_at DESC);

-- Index for auth lookups
CREATE INDEX IF NOT EXISTS idx_family_groups_owner ON family_groups(owner_id);

-- ============================================================================
-- 2. View to Reduce Query Count
-- ============================================================================

-- Create a consolidated view for dashboard data (optional optimization)
CREATE OR REPLACE VIEW dashboard_summary AS
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

-- Grant permissions
GRANT SELECT ON dashboard_summary TO authenticated;

-- ============================================================================
-- 3. Completion Message
-- ============================================================================

SELECT 'Database optimization indexes created. Check application code for realtime subscription optimization.' as status; 