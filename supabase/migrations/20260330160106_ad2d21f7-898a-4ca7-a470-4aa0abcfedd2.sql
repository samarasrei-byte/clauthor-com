
-- CRITICAL: Remove user-facing INSERT on user_credits — only service_role/triggers should insert
-- The handle_new_user_credits trigger uses SECURITY DEFINER so it bypasses RLS
DROP POLICY IF EXISTS "System can insert credits" ON public.user_credits;

-- CRITICAL: Remove user-facing INSERT on payment_history — only edge functions (service_role) should insert
DROP POLICY IF EXISTS "Users can insert own payment history" ON public.payment_history;

-- CRITICAL: Remove user-facing INSERT on token_usage — only edge functions/triggers should insert
DROP POLICY IF EXISTS "Users can insert own usage" ON public.token_usage;
