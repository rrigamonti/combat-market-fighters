-- Add new required columns to fighters table
ALTER TABLE public.fighters 
ADD COLUMN app_username text,
ADD COLUMN profile_image_url text;

-- Make short_bio required (cannot be null)
-- First update any existing null values
UPDATE public.fighters SET short_bio = '' WHERE short_bio IS NULL;
ALTER TABLE public.fighters ALTER COLUMN short_bio SET NOT NULL;

-- Create storage bucket for fighter avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('fighter-avatars', 'fighter-avatars', true);

-- RLS policy: Anyone can view fighter avatars (public bucket)
CREATE POLICY "Anyone can view fighter avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fighter-avatars');

-- RLS policy: Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'fighter-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'fighter-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'fighter-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);