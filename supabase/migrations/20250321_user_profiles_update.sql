-- Update user_profiles table with additional profile fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS team_size TEXT,
ADD COLUMN IF NOT EXISTS usage_purpose TEXT;

-- Enable Row Level Security on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for profile images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_images',
  'profile_images',
  true, -- Set to public from the start
  2097152, -- 2MB limit
  '{image/jpeg,image/png,image/webp,image/gif}'
)
ON CONFLICT (id) DO UPDATE SET
  public = true, -- Ensure bucket is always public
  file_size_limit = 2097152,
  allowed_mime_types = '{image/jpeg,image/png,image/webp,image/gif}';

-- Set up security policies for the profile_images bucket
-- Public access policy for viewing profile images
CREATE POLICY "Public access to profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_images');

-- Restricted policies for upload/update/delete to the owning user
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile_images' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid AND
  (storage.foldername(name))[1]::uuid IS NOT NULL
);

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile_images' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile_images' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Add RLS policy for users to update their own profiles
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 