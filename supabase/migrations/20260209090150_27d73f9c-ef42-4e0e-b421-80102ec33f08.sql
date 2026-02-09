-- Create waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  name TEXT,
  company TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public waitlist)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- Only admins can view all entries
CREATE POLICY "Admins can view waitlist"
  ON public.waitlist FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update/delete
CREATE POLICY "Admins can manage waitlist"
  ON public.waitlist FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at DESC);

-- Function to auto-increment position
CREATE OR REPLACE FUNCTION public.set_waitlist_position()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position FROM public.waitlist;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_waitlist_position
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.set_waitlist_position();

-- Trigger for updated_at
CREATE TRIGGER update_waitlist_updated_at
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();