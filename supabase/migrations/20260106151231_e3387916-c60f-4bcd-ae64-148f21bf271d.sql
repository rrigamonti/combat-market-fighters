-- Create brand-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true);

-- Allow public read access to brand logos
CREATE POLICY "Anyone can view brand logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

-- Allow authenticated admins to upload brand logos
CREATE POLICY "Admins can upload brand logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brand-logos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update brand logos
CREATE POLICY "Admins can update brand logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brand-logos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete brand logos
CREATE POLICY "Admins can delete brand logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brand-logos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);