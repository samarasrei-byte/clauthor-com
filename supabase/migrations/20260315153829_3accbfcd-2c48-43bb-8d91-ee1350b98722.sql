
-- Final price increase ~20% to cover token costs properly
-- Starter: 29700 → 34700 (R$347)
UPDATE public.agents SET monthly_price = 34700 WHERE monthly_price = 29700;
-- Entry: 59700 → 69700 (R$697)
UPDATE public.agents SET monthly_price = 69700 WHERE monthly_price = 59700;
-- Mid: 99700 → 119700 (R$1.197)
UPDATE public.agents SET monthly_price = 119700 WHERE monthly_price = 99700;
-- Premium: 299700 → 349700 (R$3.497)
UPDATE public.agents SET monthly_price = 349700 WHERE monthly_price = 299700;
