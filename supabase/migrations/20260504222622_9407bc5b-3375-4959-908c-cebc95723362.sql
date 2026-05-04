-- ════════════════════════════════════════════════════════
-- 1) Realtime channel authorization (fix MISSING_REALTIME_RLS)
-- ════════════════════════════════════════════════════════
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to own topic" ON realtime.messages;
CREATE POLICY "Users can subscribe to own topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow only when topic equals the user's own UUID, or starts with "user:<uid>:"
  (realtime.topic() = auth.uid()::text)
  OR (realtime.topic() LIKE 'user:' || auth.uid()::text || ':%')
  OR (realtime.topic() = 'public')
);

-- ════════════════════════════════════════════════════════
-- 2) WhatsApp multi-tenant column for Evolution API isolation
-- ════════════════════════════════════════════════════════
ALTER TABLE public.advocacia_onboarding
  ADD COLUMN IF NOT EXISTS evolution_instance_name text,
  ADD COLUMN IF NOT EXISTS feature_lock boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.advocacia_onboarding.evolution_instance_name IS
  'Nome único da instância Evolution API por usuário (formato: clauthor_user_<uuid>). Garante isolamento LGPD entre escritórios.';
COMMENT ON COLUMN public.advocacia_onboarding.feature_lock IS
  'Quando true, bloqueia novas compras até integração WhatsApp multi-tenant ficar pronta.';