-- Add hero image URL column to fighters table
ALTER TABLE public.fighters
ADD COLUMN hero_image_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.fighters.hero_image_url IS 'URL for the storefront hero/banner image';