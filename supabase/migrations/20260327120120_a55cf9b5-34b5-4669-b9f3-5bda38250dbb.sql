-- Create a secure function to lookup a coupon by code (instead of exposing the table)
CREATE OR REPLACE FUNCTION public.lookup_coupon_by_code(_code text)
RETURNS TABLE(
  id uuid,
  code text,
  credits_amount integer,
  plan_upgrade text,
  description text,
  max_uses integer,
  used_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.code, c.credits_amount, c.plan_upgrade, c.description, c.max_uses, c.used_count
  FROM public.coupons c
  WHERE c.code = _code
    AND c.is_active = true
    AND (c.expires_at IS NULL OR c.expires_at > now())
    AND c.used_count < c.max_uses
  LIMIT 1;
$$;