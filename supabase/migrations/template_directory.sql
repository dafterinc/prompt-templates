-- Create table for directory categories
CREATE TABLE IF NOT EXISTS directory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for directory templates
CREATE TABLE IF NOT EXISTS directory_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category_id UUID REFERENCES directory_categories(id),
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for directory template variables
CREATE TABLE IF NOT EXISTS directory_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES directory_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'text',
    default_value TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_directory_templates_category_id ON directory_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_directory_variables_template_id ON directory_variables(template_id);
CREATE INDEX IF NOT EXISTS idx_directory_templates_featured ON directory_templates(featured);

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the updated_at column
CREATE TRIGGER set_timestamp_directory_categories
BEFORE UPDATE ON directory_categories
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_directory_templates
BEFORE UPDATE ON directory_templates
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_directory_variables
BEFORE UPDATE ON directory_variables
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Open access to directory tables for public reading
ALTER TABLE directory_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to directory_templates"
    ON directory_templates
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to directory_categories"
    ON directory_categories
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to directory_variables"
    ON directory_variables
    FOR SELECT
    USING (true);

-- Create profiles table for admin status
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for the updated_at column
CREATE TRIGGER set_timestamp_user_profiles
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Only allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
    ON user_profiles
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    ));

-- Replace auth.users is_admin references in RLS policies

-- Only allow admins to insert/update/delete
CREATE POLICY "Allow admin insert to directory_templates"
    ON directory_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    ));

CREATE POLICY "Allow admin update to directory_templates"
    ON directory_templates
    FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    ));

CREATE POLICY "Allow admin delete from directory_templates"
    ON directory_templates
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    ));

-- Repeat for other tables
CREATE POLICY "Allow admin insert to directory_categories"
    ON directory_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    ));

CREATE POLICY "Allow admin update to directory_categories"
    ON directory_categories
    FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    ));

CREATE POLICY "Allow admin delete from directory_categories"
    ON directory_categories
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    ));

CREATE POLICY "Allow admin insert to directory_variables"
    ON directory_variables
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    ));

CREATE POLICY "Allow admin update to directory_variables"
    ON directory_variables
    FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    ));

CREATE POLICY "Allow admin delete from directory_variables"
    ON directory_variables
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    )); 