-- Add pending_changes column to store fighter-submitted profile changes awaiting admin approval
ALTER TABLE public.fighters 
ADD COLUMN pending_changes jsonb DEFAULT NULL;

COMMENT ON COLUMN public.fighters.pending_changes IS 'Stores profile changes submitted by fighter awaiting admin approval';