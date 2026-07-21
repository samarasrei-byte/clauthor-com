
CREATE TABLE public.paypal_sandbox_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create_order','capture_order','check_order')),
  status TEXT NOT NULL CHECK (status IN ('pending','approved','captured','failed','cancelled')),
  order_id TEXT,
  approve_url TEXT,
  amount NUMERIC(10,2),
  currency TEXT DEFAULT 'BRL',
  description TEXT,
  raw_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paypal_sandbox_tests_admin ON public.paypal_sandbox_tests(admin_user_id, created_at DESC);
CREATE INDEX idx_paypal_sandbox_tests_order ON public.paypal_sandbox_tests(order_id);

GRANT SELECT, INSERT, UPDATE ON public.paypal_sandbox_tests TO authenticated;
GRANT ALL ON public.paypal_sandbox_tests TO service_role;

ALTER TABLE public.paypal_sandbox_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all sandbox tests"
  ON public.paypal_sandbox_tests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sandbox tests"
  ON public.paypal_sandbox_tests FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_user_id = auth.uid());

CREATE POLICY "Admins can update sandbox tests"
  ON public.paypal_sandbox_tests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_paypal_sandbox_tests_updated_at
  BEFORE UPDATE ON public.paypal_sandbox_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
