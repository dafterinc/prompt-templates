-- Create template categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (name, user_id)
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create variables table to store template variables
CREATE TABLE IF NOT EXISTS variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  default_value TEXT,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (template_id, name)
);

-- Create Row Level Security (RLS) policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE variables ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view their own categories" 
  ON categories FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own categories" 
  ON categories FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own categories" 
  ON categories FOR UPDATE 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own categories" 
  ON categories FOR DELETE 
  USING (user_id = auth.uid());

-- Templates policies
CREATE POLICY "Users can view their own templates" 
  ON templates FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own templates" 
  ON templates FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates" 
  ON templates FOR UPDATE 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates" 
  ON templates FOR DELETE 
  USING (user_id = auth.uid());

-- Variables policies
CREATE POLICY "Users can view variables of their templates" 
  ON variables FOR SELECT 
  USING (template_id IN (SELECT id FROM templates WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert variables to their templates" 
  ON variables FOR INSERT 
  WITH CHECK (template_id IN (SELECT id FROM templates WHERE user_id = auth.uid()));

CREATE POLICY "Users can update variables of their templates" 
  ON variables FOR UPDATE 
  USING (template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())) 
  WITH CHECK (template_id IN (SELECT id FROM templates WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete variables of their templates" 
  ON variables FOR DELETE 
  USING (template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())); 