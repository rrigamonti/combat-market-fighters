-- Create storage bucket for fighter hero images
INSERT INTO storage.buckets (id, name, public)
VALUES ('fighter-heroes', 'fighter-heroes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Hero images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'fighter-heroes');

-- Allow admins to upload hero images
CREATE POLICY "Admins can upload hero images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fighter-heroes' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update hero images
CREATE POLICY "Admins can update hero images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fighter-heroes' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete hero images
CREATE POLICY "Admins can delete hero images"
ON storage.objects FOR DELETE
USING (bucket_id = 'fighter-heroes' AND public.has_role(auth.uid(), 'admin'));