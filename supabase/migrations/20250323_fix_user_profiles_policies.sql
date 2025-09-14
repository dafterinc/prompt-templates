-- Fix infinite recursion in user_profiles RLS policies
-- This migration fixes the circular dependency issues in the RLS policies

-- First, drop all existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create a function to check admin status without causing recursion
-- This function bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Use a direct query that bypasses RLS to check admin status
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id AND is_admin = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user(UUID) TO authenticated;

-- Recreate user_profiles policies without recursion
CREATE POLICY "Users can view their own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only allow admins to view all profiles (using the function to avoid recursion)
CREATE POLICY "Admins can view all profiles"
    ON user_profiles
    FOR SELECT
    TO authenticated
    USING (is_admin_user(auth.uid()));

-- Now fix the directory table policies to use the function instead of direct queries
-- Drop existing admin policies on directory tables
DROP POLICY IF EXISTS "Allow admin insert to directory_templates" ON directory_templates;
DROP POLICY IF EXISTS "Allow admin update to directory_templates" ON directory_templates;
DROP POLICY IF EXISTS "Allow admin delete from directory_templates" ON directory_templates;
DROP POLICY IF EXISTS "Allow admin insert to directory_categories" ON directory_categories;
DROP POLICY IF EXISTS "Allow admin update to directory_categories" ON directory_categories;
DROP POLICY IF EXISTS "Allow admin delete from directory_categories" ON directory_categories;
DROP POLICY IF EXISTS "Allow admin insert to directory_variables" ON directory_variables;
DROP POLICY IF EXISTS "Allow admin update to directory_variables" ON directory_variables;
DROP POLICY IF EXISTS "Allow admin delete from directory_variables" ON directory_variables;

-- Recreate directory table policies using the function
CREATE POLICY "Allow admin insert to directory_templates"
    ON directory_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Allow admin update to directory_templates"
    ON directory_templates
    FOR UPDATE
    TO authenticated
    USING (is_admin_user(auth.uid()));

CREATE POLICY "Allow admin delete from directory_templates"
    ON directory_templates
    FOR DELETE
    TO authenticated
    USING (is_admin_user(auth.uid()));

CREATE POLICY "Allow admin insert to directory_categories"
    ON directory_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Allow admin update to directory_categories"
    ON directory_categories
    FOR UPDATE
    TO authenticated
    USING (is_admin_user(auth.uid()));

CREATE POLICY "Allow admin delete from directory_categories"
    ON directory_categories
    FOR DELETE
    TO authenticated
    USING (is_admin_user(auth.uid()));

CREATE POLICY "Allow admin insert to directory_variables"
    ON directory_variables
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Allow admin update to directory_variables"
    ON directory_variables
    FOR UPDATE
    TO authenticated
    USING (is_admin_user(auth.uid()));

CREATE POLICY "Allow admin delete from directory_variables"
    ON directory_variables
    FOR DELETE
    TO authenticated
    USING (is_admin_user(auth.uid()));
