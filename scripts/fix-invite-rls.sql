-- Fix RLS policy for family invitations
-- This allows unauthenticated users to read family information by invite code

-- Add a new policy to allow public access to family_groups by invite_code
CREATE POLICY "Anyone can view family by invite code" ON family_groups
  FOR SELECT USING (invite_code IS NOT NULL);

-- Note: This policy allows reading family info by invite code for anyone
-- This is necessary for the invitation process to work for unauthenticated users 