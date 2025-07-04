-- Family OS Database Setup Script
-- Run this in your Supabase SQL editor

-- Create family_groups table
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  icon TEXT DEFAULT '🏠'
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table (clean, focused on events only)
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL, -- Keep for backward compatibility
  start_datetime TIMESTAMPTZ, -- Optional start date and time
  end_datetime TIMESTAMPTZ, -- Optional end date and time
  event_type TEXT DEFAULT 'single' CHECK (event_type IN ('single', 'recurring', 'range')),
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly') OR recurrence_pattern IS NULL),
  recurrence_interval INTEGER DEFAULT 1, -- Every X days/weeks/months/years
  recurrence_end_date DATE, -- When to stop recurring
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table (master subscription data)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  provider TEXT, -- Netflix, Spotify, Amazon Prime, etc.
  cost DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  billing_day INTEGER, -- Day of month/week for billing (1-31 for monthly, 1-7 for weekly)
  payer_id UUID REFERENCES auth.users(id), -- Who pays this subscription
  category TEXT CHECK (category IN ('streaming', 'utilities', 'insurance', 'software', 'fitness', 'food', 'transport', 'gaming', 'news', 'cloud', 'other') OR category IS NULL),
  payment_method TEXT, -- Credit Card, Bank Transfer, PayPal, etc.
  next_payment_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- Optional end date for temporary subscriptions
  auto_renew BOOLEAN DEFAULT true,
  notify_days_before INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- Create cards table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view groups they belong to" ON family_groups;
DROP POLICY IF EXISTS "Users can create groups" ON family_groups;
DROP POLICY IF EXISTS "Anyone can view family by invite code" ON family_groups;
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Group members can manage lists" ON lists;
DROP POLICY IF EXISTS "Group members can manage documents" ON documents;
DROP POLICY IF EXISTS "Group members can manage events" ON events;
DROP POLICY IF EXISTS "Group members can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Group members can manage cards" ON cards;

-- Family groups policies
CREATE POLICY "Users can view groups they belong to" ON family_groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON family_groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Anyone can view family by invite code" ON family_groups
  FOR SELECT USING (invite_code IS NOT NULL);

-- Group members policies
CREATE POLICY "Users can view group memberships" ON group_members
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Lists policies
CREATE POLICY "Group members can manage lists" ON lists
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Documents policies
CREATE POLICY "Group members can manage documents" ON documents
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Events policies
CREATE POLICY "Group members can manage events" ON events
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Subscriptions policies
CREATE POLICY "Group members can manage subscriptions" ON subscriptions
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Cards policies
CREATE POLICY "Group members can manage cards" ON cards
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_lists_group_id ON lists(group_id);
CREATE INDEX IF NOT EXISTS idx_documents_group_id ON documents(group_id);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_cards_group_id ON cards(group_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_cards_expiry_date ON cards(expiry_date);
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code ON family_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_id ON subscriptions(group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payer_id ON subscriptions(payer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment_date ON subscriptions(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_cycle ON subscriptions(billing_cycle);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE family_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE lists;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE cards; 