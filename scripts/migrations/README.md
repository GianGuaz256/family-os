# Family OS Database Migrations Guide

This guide provides complete instructions for setting up and migrating the Family OS database schema.

## 📋 Table of Contents

1. [Overview](#overview)
2. [For New Projects (Fresh Setup)](#for-new-projects-fresh-setup)
3. [For Existing Databases (Migration)](#for-existing-databases-migration)
4. [Using Supabase MCP (Recommended)](#using-supabase-mcp-recommended)
5. [Verification Steps](#verification-steps)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

## Overview

### What's New

This consolidated schema replaces **15 incremental migration scripts** with a single, comprehensive setup file:

- ✅ **Single source of truth** - All schema definitions in one file
- ✅ **RBAC integrated** - Role-based access control from the start
- ✅ **Production-ready** - All optimizations and security fixes included
- ✅ **Well-documented** - Extensive comments explaining each component

### Schema Summary

| Component | Count | Details |
|-----------|-------|---------|
| Tables | 10 | family_groups, group_members, profiles, user_preferences, lists, documents, events, subscriptions, cards, notes |
| Indexes | 50+ | Optimized for common query patterns |
| RLS Policies | 40+ | Comprehensive security for all tables |
| Functions | 8 | Permission checks, utilities, auto-creation |
| Triggers | 12+ | Automatic timestamp and data integrity |
| Views | 2 | documents_with_metadata, dashboard_summary |

### RBAC System

Three role levels:

- **Owner** - Full control over family and all resources
- **Member** - Can create resources, modify own/public resources
- **Viewer** - Read-only access

Resource edit modes:

- **Public** - All members can edit (default)
- **Private** - Only creator and owners can edit

## For New Projects (Fresh Setup)

### Prerequisites

- Supabase project created
- Database access (SQL Editor or MCP)
- No existing Family OS tables

### Option A: Supabase SQL Editor

1. **Navigate to SQL Editor**
   - Log into your Supabase dashboard
   - Go to: SQL Editor (left sidebar)

2. **Run the Setup Script**
   ```sql
   -- Copy and paste the entire contents of:
   -- scripts/migrations/001-complete-schema.sql
   ```

3. **Execute**
   - Click "Run" button
   - Wait for completion (should take 2-5 seconds)

4. **Verify Success**
   - Check output message: "Family OS database schema setup complete!"
   - Verify tables exist in Table Editor

### Option B: Supabase MCP (Cursor IDE)

See [Using Supabase MCP](#using-supabase-mcp-recommended) section below.

### What Gets Created

The fresh setup creates:

1. **Core Tables**
   - `family_groups` - Family entities
   - `group_members` - User-group relationships with roles
   - `profiles` - User profile data
   - `user_preferences` - User settings

2. **Resource Tables** (with RBAC)
   - `lists` - Shared family lists
   - `documents` - Document storage (files and URLs)
   - `events` - Calendar events
   - `subscriptions` - Subscription tracking
   - `cards` - Loyalty cards
   - `notes` - Family notes

3. **Automation**
   - Auto-profile creation for new users
   - Auto-preferences for new users
   - Timestamp tracking on updates
   - Single important note enforcement

4. **Security**
   - RLS policies on all tables
   - Secure functions with `SECURITY DEFINER`
   - Permission check functions

5. **Performance**
   - Composite indexes for common joins
   - Filtered indexes for private resources
   - Optimized views for dashboard

## For Existing Databases (Migration)

### ⚠️ Important Notes

- **Backup First** - Always backup your database before migration
- **Downtime** - Plan for brief downtime during migration
- **Test First** - Test on a staging environment if possible

### Migration Paths

#### Path 1: Clean Migration (Recommended for Development)

This approach drops and recreates the schema. **Only use in development!**

1. **Backup Your Data**
   ```sql
   -- Export all data to a backup
   -- Use Supabase Dashboard > Database > Backups
   ```

2. **Drop Existing Tables** (Optional - Only if you want clean slate)
   ```sql
   -- WARNING: This deletes all data!
   DROP TABLE IF EXISTS notes CASCADE;
   DROP TABLE IF EXISTS cards CASCADE;
   DROP TABLE IF EXISTS subscriptions CASCADE;
   DROP TABLE IF EXISTS events CASCADE;
   DROP TABLE IF EXISTS documents CASCADE;
   DROP TABLE IF EXISTS lists CASCADE;
   DROP TABLE IF EXISTS user_preferences CASCADE;
   DROP TABLE IF EXISTS profiles CASCADE;
   DROP TABLE IF EXISTS group_members CASCADE;
   DROP TABLE IF EXISTS family_groups CASCADE;
   ```

3. **Run Fresh Setup**
   - Execute `001-complete-schema.sql`

4. **Restore Data** (if needed)
   - Import backed up data

#### Path 2: In-Place Migration (Production Safe)

This approach updates existing schema without data loss.

1. **Backup Your Database**
   ```sql
   -- Create a backup point
   -- Supabase Dashboard > Database > Backups
   ```

2. **Run Migration Script**
   
   The consolidated script uses `IF NOT EXISTS` and `IF EXISTS` checks, making it safe to run on existing databases. It will:
   
   - Create missing tables
   - Add missing columns
   - Create missing indexes
   - Update functions to latest versions
   - Update RLS policies

   ```sql
   -- Execute: scripts/migrations/001-complete-schema.sql
   -- The script is idempotent and safe for existing data
   ```

3. **Migrate Existing Data to New Fields**

   If you're coming from a database without RBAC, run this migration:

   ```sql
   -- Migrate group_members to have roles
   -- Set owners based on family_groups.owner_id
   UPDATE group_members gm
   SET role = 'owner'
   FROM family_groups fg
   WHERE gm.group_id = fg.id 
     AND gm.user_id = fg.owner_id
     AND gm.role = 'member';

   -- Migrate documents.uploaded_by to created_by
   UPDATE documents 
   SET created_by = uploaded_by 
   WHERE created_by IS NULL AND uploaded_by IS NOT NULL;
   ```

4. **Verify Migration**
   - Check all tables exist
   - Verify roles are assigned correctly
   - Test CRUD operations
   - Check RLS policies work

## Using Supabase MCP (Recommended)

The Supabase Model Context Protocol (MCP) allows you to execute SQL directly from Cursor IDE.

### Setup Supabase MCP

1. **Configure MCP** (Already done in this project)
   
   File: `.cursor/mcp.json`
   ```json
   {
     "mcpServers": {
       "supabase": {
         "url": "https://mcp.supabase.com/mcp?project_ref=pyoyjirituyntkblqdvt"
       }
     }
   }
   ```

2. **Restart Cursor**
   - Close and reopen Cursor IDE
   - MCP should prompt for authentication

3. **Authenticate**
   - Browser window will open
   - Log into your Supabase account
   - Grant organization access
   - Select your organization

4. **Verify Connection**
   - Go to: Settings > Cursor Settings > Tools & MCP
   - Confirm "supabase" server is listed and connected

### Execute Schema via MCP

Once MCP is authenticated, you can run migrations directly:

1. **In Cursor, ask the AI:**
   ```
   Run the SQL script at scripts/migrations/001-complete-schema.sql 
   on my Supabase database using MCP
   ```

2. **Or use MCP tools directly:**
   - The AI will use the Supabase MCP tools
   - Execute SQL commands
   - Report results back to you

### MCP Advantages

- ✅ **No context switching** - Stay in your IDE
- ✅ **Version controlled** - SQL scripts tracked in git
- ✅ **Automated execution** - AI can run migrations
- ✅ **Immediate feedback** - See results in real-time

### Security Considerations

- 🔒 **Use development projects** - Don't connect to production
- 🔒 **Manual approval** - Keep tool approval enabled in Cursor
- 🔒 **Read-only mode** - Consider using `read_only=true` in MCP URL
- 🔒 **Project scoping** - Scope MCP to specific project (already done)

## Verification Steps

### 1. Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'family_groups', 'group_members', 'profiles', 'user_preferences',
    'lists', 'documents', 'events', 'subscriptions', 'cards', 'notes'
  )
ORDER BY table_name;

-- Should return 10 rows
```

### 2. Verify RBAC Columns

```sql
-- Check group_members has role column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'group_members' AND column_name = 'role';

-- Check resource tables have RBAC fields
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('lists', 'documents', 'events', 'subscriptions', 'cards', 'notes')
  AND column_name IN ('created_by', 'edit_mode', 'updated_by', 'updated_at')
ORDER BY table_name, column_name;

-- Should return 24 rows (6 tables × 4 columns)
```

### 3. Check Indexes

```sql
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'family_groups', 'group_members', 'lists', 'documents', 
    'events', 'subscriptions', 'cards', 'notes'
  )
ORDER BY tablename, indexname;

-- Should return 50+ indexes
```

### 4. Verify Functions

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_role',
    'can_modify_resource',
    'can_delete_resource',
    'update_updated_at_column',
    'format_file_size',
    'ensure_single_important_note',
    'create_user_profile',
    'create_user_preferences'
  )
ORDER BY routine_name;

-- Should return 8 functions
```

### 5. Test RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'family_groups', 'group_members', 'lists', 'documents', 
    'events', 'subscriptions', 'cards', 'notes', 'profiles', 'user_preferences'
  );

-- All should show rowsecurity = true

-- Count policies
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Should show 40+ total policies across all tables
```

### 6. Check Views

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('documents_with_metadata', 'dashboard_summary');

-- Should return 2 rows
```

### 7. Test Realtime

```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN (
    'family_groups', 'group_members', 'lists', 'documents', 
    'events', 'subscriptions', 'cards', 'notes'
  );

-- Should return 8 tables
```

### 8. Functional Test

Create a test family and verify RBAC works:

```sql
-- As authenticated user, create a test family
INSERT INTO family_groups (name, owner_id, invite_code, icon)
VALUES ('Test Family', auth.uid(), 'TEST1234', '🧪')
RETURNING *;

-- Verify group_members entry was NOT auto-created (you need to add it)
-- Add yourself as owner
INSERT INTO group_members (group_id, user_id, role)
VALUES ('<family_id_from_above>', auth.uid(), 'owner');

-- Try to create a private list
INSERT INTO lists (group_id, title, created_by, edit_mode)
VALUES ('<family_id>', 'Test List', auth.uid(), 'private')
RETURNING *;

-- Verify you can modify it
UPDATE lists 
SET title = 'Modified Test List'
WHERE id = '<list_id_from_above>';

-- Clean up test data
DELETE FROM family_groups WHERE invite_code = 'TEST1234';
```

## Rollback Procedures

### If Migration Fails Mid-Way

1. **Check Error Message**
   - Read the SQL error carefully
   - Identify which section failed

2. **Fix the Issue**
   - Most errors are due to:
     - Conflicting policy names
     - Missing prerequisites
     - Data type mismatches

3. **Resume Migration**
   - The script is idempotent
   - Re-run from the beginning
   - It will skip existing objects

### Complete Rollback (Last Resort)

If you need to completely undo the migration:

```sql
-- WARNING: This deletes ALL Family OS data!

-- Drop all views
DROP VIEW IF EXISTS dashboard_summary CASCADE;
DROP VIEW IF EXISTS documents_with_metadata CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS create_user_preferences() CASCADE;
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS ensure_single_important_note() CASCADE;
DROP FUNCTION IF EXISTS format_file_size(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS can_delete_resource(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS can_modify_resource(UUID, UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(UUID, UUID) CASCADE;

-- Drop all tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS family_groups CASCADE;

-- Note: This does NOT delete auth.users data
```

Then restore from your backup using Supabase Dashboard.

## Troubleshooting

### Common Issues

#### Issue: "relation already exists"

**Cause:** Tables already exist from previous setup

**Solution:** Either:
- Use in-place migration (script handles this with `IF NOT EXISTS`)
- Drop existing tables first (data loss!)
- Check for naming conflicts

#### Issue: "role does not exist" or "permission denied"

**Cause:** Missing database permissions

**Solution:**
```sql
-- Grant necessary permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
```

#### Issue: "constraint already exists"

**Cause:** Constraint with same name exists

**Solution:** The script handles this with `DO $$ BEGIN ... END $$` blocks. If still failing:
```sql
-- Drop the conflicting constraint
ALTER TABLE <table_name> DROP CONSTRAINT IF EXISTS <constraint_name>;
-- Then re-run the script
```

#### Issue: RLS prevents data access

**Cause:** User not in group_members table

**Solution:**
```sql
-- Check your memberships
SELECT * FROM group_members WHERE user_id = auth.uid();

-- If none, check your user ID
SELECT auth.uid();

-- Verify family groups exist
SELECT * FROM family_groups;

-- Add yourself to a group if needed (as owner)
INSERT INTO group_members (group_id, user_id, role)
VALUES ('<group_id>', auth.uid(), 'owner');
```

#### Issue: Triggers not firing

**Cause:** Trigger wasn't created or function missing

**Solution:**
```sql
-- Check if triggers exist
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Recreate missing trigger
CREATE TRIGGER <trigger_name>
  BEFORE UPDATE ON <table_name>
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Issue: MCP not working

**Cause:** Authentication or configuration issue

**Solution:**
1. Check `.cursor/mcp.json` exists and has correct project_ref
2. Restart Cursor IDE
3. Clear Cursor cache: `Cmd/Ctrl + Shift + P` > "Clear Cache"
4. Re-authenticate when prompted
5. Check Settings > Tools & MCP for error messages

### Getting Help

If you encounter issues:

1. **Check Supabase Logs**
   - Dashboard > Logs > Postgres Logs
   - Look for detailed error messages

2. **Verify Prerequisites**
   - Ensure auth.users schema exists
   - Check database version (should be PostgreSQL 15+)

3. **Test Incrementally**
   - Run script section by section
   - Identify exact failing section

4. **Community Support**
   - Supabase Discord
   - GitHub Issues
   - Stack Overflow

## Best Practices

### Development Workflow

1. **Always use version control**
   - Track all schema changes in git
   - Document why changes were made

2. **Test on staging first**
   - Never test migrations directly on production
   - Use Supabase branching if available

3. **Backup before migration**
   - Automated backups are good
   - Manual backup before big changes is better

4. **Document custom changes**
   - If you modify the schema, document it
   - Update this README with project-specific notes

### Production Deployment

1. **Schedule downtime**
   - Brief maintenance window
   - Notify users in advance

2. **Plan rollback**
   - Have rollback steps ready
   - Keep backup accessible

3. **Monitor after deployment**
   - Watch error rates
   - Check performance metrics
   - Verify RLS policies work

4. **Gradual rollout**
   - If possible, test with subset of users first
   - Use feature flags for new functionality

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## Changelog

### Version 1.0.0 (Current)

- ✅ Consolidated 15 migration scripts into single schema
- ✅ Integrated RBAC system from the start
- ✅ 50+ performance indexes
- ✅ Comprehensive RLS policies
- ✅ 8 helper functions for permissions and utilities
- ✅ 12+ triggers for automation
- ✅ 2 optimized views
- ✅ Realtime enabled on 8 tables
- ✅ Full documentation and migration guide

### Previous Versions (Legacy)

See `scripts/legacy/` for historical migration scripts:
- setup-database.sql
- add-rbac-system.sql
- enhance-documents-storage.sql
- And 12 more...

---

**Last Updated:** January 2026  
**Maintained By:** Family OS Team
