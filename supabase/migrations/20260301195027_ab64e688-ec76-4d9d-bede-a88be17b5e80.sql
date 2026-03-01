
-- Trigger to increment coupon used_count on redemption
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_coupon_redeemed
AFTER INSERT ON public.coupon_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.increment_coupon_usage();
