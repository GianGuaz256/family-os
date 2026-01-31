-- Create profiles table for storing public user profile information
-- This table mirrors user_metadata from auth.users but makes it queryable by other users
-- in the same family group, enabling display names and profile images to be shown
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    profile_image TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster lookups by id
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can view profiles of members in their family groups
DROP POLICY IF EXISTS "Users can view profiles of family members" ON profiles;
CREATE POLICY "Users can view profiles of family members" ON profiles
    FOR SELECT USING (
        id IN (
            SELECT gm.user_id
            FROM group_members gm
            WHERE gm.group_id IN (
                SELECT group_id
                FROM group_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users can delete their own profile (will cascade from auth.users deletion)
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
CREATE POLICY "Users can delete their own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;

-- Create a function to create default profile for new users
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Backfill profiles for existing users
-- This will create profiles for existing users who don't have them yet
INSERT INTO profiles (id, email, display_name, profile_image)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'display_name', NULL),
    COALESCE(au.raw_user_meta_data->>'profile_image', NULL)
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE profiles IS 'Public user profile information that can be viewed by family members';
COMMENT ON COLUMN profiles.id IS 'User ID, references auth.users(id)';
COMMENT ON COLUMN profiles.email IS 'User email address';
COMMENT ON COLUMN profiles.display_name IS 'User display name set in settings';
COMMENT ON COLUMN profiles.profile_image IS 'User profile image (lucide icon, URL, or emoji)';
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp of last profile update';
