-- Migration: Add notes table to support Family OS Notes feature
-- Run this script in your Supabase SQL editor

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    is_important boolean DEFAULT false,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_group_id ON public.notes(group_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON public.notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_is_important ON public.notes(is_important);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for reading notes: Users can read notes from their family groups
CREATE POLICY "Users can view notes from their groups" ON public.notes
    FOR SELECT USING (
        group_id IN (
            SELECT gm.group_id 
            FROM public.group_members gm 
            WHERE gm.user_id = auth.uid()
        )
    );

-- Policy for inserting notes: Users can create notes in their family groups
CREATE POLICY "Users can create notes in their groups" ON public.notes
    FOR INSERT WITH CHECK (
        group_id IN (
            SELECT gm.group_id 
            FROM public.group_members gm 
            WHERE gm.user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Policy for updating notes: Users can update notes they created in their family groups
CREATE POLICY "Users can update their own notes" ON public.notes
    FOR UPDATE USING (
        created_by = auth.uid()
        AND group_id IN (
            SELECT gm.group_id 
            FROM public.group_members gm 
            WHERE gm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        created_by = auth.uid()
        AND group_id IN (
            SELECT gm.group_id 
            FROM public.group_members gm 
            WHERE gm.user_id = auth.uid()
        )
    );

-- Policy for deleting notes: Users can delete notes they created
CREATE POLICY "Users can delete their own notes" ON public.notes
    FOR DELETE USING (
        created_by = auth.uid()
        AND group_id IN (
            SELECT gm.group_id 
            FROM public.group_members gm 
            WHERE gm.user_id = auth.uid()
        )
    );

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER 
SET search_path = ''
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_updated_at();

-- Create a function to ensure only one note per family can be marked as important
CREATE OR REPLACE FUNCTION ensure_single_important_note()
RETURNS TRIGGER 
SET search_path = ''
SECURITY DEFINER
AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single important note per family
CREATE TRIGGER trigger_ensure_single_important_note
    BEFORE INSERT OR UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_important_note();

-- Grant permissions
GRANT ALL ON public.notes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 