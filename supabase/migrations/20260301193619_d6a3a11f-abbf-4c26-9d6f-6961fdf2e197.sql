
-- Tabela de cupons
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text DEFAULT '',
  credits_amount integer NOT NULL DEFAULT 0,
  plan_upgrade text DEFAULT NULL,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de resgates
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Coupons: admins manage, authenticated can view active
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view active coupons" ON public.coupons FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- Redemptions: users manage own
CREATE POLICY "Users can insert own redemptions" ON public.coupon_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own redemptions" ON public.coupon_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all redemptions" ON public.coupon_redemptions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
