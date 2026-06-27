
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT CHECK (company_size IN ('solo','small','medium','large','enterprise'));

-- Schedule weekly benchmark collector (Mondays 04:00 UTC)
SELECT cron.schedule(
  'collect-benchmarks-weekly',
  '0 4 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://ihzfwkiqkwbgbgjjbeih.supabase.co/functions/v1/collect-benchmarks',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := '{}'::jsonb
  );
  $$
);
