-- Fix for "Database error saving new user"
-- This migration ensures that the trigger functions have the correct permissions
-- and that the search_path is set correctly to avoid issues during signup.

-- 1. Ensure the functions have the correct search_path and are security definer
-- We already have SECURITY DEFINER and search_path = '' in the original schema,
-- but we need to make sure they can access the public schema.

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, profile_image)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'profile_image', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, language, theme, notifications_enabled)
  VALUES (NEW.id, 'en', 'system', true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 2. Grant necessary permissions to the postgres role (which usually runs these triggers)
-- and to the authenticated/service_role if needed.
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.user_preferences TO postgres;

-- 3. Ensure the triggers are correctly attached
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();

-- 4. Verify RLS policies for inserts (though triggers bypass RLS, it's good to have them correct)
-- These are already in 001-complete-schema.sql but we re-verify here.
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
