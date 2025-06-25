-- Fix Security Warnings Script
-- This script addresses multiple security warnings from Supabase linter
-- Run this in your Supabase SQL editor

-- ============================================================================
-- Fix 1: Function Search Path Mutable Issues
-- Adding proper search_path settings to all functions for security
-- ============================================================================

-- Fix update_notes_updated_at function
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

-- Fix ensure_single_important_note function
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

-- Fix update_documents_updated_at function
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER 
SET search_path = ''
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix format_file_size function
CREATE OR REPLACE FUNCTION format_file_size(size_in_bytes INTEGER)
RETURNS TEXT 
SET search_path = ''
SECURITY DEFINER
AS $$
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Security Notes for Manual Auth Configuration
-- ============================================================================

-- The following warnings require manual configuration in your Supabase dashboard:
--
-- 1. auth_otp_long_expiry: 
--    Go to Authentication > Settings > OTP Expiry
--    Set the expiry time to less than 1 hour (3600 seconds)
--    Recommended: 15-30 minutes (900-1800 seconds)
--
-- 2. auth_leaked_password_protection:
--    Go to Authentication > Settings > Password Protection
--    Enable "Leaked Password Protection"
--    This will check passwords against HaveIBeenPwned.org database
--
-- These settings cannot be changed via SQL and must be configured through
-- the Supabase Dashboard under Project Settings > Authentication

SELECT 'Security functions updated successfully! Please check Supabase dashboard for auth settings.' as status; 