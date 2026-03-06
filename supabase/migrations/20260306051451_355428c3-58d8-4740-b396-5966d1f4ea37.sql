
-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Validated waitlist signup" ON public.waitlist;

-- Recreate as PERMISSIVE so anon/authenticated users can insert
CREATE POLICY "Validated waitlist signup"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL 
  AND whatsapp IS NOT NULL 
  AND length(email) <= 255 
  AND length(whatsapp) <= 20 
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);
