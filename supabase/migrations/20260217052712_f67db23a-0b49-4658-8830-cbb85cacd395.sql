-- Remove the overly permissive INSERT policy on waitlist
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

-- Create a proper INSERT policy that still allows public signups but validates data
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
WITH CHECK (
  email IS NOT NULL AND whatsapp IS NOT NULL
);

-- Add UPDATE/DELETE policies for subscriptions (users can only modify their own)
CREATE POLICY "Users can update own subscriptions"
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
ON public.subscriptions
FOR DELETE
USING (auth.uid() = user_id);