-- Create table for storefront page views
CREATE TABLE public.storefront_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fighter_id UUID NOT NULL REFERENCES public.fighters(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  referrer TEXT,
  user_agent TEXT
);

-- Create table for product clicks (when user clicks affiliate link)
CREATE TABLE public.product_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fighter_id UUID NOT NULL REFERENCES public.fighters(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  referrer TEXT
);

-- Enable RLS
ALTER TABLE public.storefront_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (anonymous tracking)
CREATE POLICY "Anyone can insert storefront views"
ON public.storefront_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anyone can insert clicks (anonymous tracking)
CREATE POLICY "Anyone can insert product clicks"
ON public.product_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all analytics
CREATE POLICY "Admins can view storefront views"
ON public.storefront_views
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view product clicks"
ON public.product_clicks
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fighters can view their own analytics
CREATE POLICY "Fighters can view own storefront views"
ON public.storefront_views
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fighters
    WHERE fighters.id = storefront_views.fighter_id
    AND fighters.user_id = auth.uid()
  )
);

CREATE POLICY "Fighters can view own product clicks"
ON public.product_clicks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fighters
    WHERE fighters.id = product_clicks.fighter_id
    AND fighters.user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_storefront_views_fighter_id ON public.storefront_views(fighter_id);
CREATE INDEX idx_storefront_views_viewed_at ON public.storefront_views(viewed_at);
CREATE INDEX idx_product_clicks_fighter_id ON public.product_clicks(fighter_id);
CREATE INDEX idx_product_clicks_product_id ON public.product_clicks(product_id);
CREATE INDEX idx_product_clicks_clicked_at ON public.product_clicks(clicked_at);