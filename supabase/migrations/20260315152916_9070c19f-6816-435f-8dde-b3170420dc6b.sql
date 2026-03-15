
-- Update all agents with market-competitive prices (in centavos)
-- Mapping: basic→starter(19700), intermediate→entry(39700), advanced→mid(69700), enterprise→premium(219700)

UPDATE public.agents SET monthly_price = 19700 
WHERE name = 'Atendimento WhatsApp' AND monthly_price = 0;

UPDATE public.agents SET monthly_price = 39700 
WHERE name = 'Content Creator Agent' AND monthly_price = 0;

UPDATE public.agents SET monthly_price = 39700 
WHERE name = 'RAG Knowledge Agent' AND monthly_price = 0;

UPDATE public.agents SET monthly_price = 69700 
WHERE name = 'Customer Success Agent' AND monthly_price = 0;

UPDATE public.agents SET monthly_price = 69700 
WHERE name = 'Omnichannel Agent' AND monthly_price = 0;

UPDATE public.agents SET monthly_price = 69700 
WHERE name = 'Revenue Operations Agent' AND monthly_price = 0;

UPDATE public.agents SET monthly_price = 69700 
WHERE name = 'Sales & Prospecting Agent' AND monthly_price = 0;

UPDATE public.agents SET monthly_price = 69700 
WHERE name = 'SEO & Growth Agent' AND monthly_price = 0;

UPDATE public.agents SET monthly_price = 219700 
WHERE name = 'Voice AI Agent' AND monthly_price = 0;
