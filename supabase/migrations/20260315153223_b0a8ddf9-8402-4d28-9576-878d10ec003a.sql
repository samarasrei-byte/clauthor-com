
-- Increase all agent prices ~35% to better reflect market value
-- Basic/Starter: 19700 → 29700
UPDATE public.agents SET monthly_price = 29700 WHERE monthly_price = 19700;
-- Intermediate/Entry: 39700 → 59700
UPDATE public.agents SET monthly_price = 59700 WHERE monthly_price = 39700;
-- Advanced/Mid: 69700 → 99700
UPDATE public.agents SET monthly_price = 99700 WHERE monthly_price = 69700;
-- Test agent (50000) → 99700 (align with advanced tier)
UPDATE public.agents SET monthly_price = 99700 WHERE monthly_price = 50000;
-- Enterprise/Premium: 219700 → 299700
UPDATE public.agents SET monthly_price = 299700 WHERE monthly_price = 219700;
