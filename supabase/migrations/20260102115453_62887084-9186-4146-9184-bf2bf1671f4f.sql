-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  price TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  category TEXT,
  short_description TEXT,
  long_description TEXT,
  external_url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fighter_products junction table
CREATE TABLE public.fighter_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fighter_id UUID NOT NULL REFERENCES public.fighters(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fighter_id, product_id)
);

-- Enable RLS on both tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fighter_products ENABLE ROW LEVEL SECURITY;

-- Products RLS: Anyone can view active products
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (active = true);

-- Products RLS: Admins can do everything
CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fighter products RLS: Anyone can view (for public storefronts)
CREATE POLICY "Anyone can view fighter products"
ON public.fighter_products
FOR SELECT
USING (true);

-- Fighter products RLS: Admins can manage assignments
CREATE POLICY "Admins can manage fighter products"
ON public.fighter_products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to update any fighter's status
CREATE POLICY "Admins can update any fighter"
ON public.fighters
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add trigger for products updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();