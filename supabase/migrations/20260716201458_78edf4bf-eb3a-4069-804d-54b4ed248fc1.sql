ALTER TABLE public.contracted_departments DROP CONSTRAINT IF EXISTS contracted_departments_status_check;
ALTER TABLE public.contracted_departments
  ADD CONSTRAINT contracted_departments_status_check
  CHECK (status IN ('active','pending_payment','cancelled'));