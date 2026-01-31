-- Migration script to add subscriptions table to existing Family OS installation
-- Run this in your Supabase SQL editor

-- Create subscriptions table
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

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Group members can manage subscriptions" ON subscriptions
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_id ON subscriptions(group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payer_id ON subscriptions(payer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment_date ON subscriptions(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_cycle ON subscriptions(billing_cycle);

-- Enable realtime for subscriptions table
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;

-- Example data (optional - remove if not needed)
-- INSERT INTO subscriptions (group_id, title, provider, cost, currency, billing_cycle, next_payment_date, start_date, category, is_active)
-- VALUES 
--   ((SELECT id FROM family_groups LIMIT 1), 'Netflix', 'Netflix Inc.', 15.99, 'USD', 'monthly', '2024-02-01', '2024-01-01', 'streaming', true),
--   ((SELECT id FROM family_groups LIMIT 1), 'Spotify Family', 'Spotify', 16.99, 'USD', 'monthly', '2024-02-15', '2024-01-15', 'streaming', true); 