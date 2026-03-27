-- Create a secure function to redeem coupons server-side
CREATE OR REPLACE FUNCTION public.redeem_coupon(_user_id uuid, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_existing RECORD;
  v_credits RECORD;
  v_result jsonb;
BEGIN
  -- 1. Find coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = upper(trim(_code))
    AND is_active = true;

  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object('error', 'Cupom não encontrado ou inválido.');
  END IF;

  -- 2. Check expiration
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Este cupom expirou.');
  END IF;

  -- 3. Check max uses
  IF v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('error', 'Este cupom já atingiu o limite de uso.');
  END IF;

  -- 4. Check if already redeemed
  SELECT id INTO v_existing
  FROM public.coupon_redemptions
  WHERE coupon_id = v_coupon.id AND user_id = _user_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Você já resgatou este cupom.');
  END IF;

  -- 5. Add credits
  IF v_coupon.credits_amount > 0 THEN
    UPDATE public.user_credits
    SET total_credits = total_credits + v_coupon.credits_amount,
        plan_type = COALESCE(v_coupon.plan_upgrade, plan_type),
        updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  -- 6. Record redemption
  INSERT INTO public.coupon_redemptions (coupon_id, user_id)
  VALUES (v_coupon.id, _user_id);

  -- 7. Increment used_count
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = v_coupon.id;

  RETURN jsonb_build_object(
    'success', true,
    'credits_amount', v_coupon.credits_amount,
    'plan_upgrade', v_coupon.plan_upgrade
  );
END;
$$;