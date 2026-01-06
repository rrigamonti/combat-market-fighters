-- Create brands table for managing brand icons
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Anyone can view brands
CREATE POLICY "Anyone can view brands"
ON public.brands
FOR SELECT
USING (true);

-- Admins can manage brands
CREATE POLICY "Admins can manage brands"
ON public.brands
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add brand_id and discount_percentage to products table
ALTER TABLE public.products
ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
ADD COLUMN discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Add social media URLs to fighters table
ALTER TABLE public.fighters
ADD COLUMN social_instagram TEXT,
ADD COLUMN social_twitter TEXT,
ADD COLUMN social_youtube TEXT,
ADD COLUMN social_tiktok TEXT,
ADD COLUMN social_facebook TEXT;