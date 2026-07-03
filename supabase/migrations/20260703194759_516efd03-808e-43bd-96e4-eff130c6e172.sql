
CREATE TABLE IF NOT EXISTS public.signed_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('clicksign','docusign')),
  external_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  signer_email text,
  signer_name text,
  document_name text,
  signed_at timestamptz,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_signed_documents_user ON public.signed_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_signed_documents_status ON public.signed_documents(status);

GRANT SELECT, INSERT, UPDATE ON public.signed_documents TO authenticated;
GRANT ALL ON public.signed_documents TO service_role;

ALTER TABLE public.signed_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own signed documents"
  ON public.signed_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own signed documents"
  ON public.signed_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own signed documents"
  ON public.signed_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_signed_documents_updated_at
  BEFORE UPDATE ON public.signed_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
