
CREATE TABLE public.platform_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_name TEXT NOT NULL,
  credential_key TEXT NOT NULL,
  credential_value TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(integration_name, credential_key)
);

ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can manage platform credentials
CREATE POLICY "Admins can manage platform credentials"
  ON public.platform_credentials
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_platform_credentials_updated_at
  BEFORE UPDATE ON public.platform_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
