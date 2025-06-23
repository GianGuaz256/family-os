-- Migration script to add new columns to existing events table
-- Run this in your Supabase SQL editor if you have an existing events table

-- Add new columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'single',
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT,
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add constraints (drop first if they exist to avoid conflicts)
DO $$ 
BEGIN
    -- Add event_type constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_event_type') THEN
        ALTER TABLE events ADD CONSTRAINT check_event_type 
        CHECK (event_type IN ('single', 'recurring', 'range'));
    END IF;
    
    -- Add recurrence_pattern constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_recurrence_pattern') THEN
        ALTER TABLE events ADD CONSTRAINT check_recurrence_pattern 
        CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly') OR recurrence_pattern IS NULL);
    END IF;
END $$;

-- Update existing events to have event_type = 'single'
UPDATE events 
SET event_type = 'single' 
WHERE event_type IS NULL;

-- Create index for better performance on event_type queries
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_recurrence_end_date ON events(recurrence_end_date); 